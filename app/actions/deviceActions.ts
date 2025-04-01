"use server";

import getUserIdFromAuthOrToken from "@/lib/authUtils";
import { createDevice, getDevicesQty, getDevicesViewWithActiveSensorsBetween, getDeviceViewWithActiveSensorsBetween, getDevicesWithActiveSensors, getDeviceWithActiveSensors, getDeviceActiveView, getDevicesWithViews } from "@/lib/contexts/deviceContext";

import { getAllUserViews } from "@/lib/contexts/userContext";
import { CreateDeviceFormData, createErrorResponse, createSuccessResponse, ServerActionReason, ServerActionResponse } from "@/types/types";
import { auth } from "@clerk/nextjs/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

/**
 * Creates a new device given the formdata
 * @param data The form data to create the device
 */
export async function createDeviceAction(data: CreateDeviceFormData) {
    try {
        console.log(data)
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
            console.error(error);
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
/**
 * Gets all devices for the logged in user or the given token.
 * Returns a paginated list of devices with the active sensors of the active group
 * @param page The page number to retrieve (default: 1)
 * @param token The token to use for authentication (optional)
 * @param context The context to use for authentication (optional)
 * @returns A paginated list of devices with the active sensors of the active group
 */
export async function getDevicesWithActiveSensorsAction(page: number = 1, token?: string | null, context?: string) {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "Unauthorized access"
        );
    }
    const res = await getDevicesWithActiveSensors(userId, page);
    return createSuccessResponse(ServerActionReason.SUCCESS, "Devices retrieved successfully", res);
}
/**
 * Gets all devices for the logged in user or the given token with their assigned view.
 * Returns a list of devices with the active sensors of the active group
 * @param page The page number to retrieve (default: 1)
 * @param token The token to use for authentication (optional)
 * @param context The context to use for authentication (optional)
 * @returns A list of devices with the active sensors of the active group
 */
export async function getDevicesListWithDataAction(page: number = 1, token?: string | null, context?: string) {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "Unauthorized access"
        );
    }
    const res = await getDevicesWithViews(userId, 1);
    return createSuccessResponse(ServerActionReason.SUCCESS, "Devices retrieved successfully", res);
}
/**
 * Gets the quantity of devices for the logged in user or the given token.
 */
export async function getDevicesQtyAction(token?: string | null, context?: string) {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "Unauthorized access"
        );
    }
    const res = await getDevicesQty(userId);

    return createSuccessResponse(ServerActionReason.SUCCESS, "Devices quantity retrieved successfully", res);
}
/**
 * Get all views for the logged in user or the given token.
 * Returns the views name and device count
 */
export async function getAllUserViewsAction(token?: string | null, context?: string) {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "Unauthorized access"
        );
    }
    const res = await getAllUserViews(userId);
    return createSuccessResponse(ServerActionReason.SUCCESS, "Views retrieved successfully", res);
}
/**
 * Gets the device with the given id for the logged in user or the given token.
 * Returns the device with the active sensors of the active group
 * @param deviceId The id of the device to retrieve
 * @param token The token to use for authentication (optional)
 * @param context The context to use for authentication (optional)
 */
export async function getDeviceWithActiveSensorsAction(deviceId: string, token?: string | null, context?: string) {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "Unauthorized access"
        );
    }
    const device = await getDeviceWithActiveSensors(userId, deviceId);

    return createSuccessResponse(ServerActionReason.SUCCESS, "Device retrieved successfully", device);
}
/**
 * Gets the devices of a specific view with the active sensors of the active group for the logged in user or the given token.
 */
export async function getDevicesViewWithActiveSensorsBetweenAction(view: string, startDate: Date, endDate: Date, token?: string | null, context?: string) {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "Unauthorized access"
        );
    }
    const res = await getDevicesViewWithActiveSensorsBetween(userId, view, startDate, endDate);
    return createSuccessResponse(ServerActionReason.SUCCESS, "Devices view retrieved successfully", res);
}
/**
 * Gets the device view with the active sensors of the active group for the logged in user or the given token.
 */
export async function getDeviceViewWithActiveSensorsBetweenAction(deviceId: string, view: string, startDate: Date, endDate: Date, token?: string | null, context?: string) {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "Unauthorized access"
        );
    }
    const res = await getDeviceViewWithActiveSensorsBetween(userId, deviceId, view, startDate, endDate);
    return createSuccessResponse(ServerActionReason.SUCCESS, "Device view retrieved successfully", res);
}
export async function getDeviceActiveViewWithActiveSensorsBetweenAction(deviceId: string, startDate: Date, endDate: Date, token?: string | null, context?: string) {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
        return createErrorResponse(
            ServerActionReason.UNAUTHORIZED,
            "Unauthorized access"
        );
    }
    const view = await getDeviceActiveView(userId, deviceId);
    const name = view?.name ?? "Default";
    const res = await getDeviceViewWithActiveSensorsBetween(userId, deviceId, name, startDate, endDate);
    return createSuccessResponse(ServerActionReason.SUCCESS, "Device view retrieved successfully", res);
}