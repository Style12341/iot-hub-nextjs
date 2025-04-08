import { CreateDeviceFormData } from "@/types/types";
import db from "../prisma";
import { Device, DeviceStatus, Firmware, View, Sensor } from "@prisma/client";
// Example usage
export interface SensorValueQueryResult {
    value: number;
    timestamp: string | Date; // or Date if you plan to parse it
};

export interface SensorQueryResult {
    id: string;
    name: string;
    unit: string;
    category?: string;
    categoryColor: string;
    groupSensorId: string;
    values?: SensorValueQueryResult[];
};

export interface GroupQueryResult {
    id: number;
    name: string;
};
export interface DeviceHasReceivedData {
    id: string;
    name: string;
    view: string;
    status: "ONLINE" | "OFFLINE";
    lastValueAt: Date;
    group: GroupQueryResult;
    sensors?: SensorQueryResult[];
    activeFirmwareVersion: string | null;
};
export interface DeviceHasNotReceivedData {
    id: string;
    name: string;
    view: string;
    status: "WAITING";
    lastValueAt: null;
    group: GroupQueryResult;
    sensors: null;
};

export type DeviceQueryResult = DeviceHasReceivedData | DeviceHasNotReceivedData;

export interface DevicesQueryResult {
    device: DeviceQueryResult;
};
export interface DeviceQueryResultPaginated {
    devices: DevicesQueryResult[];
    page: number;
    maxPage: number;
    count: number;
};


