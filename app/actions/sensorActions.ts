"use server"

import getUserIdFromAuthOrToken from "@/lib/authUtils";
import { getSensorsQty } from "@/lib/contexts/sensorContext";
import { createErrorResponse, createSuccessResponse, ServerActionReason } from "@/types/types";

export async function getSensorsQtyAction(token?: string | null, context?: string) {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "Unauthorized access"
        );
    }
    const res = await getSensorsQty(userId);
    return createSuccessResponse(ServerActionReason.SUCCESS, "Sensors retrieved successfully", res);
}