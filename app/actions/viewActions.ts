"use server"

import getUserIdFromAuthOrToken from "@/lib/authUtils";
import { createView, deleteView, getUserDefaultViewId, getViewById, updateView } from "@/lib/contexts/viewContext";
import { createErrorResponse, createSuccessResponse, CreateViewFormData, ServerActionReason } from "@/types/types";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function createViewAction(data: CreateViewFormData, token?: string, context?: string) {
    const { name, devicesIdsToTransfer } = data;
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "Unauthorized access",
            {
                body: {
                    token,
                    context,
                }
            }
        );
    }
    const view = await createView(userId, name, devicesIdsToTransfer ?? []);
    if (!view) {
        return createErrorResponse(
            ServerActionReason.INTERNAL_ERROR,
            "Failed to create view",
            {
                body: {
                    token,
                    context,
                }
            }
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
                "Unauthorized access",
                {
                    body: {
                        token,
                        context,
                    }
                }
            );
        }

        // Get user's default view
        const defaultViewId = await getUserDefaultViewId(userId);

        if (!defaultViewId) {
            return createErrorResponse(
                ServerActionReason.CONFLICT,
                "User doesn't have a default view",
                {
                    body: {
                        token,
                        context,
                    }
                }
            );
        }

        // Check if trying to delete the default view
        if (viewId === defaultViewId) {
            return createErrorResponse(
                ServerActionReason.FORBIDDEN,
                "Cannot delete the default view",
                {
                    body: {
                        token,
                        context,
                    }
                }
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
        return createErrorResponse(ServerActionReason.UNKNOWN_ERROR, "An error occurred while deleting the view",
            {
                error,
                body: {
                    token,
                    context,
                }
            });
    }
}
/**
 * Update an existing view
 */
export async function updateViewAction(
    data: {
        id: string;
        name: string;
        userId: string;
        devicesIdsToTransfer: string[];
    },
    token?: string | null,
    context?: string
) {
    try {
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(
                ServerActionReason.UNAUTHORIZED,
                "Unauthorized access",
                {
                    body: {
                        token,
                        context,
                    }
                }
            );
        }

        // Use the extracted context function to update the view and transfer devices
        const updatedViewWithCount = await updateView(
            data.id,
            userId,
            data.name,
            data.devicesIdsToTransfer
        );

        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            "View updated successfully",
            updatedViewWithCount
        );
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            return createErrorResponse(
                ServerActionReason.CONFLICT,
                "A view with this name already exists",
                error
            );
        }

        return createErrorResponse(ServerActionReason.UNKNOWN_ERROR, "An error occurred while updating the view",
            { error, body: { token, context } });
    }
}
/**
 * Get a view by ID
 */
export async function getViewByIdAction(
    viewId: string,
    token?: string | null,
    context?: string
) {
    try {
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(
                ServerActionReason.UNAUTHORIZED,
                "Unauthorized access",
                {}
            );
        }

        // Get the view from the database
        const view = await getViewById(userId, viewId);

        if (!view) {
            return createErrorResponse(
                ServerActionReason.NOT_FOUND,
                "View not found",
                {
                    body: {
                        token,
                        context,
                    }
                }
            );
        }

        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            "View retrieved successfully",
            view
        );
    } catch (error) {
        return createErrorResponse(ServerActionReason.UNKNOWN_ERROR, "An error occurred while retrieving the view", { error, body: { token, context } });

    }
}