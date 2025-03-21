"use server";

import { createDevice, getDevicesWithActiveSensors, getDeviceWithActiveSensors } from "@/lib/contexts/deviceContext";
import { CreateDeviceFormData, createErrorResponse, createSuccessResponse, ServerActionReason, ServerActionResponse } from "@/types/types";
import { auth } from "@clerk/nextjs/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function createDeviceAction(data: CreateDeviceFormData) {
    try {
        // Server side validations
        const { userId } = await auth();
        if (!userId) {
            return createErrorResponse(
                ServerActionReason.UNAUTHORIZED,
                "You must be logged in to create a device"
            )
        }
        data.userId = userId;

        const device = await createDevice(data);

        return createSuccessResponse(ServerActionReason.CREATED, "Device created successfully", device);
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            let message: string = "";
            if (error.code === "P2002") {
                message = "Device name must be unique";
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
export async function getDevicesWithActiveSensorsAction(userId: string) {
    return await getDevicesWithActiveSensors(userId);
}
export async function getDeviceWithActiveSensorsAction(deviceId: string) {
    const { userId } = await auth();
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "You must be logged in to view this device"
        );
    }
    const device = await getDeviceWithActiveSensors(userId, deviceId);

    return createSuccessResponse(ServerActionReason.SUCCESS, "Device retrieved successfully", device);
}