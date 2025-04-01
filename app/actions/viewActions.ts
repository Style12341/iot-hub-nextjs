"use server"

import getUserIdFromAuthOrToken from "@/lib/authUtils";
import { createView } from "@/lib/contexts/viewContext";
import { createErrorResponse, createSuccessResponse, CreateViewFormData, ServerActionReason } from "@/types/types";


export async function createViewAction(data: CreateViewFormData, token?: string, context?: string) {
    const { name, devicesIdsToTransfer } = data;
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "Unauthorized access"
        );
    }
    const view = await createView(userId, name, devicesIdsToTransfer ?? []);
    if (!view) {
        return createErrorResponse(
            ServerActionReason.INTERNAL_ERROR,
            "Failed to create view"
        );
    }
    return createSuccessResponse(ServerActionReason.SUCCESS, "View created successfully", view);
}