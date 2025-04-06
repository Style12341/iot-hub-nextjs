"use server"

import db from "@/lib/prisma";
import { Group, GroupSensor, Sensor } from "@prisma/client";

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
            },
            GroupSensor: true,
        },
        orderBy: { name: 'asc' }
    });
    // Format the response
    const formattedGroups = groups.map(group => ({
        ...group,
        sensorCount: group._count.GroupSensor || 0,
        _count: undefined, // Remove the _count field from the response
    }));

    return formattedGroups;
}

/**
 * Get all sensors for a device
 */
export async function getDeviceSensors(deviceId: string): Promise<Sensor[]> {
    return await db.sensor.findMany({
        where: {
            deviceId
        }
    });
}

/**
 * Get all group-sensor relationships for a group
 */
export async function getGroupSensorStates(groupId: string): Promise<GroupSensor[]> {
    return await db.groupSensor.findMany({
        where: {
            groupId
        }
    });
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
 * Create a new group for a device with active sensors
 */
export async function createGroup(
    deviceId: string,
    name: string,
    activeSensorIds: string[] = []
): Promise<Group> {
    // First get all device sensors
    const deviceSensors = await getDeviceSensors(deviceId);

    // Create the group
    const group = await db.group.create({
        data: {
            name,
            deviceId
        }
    });

    // Create GroupSensor entries for all device sensors
    // Active status is determined by whether the sensor ID is in activeSensorIds
    if (deviceSensors.length > 0) {
        await db.groupSensor.createMany({
            data: deviceSensors.map(sensor => ({
                groupId: group.id,
                sensorId: sensor.id,
                active: activeSensorIds.includes(sensor.id)
            }))
        });
    }

    return group;
}

/**
 * Update a group's name and active sensors
 */
export async function updateGroup(
    groupId: string,
    name: string,
    activeSensorIds: string[] = []
): Promise<Group> {
    // Update the group name
    const group = await db.group.update({
        where: { id: groupId },
        data: { name }
    });

    // Get existing GroupSensor entries
    const existingGroupSensors = await getGroupSensorStates(groupId);

    // Update each GroupSensor.active status based on activeSensorIds
    await Promise.all(
        existingGroupSensors.map(gs =>
            db.groupSensor.update({
                where: { id: gs.id },
                data: { active: activeSensorIds.includes(gs.sensorId) }
            })
        )
    );

    return group;
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