"use server";

import getUserIdFromAuthOrToken from "@/lib/authUtils";
import { createErrorResponse, createSuccessResponse, ServerActionReason } from "@/types/types";
import db from "@/lib/prisma";

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
                {
                    body: {
                        groupSensorIds,
                        startDate,
                        endDate,
                        token,
                        context
                    }
                }
            );
        }

        if (!groupSensorIds.length) {
            return createErrorResponse(
                ServerActionReason.INVALID_DATA,
                "No sensors selected",
                {
                    body: {
                        groupSensorIds,
                        startDate,
                        endDate,
                        token,
                        context
                    }
                }
            );
        }

        // Verify user has access to these group sensors
        const accessCheck = await db.groupSensor.findMany({
            where: {
                id: { in: groupSensorIds },
                Group: {
                    Device: {
                        userId
                    }
                }
            },
            select: {
                id: true,
                Sensor: {
                    select: {
                        name: true,
                        unit: true,
                        Category: {
                            select: {
                                name: true,
                                color: true
                            }
                        }
                    }
                }
            }
        });

        if (accessCheck.length !== groupSensorIds.length) {
            return createErrorResponse(
                ServerActionReason.FORBIDDEN,
                "You don't have access to some of the selected sensors",
                {
                    body: {
                        groupSensorIds,
                        startDate,
                        endDate,
                        token,
                        context
                    },
                    results: {
                        accessCheck
                    }
                }
            );
        }

        // Get sensor values for the given group sensors within the date range
        const sensorValues = await db.sensorValue.findMany({
            where: {
                groupSensorId: { in: groupSensorIds },
                timestamp: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                timestamp: 'asc'
            }
        });

        // Group by sensor ID for easier consumption by charts
        const groupedValues = groupSensorIds.reduce((acc, sensorId) => {
            const sensorInfo = accessCheck.find(s => s.id === sensorId);
            const values = sensorValues.filter(v => v.groupSensorId === sensorId);

            acc[sensorId] = {
                name: sensorInfo?.Sensor.name || "Unknown Sensor",
                unit: sensorInfo?.Sensor.unit || "",
                color: sensorInfo?.Sensor.Category?.color || "#000000",
                values: values.map(v => ({
                    timestamp: v.timestamp,
                    value: v.value
                }))
            };

            return acc;
        }, {} as Record<string, { name: string; color: string; unit: string; values: { timestamp: Date; value: number }[] }>);

        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            "Sensor values retrieved successfully",
            groupedValues
        );
    } catch (error) {
        return createErrorResponse(
            ServerActionReason.INTERNAL_ERROR,
            "Failed to retrieve sensor values",
            { error }
        );
    }
}