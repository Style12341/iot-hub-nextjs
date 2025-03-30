"use server"

import getUserIdFromAuthOrToken from "@/lib/authUtils";
import { getMetricValueBetween } from "@/lib/contexts/metricsContext"
import { createErrorResponse, createSuccessResponse, ServerActionReason } from "@/types/types";


export async function getSensorValuesMetricBetween(start: Date, end: Date, token?: string | null, context?: string) {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "Unauthorized access"
        );
    }
    const res = await getMetricValueBetween("SENSOR_VALUES_PER_MINUTE", userId, start, end);
    return createSuccessResponse(ServerActionReason.SUCCESS, "Sensor values metric retrieved successfully", res);
}
