"use server"

import db from "@/lib/prisma";
import { Group } from "@prisma/client";

/**
 * Get all groups for a device with sensor counts
 */
export async function getDeviceGroups(deviceId: string) {
    // Get groups with sensor count
    const groups = await db.group.findMany({
        where: {
            deviceId
        },
        include: {
            _count: {
                select: {
                    GroupSensor: {
                        where: {
                            active: true
                        }
                    }
                },
            }
        },
        orderBy: { name: 'asc' }
    });
    // Format the response
    const formattedGroups = groups.map(group => ({
        ...group,
        sensorCount: group._count.GroupSensor || 0,
    }));

    return formattedGroups;
}

/**
 * Get active group ID for a device
 */
export async function getDeviceActiveGroupId(deviceId: string) {
    const device = await db.device.findUnique({
        where: { id: deviceId },
        select: { activeGroupId: true }
    });

    return device?.activeGroupId;
}

/**
 * Check if group is the active group for a device
 */
export async function isActiveGroup(deviceId: string, groupId: string): Promise<boolean> {
    const device = await db.device.findUnique({
        where: { id: deviceId },
        select: { activeGroupId: true }
    });

    return device?.activeGroupId === groupId;
}

/**
 * Delete a group by ID
 */
export async function deleteGroup(groupId: string): Promise<Group> {
    return await db.group.delete({
        where: { id: groupId }
    });
}

/**
 * Create a new group for a device
 */
export async function createGroup(deviceId: string, name: string): Promise<Group> {
    return await db.group.create({
        data: {
            name,
            deviceId
        }
    });
}

/**
 * Update a group's name
 */
export async function updateGroup(groupId: string, name: string): Promise<Group> {
    return await db.group.update({
        where: { id: groupId },
        data: { name }
    });
}

/**
 * Validate that a group belongs to a specific device
 */
export async function validateGroupOwnership(deviceId: string, groupId: string): Promise<boolean> {
    const group = await db.group.findFirst({
        where: {
            id: groupId,
            deviceId
        }
    });

    return !!group;
}

/**
 * Get all group sensors for a group
 */
export async function getGroupSensors(groupId: string) {
    return await db.groupSensor.findMany({
        where: { groupId },
        include: {
            Sensor: true
        }
    });
}