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
import { error } from "console";
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
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in", {
                body: {
                    deviceId,
                    groupId,
                    token,
                    context,
                }
            });
        }

        // Validate device ownership
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device", {
                body: {
                    deviceId,
                    groupId,
                    token,
                    context,
                }
            });
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
        return createErrorResponse(ServerActionReason.UNKNOWN_ERROR, "An error occurred while fetching device sensors", {
            error,
            body: {
                deviceId,
                groupId,
                token,
                context,
            }
        });
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
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in", {
                body: {
                    deviceId,
                    token,
                    context,
                }
            });
        }

        // Validate device ownership
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device", {
                body: {
                    deviceId,
                    token,
                    context,
                }
            });
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
        return createErrorResponse(ServerActionReason.UNKNOWN_ERROR, "An error occurred while fetching device groups", {
            error,
            body: {
                deviceId,
                token,
                context,
            }
        });
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
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in", {
                body: {
                    deviceId,
                    groupId,
                    token,
                    context,
                }
            });
        }

        // Validate device ownership
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device", {
                body: {
                    deviceId,
                    groupId,
                    token,
                    context,
                }
            });
        }

        // Update active group
        await updateDeviceActiveGroup(deviceId, groupId);

        return createSuccessResponse(ServerActionReason.SUCCESS, "Active group updated", null);
    } catch (error) {
        return createErrorResponse(ServerActionReason.UNKNOWN_ERROR, "An error occurred while updating active group", {
            error,
            body: {
                deviceId,
                groupId,
                token,
                context,
            }
        });
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
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in", {
                body: {
                    deviceId,
                    groupId,
                    token,
                    context,
                }
            });
        }

        // Validate device ownership
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device", {
                body: {
                    deviceId,
                    groupId,
                    token,
                    context,
                }
            });
        }

        // Check if this is the active group
        const activeGroupCheck = await isActiveGroup(deviceId, groupId);
        if (activeGroupCheck) {
            return createErrorResponse(
                ServerActionReason.CONFLICT,
                "Cannot delete the active group. Set another group as active first.",
                {
                    body: {
                        deviceId,
                        groupId,
                        token,
                        context,
                    }
                }
            );
        }

        // Delete the group
        await deleteGroup(groupId);

        return createSuccessResponse(ServerActionReason.SUCCESS, "Group deleted successfully", null);
    } catch (error) {
        return createErrorResponse(ServerActionReason.UNKNOWN_ERROR, "An error occurred while deleting the group", {
            error,
            body: {
                deviceId,
                groupId,
                token,
                context,
            }
        });
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
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in", {
                body: {
                    deviceId,
                    name,
                    activeSensorIds,
                    token,
                    context,
                }
            });
        }

        // Validate device ownership
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device", {
                body: {
                    deviceId,
                    name,
                    activeSensorIds,
                    token,
                    context,
                }
            });
        }

        // Create the group with active sensors
        const group = await createGroup(deviceId, name, activeSensorIds);

        return createSuccessResponse(ServerActionReason.CREATED, "Group created successfully", group);
    } catch (error) {
        return createErrorResponse(ServerActionReason.UNKNOWN_ERROR, "An error occurred while creating the group", {
            error,
            body: {
                deviceId,
                name,
                activeSensorIds,
                token,
                context,
            }
        });
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
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in", {
                body: {
                    deviceId,
                    groupId,
                    name,
                    activeSensorIds,
                    token,
                    context,
                }
            });
        }

        // Validate device ownership
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device", {
                body: {
                    deviceId,
                    groupId,
                    name,
                    activeSensorIds,
                    token,
                    context,
                }
            });
        }

        // Update the group with active sensors
        const group = await updateGroup(groupId, name, activeSensorIds);

        return createSuccessResponse(ServerActionReason.SUCCESS, "Group updated successfully", group);
    } catch (error) {
        return createErrorResponse(ServerActionReason.UNKNOWN_ERROR, "An error occurred while updating the group", {
            error,
            body: {
                deviceId,
                groupId,
                name,
                activeSensorIds,
                token,
                context,
            }
        });
    }
}