export const ONLINE_DEVICE_THRESHOLD = 90000; // 1 minute
export const createDevice = async (data: CreateDeviceFormData) => {
    const device = await db.device.create({
        data: {
            name: data.name,
            userId: data.userId,
            Sensors: {
                create: data.sensors.map(sensor => ({
                    name: sensor.name,
                    unit: sensor.unit,
                    Category: {
                        connect: {
                            id: sensor.categoryId
                        }
                    }
                }))
            },
            Groups: {
                create: {
                    name: data.group.name || "Default"
                }
            },
            viewId: data.view.id,
        },
        // Include relevant relations
        include: {
            Sensors: true,
            Groups: true,
            View: true,
        }
    });
    const group = device.Groups[0];
    await db.$transaction([
        db.device.update({
            where: {
                id: device.id
            },
            data: {
                activeGroupId: group.id
            }
        }),
        db.groupSensor.createMany({
            data: device.Sensors.map(sensor => ({
                groupId: group.id,
                sensorId: sensor.id,
                active: true
            }))
        })
    ]);

    return device;
};
export const validateDeviceOwnership = async (userId: string, deviceId: string) => {
    const device = await db.device.findFirst({
        where: {
            id: deviceId,
            userId
        }
    });
    return !!device;
};
export const updateDeviceLastValueAt = async (deviceId: string) => {
    await db.device.update({
        where: {
            id: deviceId
        },
        data: {
            lastValueAt: new Date(),
            status: "ONLINE"
        }
    });
}
export const updateDeviceActiveGroup = async (deviceId: string, groupId: string) => {
    await db.device.update({
        where: {
            id: deviceId
        },
        data: {
            activeGroupId: groupId
        }
    });
}
export const getDevice = async (id: string) => {
    const device = await db.device.findUnique({
        where: {
            id
        },
        include: {
            Sensors: {
                include: {
                    Category: true
                }
            },
            Groups: true,
            User: true,
            View: true,
            AssignedFirmware: {
                select: {
                    id: true,
                    version: true,
                    description: true,
                }
            }
        }
    });
    if (!device) {
        return null;
    }
    device.status = getDeviceStatusFromLastValueAt(device.lastValueAt);
    return device;
}
export const getPlainDevice = async (userId: string, deviceId: string) => {
    const device = await db.device.findUnique({
        where: {
            id: deviceId,
            userId
        }
    });
    if (!device) {
        return null;
    }
    device.status = getDeviceStatusFromLastValueAt(device.lastValueAt);
    return device;
}
export const getDevicesWithActiveSensors = async (userId: string, page: number = 1): Promise<DeviceQueryResultPaginated> => {
    const DEVICES_PER_PAGE = 6;
    const count = await db.device.count({
        where: {
            userId,
        }
    })
    if (count === 0) {
        return { devices: [], page: 1, maxPage: 1, count: 0 };
    }
    let searchPage = Math.max(1, page);
    const maxPage = Math.ceil(count / DEVICES_PER_PAGE);
    searchPage = Math.min(searchPage, maxPage);
    // This query gets devices with their active sensors
    // The device holds the active group, joined with groups table, group sensors, 
    // active sensors, last 5 values per sensor, and sensor category
    const devices: DevicesQueryResult[] = await db.$queryRaw`
        SELECT jsonb_build_object(
                'id', d."id",
                'name', d."name",
                'view', v."name",
                'status', d."status",
                'lastValueAt', d."lastValueAt",
                'activeFirmwareVersion', f."version",
                'group', jsonb_build_object(
                    'id', g."id",
                    'name', g."name"
                ),
                'sensors', jsonb_agg(
                    jsonb_build_object(
                        'groupSensorId', gs."id",
                        'id', s."id",
                        'name', s."name",
                        'unit', s."unit",
                        'category', c."name",
                        'categoryColor',c."color",
                        'values', (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'value', sv_limited."value",
                                    'timestamp', sv_limited."timestamp"
                                )
                                ORDER BY sv_limited."timestamp" DESC
                            )
                            FROM (
                                SELECT sv."value", sv."timestamp"
                                FROM "SensorValue" sv
                                WHERE sv."groupSensorId" = gs."id"
                                ORDER BY sv."timestamp" DESC
                                LIMIT 5
                            ) AS sv_limited
                        )
                    )
                )
            )
         AS device
        FROM "Device" d
        JOIN "View" v ON d."viewId" = v."id"
        LEFT JOIN "Firmware" f ON d."activeFirmwareId" = f."id"
        LEFT JOIN "Group" g ON d."activeGroupId" = g."id"
        LEFT JOIN "GroupSensor" gs ON g."id" = gs."groupId" AND gs."active" = true
        LEFT JOIN "Sensor" s ON gs."sensorId" = s."id"
        LEFT JOIN "SensorCategory" c ON s."categoryId" = c."id"
        WHERE d."userId" = ${userId}
        GROUP BY d."id",v."id", g."id", f."id"
        ORDER BY CASE 
                WHEN d."status" = 'ONLINE' THEN 1
                WHEN d."status" = 'OFFLINE' THEN 2
                ELSE 3
            END, d."name" ASC
        LIMIT ${DEVICES_PER_PAGE}
        OFFSET ${Math.max(0, (searchPage - 1) * DEVICES_PER_PAGE)}
    `;
    // Map status accordingly

    devices.forEach(device => {
        device.device.status = getDeviceStatusFromLastValueAt(device.device.lastValueAt);
        if (device.device.sensors && device.device.sensors.length == 1 && device.device.sensors[0].name == null) {
            device.device.sensors = undefined;
        }
    });

    return { devices, page: searchPage, maxPage, count };
};
export const getDevicesViewWithActiveSensorsBetween = async (userId: string, view: string, startDate: Date, endDate: Date) => {
    const devices: DevicesQueryResult[] = await db.$queryRaw`
        SELECT jsonb_build_object(
                'id', d."id",
                'name', d."name",
                'view', v."name",
                'status', d."status",
                'lastValueAt', d."lastValueAt",
                'activeFirmwareVersion', f."version",
                'group', jsonb_build_object(
                    'id', g."id",
                    'name', g."name"
                ),
                'sensors', jsonb_agg(
                    jsonb_build_object(
                        'groupSensorId', gs."id",
                        'id', s."id",
                        'name', s."name",
                        'unit', s."unit",
                        'category', c."name",
                        'categoryColor',c."color",
                        'values', (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'value', sv_limited."value",
                                    'timestamp', sv_limited."timestamp"
                                )
                                ORDER BY sv_limited."timestamp" DESC
                            )
                            FROM (
                                SELECT sv."value", sv."timestamp"
                                FROM "SensorValue" sv
                                WHERE sv."groupSensorId" = gs."id"
                                AND sv."timestamp" >= ${startDate.toISOString()}::timestamp
                                AND sv."timestamp" <= ${endDate.toISOString()}::timestamp
                                ORDER BY sv."timestamp" DESC
                            ) AS sv_limited
                        )
                    )
                )
            )
         AS device
        FROM "Device" d
        JOIN "View" v ON d."viewId" = v."id"
        LEFT JOIN "Firmware" f ON d."activeFirmwareId" = f."id"
        LEFT JOIN "Group" g ON d."activeGroupId" = g."id"
        LEFT JOIN "GroupSensor" gs ON g."id" = gs."groupId" AND gs."active" = true
        LEFT JOIN "Sensor" s ON gs."sensorId" = s."id"
        LEFT JOIN "SensorCategory" c ON s."categoryId" = c."id"
        WHERE d."userId" = ${userId}
        AND v."name" = ${view}
        GROUP BY d."id",v."id", g."id", f."id"
        ORDER BY CASE 
                WHEN d."status" = 'ONLINE' THEN 1
                WHEN d."status" = 'OFFLINE' THEN 2
                ELSE 3
            END, d."name" ASC
    `;
    // Map status accordingly
    devices.forEach(device => {
        device.device.status = getDeviceStatusFromLastValueAt(device.device.lastValueAt);
        if (device.device.sensors && device.device.sensors.length == 1 && device.device.sensors[0].name == null) {
            device.device.sensors = undefined;
        }
        if (device.device.sensors) {
            device.device.sensors.sort((a, b) => a.name.localeCompare(b.name));
        }
    });

    return devices;
}
export const getDeviceViewWithActiveSensorsBetween = async (userId: string, deviceId: string, view: string, startDate: Date, endDate: Date) => {
    console.debug("[getDeviceViewWithActiveSensorsBetween] User ID:", userId, "Device ID:", deviceId, "View:", view, "Start Date:", startDate, "End Date:", endDate);
    const devices: DevicesQueryResult[] = await db.$queryRaw`
        SELECT jsonb_build_object(
                'id', d."id",
                'name', d."name",
                'view', v."name",
                'status', d."status",
                'lastValueAt', d."lastValueAt",
                'activeFirmwareVersion', f."version",
                'group', jsonb_build_object(
                    'id', g."id",
                    'name', g."name"
                ),
                'sensors', jsonb_agg(
                    jsonb_build_object(
                        'groupSensorId', gs."id",
                        'id', s."id",
                        'name', s."name",
                        'unit', s."unit",
                        'category', c."name",
                        'categoryColor',c."color",
                        'values', (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'value', sv_limited."value",
                                    'timestamp', sv_limited."timestamp"
                                )
                                ORDER BY sv_limited."timestamp" DESC
                            )
                            FROM (
                                SELECT sv."value", sv."timestamp"
                                FROM "SensorValue" sv
                                WHERE sv."groupSensorId" = gs."id"
                                AND sv."timestamp" >= ${startDate.toISOString()}::timestamp
                                AND sv."timestamp" <= ${endDate.toISOString()}::timestamp
                                ORDER BY sv."timestamp" DESC
                            ) AS sv_limited
                        )
                    )
                )
            )
         AS device
        FROM "Device" d
        JOIN "View" v ON d."viewId" = v."id"
        LEFT JOIN "Firmware" f ON d."activeFirmwareId" = f."id"
        LEFT JOIN "Group" g ON d."activeGroupId" = g."id"
        LEFT JOIN "GroupSensor" gs ON g."id" = gs."groupId" AND gs."active" = true
        LEFT JOIN "Sensor" s ON gs."sensorId" = s."id"
        LEFT JOIN "SensorCategory" c ON s."categoryId" = c."id"
        WHERE d."userId" = ${userId}
        AND d."id" = ${deviceId}
        AND v."name" = ${view}
        GROUP BY d."id",v."id", g."id", f."id"
        ORDER BY CASE 
                WHEN d."status" = 'ONLINE' THEN 1
                WHEN d."status" = 'OFFLINE' THEN 2
                ELSE 3
            END, d."name" ASC
    `;
    console.debug("Devices:", devices[0].device.sensors)
    // Check if we got any results
    if (!devices || devices.length === 0) {
        return null;
    }

    // Map status accordingly
    const device = devices[0];
    device.device.status = getDeviceStatusFromLastValueAt(device.device.lastValueAt);
    // Sort sensors by name
    if (device.device.sensors && device.device.sensors.length == 1 && device.device.sensors[0].name == null) {
        device.device.sensors = undefined;
    }
    if (device.device.sensors) {
        device.device.sensors.sort((a, b) => a.name.localeCompare(b.name));
    }
    return device;
}
export const getDeviceWithActiveSensors = async (userId: string, deviceId: string) => {

    const devices: DevicesQueryResult[] = await db.$queryRaw`
        SELECT jsonb_build_object(
                'id', d."id",
                'name', d."name",
                'view', v."name",
                'status', d."status",
                'lastValueAt', d."lastValueAt",
                'activeFirmwareVersion', f."version",
                'group', jsonb_build_object(
                    'id', g."id",
                    'name', g."name"
                ),
                'sensors', jsonb_agg(
                    jsonb_build_object(
                        'groupSensorId', gs."id",
                        'id', s."id",
                        'name', s."name",
                        'unit', s."unit",
                        'category', c."name",
                        'categoryColor',c."color",
                        'values', (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'value', sv_limited."value",
                                    'timestamp', sv_limited."timestamp"
                                )
                                ORDER BY sv_limited."timestamp" DESC
                            )
                            FROM (
                                SELECT sv."value", sv."timestamp"
                                FROM "SensorValue" sv
                                WHERE sv."groupSensorId" = gs."id"
                                ORDER BY sv."timestamp" DESC
                                LIMIT 5
                            ) AS sv_limited
                        )
                    )
                )
            )
         AS device
        FROM "Device" d
        JOIN "View" v ON d."viewId" = v."id"
        LEFT JOIN "Firmware" f ON d."activeFirmwareId" = f."id"
        LEFT JOIN "Group" g ON d."activeGroupId" = g."id"
        LEFT JOIN "GroupSensor" gs ON g."id" = gs."groupId" AND gs."active" = true
        LEFT JOIN "Sensor" s ON gs."sensorId" = s."id"
        LEFT JOIN "SensorCategory" c ON s."categoryId" = c."id"
        WHERE d."userId" = ${userId}
        AND d."id" = ${deviceId}
        GROUP BY d."id",v."id", g."id", f."id"
        ORDER BY CASE 
                WHEN d."status" = 'ONLINE' THEN 1
                WHEN d."status" = 'OFFLINE' THEN 2
                ELSE 3
            END, d."name" ASC
    `;
    // Map status accordingly
    const res = devices[0];
    console.debug(res)
    res.device.status = getDeviceStatusFromLastValueAt(res.device.lastValueAt);
    if (res.device.sensors && res.device.sensors.length == 1 && res.device.sensors[0].name == null) {
        res.device.sensors = undefined;
    }
    console.debug(res.device.group)

    return res;
}
export const getDevicesWithViews = async (userId: string, page: number = 1): Promise<DeviceWithViewPaginated> => {
    const DEVICES_PER_PAGE = 100;
    const count = await db.device.count({
        where: {
            userId,
        }
    })
    if (count === 0) {
        return { devices: [], page: 1, maxPage: 1, count: 0 };
    }
    let searchPage = Math.max(1, page);
    const maxPage = Math.ceil(count / DEVICES_PER_PAGE);
    searchPage = Math.min(searchPage, maxPage);
    const skip = Math.max(0, (searchPage - 1) * DEVICES_PER_PAGE);
    const res = await db.device.findMany({
        where: {
            userId
        },
        include: {
            View: true,
        },
        orderBy: {
            name: "asc"
        },
        take: DEVICES_PER_PAGE,
        skip: skip
    });
    return { devices: res, page: searchPage, maxPage, count };
}
export type DeviceWithViewPaginated = {
    devices: ((Device | null) & { View: View | null })[];
    page: number;
    maxPage: number;
    count: number;
};

