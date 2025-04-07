"use server"

import getUserIdFromAuthOrToken from "@/lib/authUtils";
import { createView, deleteView, getUserDefaultViewId } from "@/lib/contexts/viewContext";
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

export async function deleteViewAction(
    viewId: string,
    token?: string | null,
    context?: string
) {
    try {
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(
                ServerActionReason.UNAUTHORIZED,
                "Unauthorized access"
            );
        }

        // Get user's default view
        const defaultViewId = await getUserDefaultViewId(userId);

        if (!defaultViewId) {
            return createErrorResponse(
                ServerActionReason.CONFLICT,
                "User doesn't have a default view"
            );
        }

        // Check if trying to delete the default view
        if (viewId === defaultViewId) {
            return createErrorResponse(
                ServerActionReason.FORBIDDEN,
                "Cannot delete the default view"
            );
        }

        // Delete the view (this will also update associated devices)
        await deleteView(viewId, defaultViewId);

        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            "View deleted successfully",
            null
        );
    } catch (error) {
        console.error('Error deleting view:', error);
        return createErrorResponse();
    }
}