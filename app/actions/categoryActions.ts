"use server";
import { createCategory, editCategory } from "@/lib/contexts/categoriesContext";
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
                message || "Invalid data provided"
            );
        } else {
            return createErrorResponse();
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
                message || "Invalid data provided"
            );
        } else {
            return createErrorResponse();
        }
    }
}