export function getDeviceStatusFromLastValueAt(lastValueAt: Date | string | null) {
    // Ensure we're working with a properly formatted date
    let lastValueTime: number;
    if (!lastValueAt) {
        return "WAITING";
    }
    if (typeof lastValueAt === 'string') {
        // For strings, make sure we handle both formats correctly
        // If the string doesn't have 'Z' or '+' timezone info, assume it's UTC
        if (!lastValueAt.endsWith('Z') && !lastValueAt.includes('+')) {
            lastValueTime = new Date(`${lastValueAt}Z`).getTime();
        } else {
            lastValueTime = new Date(lastValueAt).getTime();
        }
    } else {
        lastValueTime = lastValueAt.getTime();
    }
    const now = Date.now();
    const diff = now - lastValueTime;

    // For debugging
    // console.log('Input lastValueAt:', lastValueAt);
    // console.log('Parsed lastValueAt:', new Date(lastValueTime).toISOString());
    // console.log('Current time:', new Date(now).toISOString());
    // console.log('Time difference (ms):', diff);

    // Sanity check for future timestamps
    if (diff < -10000) { // Allow a small buffer for clock differences (10 seconds)
        console.warn('Warning: lastValueAt timestamp appears to be in the future:',
            new Date(lastValueTime).toISOString(),
            'Current time:', new Date(now).toISOString());
        return "ONLINE"; // Consider devices with future timestamps as online
    }

    return diff < ONLINE_DEVICE_THRESHOLD ? "ONLINE" : "OFFLINE";
}
export async function getDevicesQty(userId: string) {
    // First update device statuses based on lastValueAt
    await updateDevicesStatus(userId);

    // Then get the count grouped by status
    return await db.device.groupBy({
        by: ['status'],
        _count: {
            id: true
        },
        where: {
            userId
        }
    });
}
export async function updateDevicesStatus(userId: string) {
    await db.$executeRaw`
        UPDATE "Device"
        SET "status" = CASE
            WHEN "status" != 'WAITING' AND "lastValueAt" IS NOT NULL 
                AND (EXTRACT(EPOCH FROM NOW()) - EXTRACT(EPOCH FROM "lastValueAt")) < 90 
                THEN 'ONLINE'
            WHEN "status" != 'WAITING' 
                THEN 'OFFLINE'
            ELSE "status"
        END
        WHERE "userId" = ${userId}
    `;
    return
}
export async function assignFirmwareToDevice(deviceId: string, firmwareId: string) {
    const device = await db.device.update({
        where: {
            id: deviceId
        },
        data: {
            AssignedFirmware: {
                connect: {
                    id: firmwareId
                }
            }
        }
    });
    return device;
}
// Add this to your existing types file

