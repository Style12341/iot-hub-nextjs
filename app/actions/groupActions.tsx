"use server";

import { createErrorResponse, createSuccessResponse, ServerActionReason, ServerActionResponse } from "@/types/types";
import { validateDeviceOwnership, updateDeviceActiveGroup } from "@/lib/contexts/deviceContext";
import { Group, Sensor } from "@prisma/client";
import {
    getDeviceGroups,
    getDeviceActiveGroupId,
    isActiveGroup,
    deleteGroup,
    createGroup,
    updateGroup,
    getDeviceSensors,
    getGroupSensorStates
} from "@/lib/contexts/groupContext";
import getUserIdFromAuthOrToken from "@/lib/authUtils";
// Add a new interface for sensors with active state
interface SensorWithActiveState extends Sensor {
    isActive: boolean;
}

export async function getDeviceSensorsAction(
    deviceId: string,
    groupId?: string,
    token?: string | null,
    context?: string
): Promise<ServerActionResponse<SensorWithActiveState[]>> {
    try {
        // Get user ID from auth or token
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in");
        }

        // Validate device ownership
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device");
        }

        // Get all sensors for the device
        const sensors = await getDeviceSensors(deviceId);

        // If groupId is provided, get active status for each sensor
        let sensorWithActiveState: SensorWithActiveState[] = sensors.map(s => ({ ...s, isActive: true }));

        if (groupId) {
            const activeSensors = await getGroupSensorStates(groupId);

            // Mark sensors as active/inactive based on group sensor states
            sensorWithActiveState = sensors.map(sensor => ({
                ...sensor,
                isActive: activeSensors.some(as => as.sensorId === sensor.id && as.active)
            }));
        }

        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            "Device sensors retrieved successfully",
            sensorWithActiveState
        );
    } catch (error) {
        console.error("Error fetching device sensors:", error);
        return createErrorResponse();
    }
}

/**
 * Get all groups for a device
 */
export async function getDeviceGroupsAction(
    deviceId: string,
    token?: string | null,
    context?: string
) {
    try {
        // Get user ID from auth or token
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in");
        }

        // Validate device ownership
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device");
        }

        // Get groups and active group ID
        const [groups, activeGroupId] = await Promise.all([
            getDeviceGroups(deviceId),
            getDeviceActiveGroupId(deviceId)
        ]);

        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            "Groups retrieved successfully",
            {
                groups,
                activeGroupId
            }
        );
    } catch (error) {
        console.error("Error fetching device groups:", error);
        return createErrorResponse();
    }
}

/**
 * Set a group as active for a device
 */
export async function setActiveGroupAction(
    deviceId: string,
    groupId: string,
    token?: string | null,
    context?: string
): Promise<ServerActionResponse> {
    try {
        // Get user ID from auth or token
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in");
        }

        // Validate device ownership
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device");
        }

        // Update active group
        await updateDeviceActiveGroup(deviceId, groupId);

        return createSuccessResponse(ServerActionReason.SUCCESS, "Active group updated", null);
    } catch (error) {
        console.error("Error setting active group:", error);
        return createErrorResponse();
    }
}

/**
 * Delete a group
 */
export async function deleteGroupAction(
    deviceId: string,
    groupId: string,
    token?: string | null,
    context?: string
): Promise<ServerActionResponse> {
    try {
        // Get user ID from auth or token
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in");
        }

        // Validate device ownership
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device");
        }

        // Check if this is the active group
        const activeGroupCheck = await isActiveGroup(deviceId, groupId);
        if (activeGroupCheck) {
            return createErrorResponse(
                ServerActionReason.CONFLICT,
                "Cannot delete the active group. Set another group as active first."
            );
        }

        // Delete the group
        await deleteGroup(groupId);

        return createSuccessResponse(ServerActionReason.SUCCESS, "Group deleted successfully", null);
    } catch (error) {
        console.error("Error deleting group:", error);
        return createErrorResponse();
    }
}

/**
 * Create a new group
 */
export async function createGroupAction(
    deviceId: string,
    name: string,
    activeSensorIds: string[] = [], // Add activeSensorIds parameter with default empty array
    token?: string | null,
    context?: string
): Promise<ServerActionResponse<Group>> {
    try {
        // Get user ID from auth or token
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in");
        }

        // Validate device ownership
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device");
        }

        // Create the group with active sensors
        const group = await createGroup(deviceId, name, activeSensorIds);

        return createSuccessResponse(ServerActionReason.CREATED, "Group created successfully", group);
    } catch (error) {
        console.error("Error creating group:", error);
        return createErrorResponse();
    }
}

/**
 * Update a group
 */
export async function updateGroupAction(
    deviceId: string,
    groupId: string,
    name: string,
    activeSensorIds: string[] = [], // Add activeSensorIds parameter with default empty array
    token?: string | null,
    context?: string
): Promise<ServerActionResponse<Group>> {
    try {
        // Get user ID from auth or token
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in");
        }

        // Validate device ownership
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device");
        }

        // Update the group with active sensors
        const group = await updateGroup(groupId, name, activeSensorIds);

        return createSuccessResponse(ServerActionReason.SUCCESS, "Group updated successfully", group);
    } catch (error) {
        console.error("Error updating group:", error);
        return createErrorResponse();
    }
}