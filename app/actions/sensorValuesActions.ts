"use server";

import getUserIdFromAuthOrToken from "@/lib/authUtils";
import { createErrorResponse, createSuccessResponse, ServerActionReason } from "@/types/types";
import { validateSensorAccess, getSensorValuesGrouped } from "@/lib/contexts/sensorValuesContext";

/**
 * Gets sensor values for given group sensors within a date range
 */
export async function getSensorValuesAction(
    groupSensorIds: string[],
    startDate: Date,
    endDate: Date,
    token?: string | null,
    context?: string
) {
    const userId = await getUserIdFromAuthOrToken(token, context);

    try {
        if (!userId) {
            return createErrorResponse(
                ServerActionReason.UNAUTHORIZED,
                "Unauthorized access",
                null
            );
        }

        if (!groupSensorIds.length) {
            return createErrorResponse(
                ServerActionReason.INVALID_DATA,
                "No sensors selected",
                null
            );
        }

        // Verify user has access to these group sensors and get sensor metadata
        const accessCheck = await validateSensorAccess(userId, groupSensorIds);

        if (accessCheck.length !== groupSensorIds.length) {
            return createErrorResponse(
                ServerActionReason.FORBIDDEN,
                "You don't have access to some of the selected sensors",
                null
            );
        }

        // Get raw sensor values - no sensor info, just timestamps and values
        const rawSensorValues = await getSensorValuesGrouped(
            groupSensorIds,
            startDate,
            endDate
        );
        // Combine sensor metadata with the raw values
        const mergedSensorData = groupSensorIds.reduce((result, sensorId) => {
            const sensorInfo = accessCheck.find(s => s.id === sensorId);
            result[sensorId] = {
                name: sensorInfo?.Sensor.name || "Unknown Sensor",
                unit: sensorInfo?.Sensor.unit || "",
                color: sensorInfo?.Sensor.Category?.color || "#000000",
                values: rawSensorValues[sensorId] || []
            };

            return result;
        }, {} as Record<string, { name: string; color: string; unit: string; values: { timestamp: Date; value: number }[] }>);
        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            "Sensor values retrieved successfully",
            mergedSensorData
        );
    } catch (error) {
        console.error("Error in getSensorValuesAction:", error);
        return createErrorResponse(
            ServerActionReason.INTERNAL_ERROR,
            "Failed to retrieve sensor values",
            { error }
        );
    }
}