export interface DeviceFirmwareState {
    id: string;
    name: string;
    AssignedFirmware: Firmware | null;
    ActiveFirmware: Firmware | null;
}
export async function getDeviceFirmwareState(deviceId: string) {
    const device = await db.device.findUnique({
        where: {
            id: deviceId
        },
        select: {
            id: true,
            name: true,
            AssignedFirmware: true,
            ActiveFirmware: true,
        }
    });
    return device;
}
export async function getDeviceActiveView(userId: string, deviceId: string) {
    const device = await db.device.findUnique({
        where: {
            userId,
            id: deviceId
        },
        select: {
            View: true,
        }
    });
    return device?.View
}
export interface SensorWithActiveGroupCount extends Sensor {
    activeGroupCount: number;
    GroupSensor: {
        id: string;
        active: boolean;
        groupId: string;
        sensorId: string;
    }[];
    Category?: {
        id: string;
        name: string;
        color: string;
    } | null;
}
export async function getDeviceSensorsWithGroupCount(deviceId: string): Promise<SensorWithActiveGroupCount[]> {
    // Get all sensors for a device with count of active groups
    const sensors = await db.sensor.findMany({
        where: {
            deviceId
        },
        include: {
            Category: {
                select: {
                    id: true,
                    name: true,
                    color: true
                }
            },
            GroupSensor: true,
            _count: {
                select: {
                    GroupSensor: {
                        where: {
                            active: true
                        }
                    }
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });

    // Format the response
    return sensors.map(sensor => ({
        ...sensor,
        activeGroupCount: sensor._count.GroupSensor
    }));
}
export async function deleteDevice(deviceId: string) {
    // Delete the device and its related data
    const deletedDevice = await db.device.delete({
        where: {
            id: deviceId
        }
    });
    return deletedDevice;
}
export async function updateDevice(deviceId: string, data: Partial<Device>) {
    const updatedDevice = await db.device.update({
        where: {
            id: deviceId
        },
        data: {
            ...data,
        }
    });
    return updatedDevice;
}
export type DeviceGroupsWithSensorsIds = {
    id: string;
    name: string;
    firmwareVersion: string;
    Groups: {
        id: string
        active: boolean
        name: string
        sensor: {
            id: string
            name: string
            unit: string
            category?: string
        }[]
    }[]
}
export async function getDeviceGroupsWithActiveSensors(userId: string, deviceId: string): Promise<DeviceGroupsWithSensorsIds | null> {
    const device = await db.device.findFirst(
        {
            where: {
                id: deviceId,
                userId
            },
            include: {
                ActiveFirmware: {
                    select: {
                        version: true,
                    }
                },
                Groups: {
                    include: {
                        GroupSensor: {
                            where: {
                                active: true
                            },
                            include: {
                                Sensor: {
                                    include: {
                                        Category: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    )
    if (!device || !device.Groups) {
        return null;
    }
    const newGroups = device.Groups.map(g => {
        return {
            id: g.id,
            name: g.name,
            sensor: g.GroupSensor.map(gs => {
                return {
                    id: gs.Sensor.id,
                    name: gs.Sensor.name,
                    unit: gs.Sensor.unit,
                    category: gs.Sensor.Category?.name,
                }
            }),
            active: device.activeGroupId == g.id
        }
    })
    const newDevice = {
        ...device,
        firmwareVersion: device.ActiveFirmware?.version || "0.0.1",
        Groups: newGroups
    }
    return newDevice;
}