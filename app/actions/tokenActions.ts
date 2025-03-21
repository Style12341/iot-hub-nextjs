"use server";
import { upsertToken } from "@/lib/contexts/userTokensContext";
import { createErrorResponse, createSuccessResponse, CreateTokenFormData, ServerActionReason, ServerActionResponse } from "@/types/types";


export async function createTokenAction(data: CreateTokenFormData) {
    try {
        const token = await upsertToken(data.userId, data.context);
        const response = createSuccessResponse(ServerActionReason.CREATED, "Token created successfully", token);
        return response;
    } catch (error) {
        console.error(error);
        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, "Failed to create token");
    }
}