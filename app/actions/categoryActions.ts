"use server";
import getUserIdFromAuthOrToken from "@/lib/authUtils";
import { createCategory, deleteCategory, editCategory, getUserCategoriesWithSensorCount } from "@/lib/contexts/categoriesContext";
import { CreateCategoryFormData, createErrorResponse, createSuccessResponse, ServerActionReason, ServerActionResponse } from "@/types/types";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function createCategoryAction(data: CreateCategoryFormData) {
    try {
        const category = await createCategory(data);

        return createSuccessResponse(ServerActionReason.CREATED, "Category created successfully", category);
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            let message: string = "";
            if (error.code === "P2002") {
                message = "Category name must be unique";
            }
            return createErrorResponse(
                ServerActionReason.INVALID_DATA,
                message || "Invalid data provided",
                error
            );
        } else {
            return createErrorResponse(ServerActionReason.UNKNOWN_ERROR, "An unknown error occurred", {
                error,
                body: {
                    data: data
                }
            });
        }
    }
}
export async function editCategoryAction(data: CreateCategoryFormData, categoryId: string) {
    try {
        const category = await editCategory(data, categoryId);
        return createSuccessResponse(ServerActionReason.SUCCESS, "Category updated successfully", category);
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            let message: string = "";
            if (error.code === "P2002") {
                message = "Category name must be unique";
            }
            return createErrorResponse(
                ServerActionReason.INVALID_DATA,
                message || "Invalid data provided",
                {
                    error,
                    body: {
                        categoryId: categoryId,
                        data: data
                    }
                }
            );
        } else {
            return createErrorResponse(ServerActionReason.UNKNOWN_ERROR, "An unknown error occurred", {
                error,
                body: {
                    categoryId: categoryId,
                    data: data
                }
            });
        }
    }
}
export async function getCategoriesWithSensorCountAction(token?: string, context?: string) {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(ServerActionReason.UNAUTHORIZED, "Unauthorized", {
            body: {
                userId: userId,
                context: context,
                token: token
            }
        });
    }
    const categories = await getUserCategoriesWithSensorCount(userId)
    if (!categories) {
        return createErrorResponse(ServerActionReason.NOT_FOUND, "No categories found", {
            body: {
                userId: userId,
                context: context,
                token: token,
                categories: categories
            }
        });
    }
    return createSuccessResponse(ServerActionReason.SUCCESS, "Categories fetched successfully", categories);
}
export async function deleteCategoryAction(categoryId: string, token?: string, context?: string) {
    const userId = await getUserIdFromAuthOrToken(token, context);
    try {
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "Unauthorized", {
                body: {
                    userId: userId,
                    context: context,
                    token: token,
                    categoryId: categoryId
                }
            });
        }
        await deleteCategory(userId, categoryId);
        return createSuccessResponse(ServerActionReason.SUCCESS, "Category deleted successfully", null);
    } catch (error) {
        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, "Failed to delete category", {
            error,
            body: {
                userId: userId,
                context: context,
                token: token,
                categoryId: categoryId
            }
        });
    }
}

