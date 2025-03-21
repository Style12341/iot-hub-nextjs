import { CreateDeviceFormData } from "@/types/types";
import db from "../prisma";
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
    groupSensorId: string;
    values: SensorValueQueryResult[];
};

export interface GroupQueryResult {
    id: number;
    name: string;
};
export interface DeviceHasReceivedData {
    id: string;
    name: string;
    status: "ONLINE" | "OFFLINE";
    lastValueAt: Date;
    group: GroupQueryResult;
    sensors: SensorQueryResult[];
};
export interface DeviceHasNotReceivedData {
    id: string;
    name: string;
    status: "WAITING";
    lastValueAt: null;
    group: GroupQueryResult;
    sensors: null;
};

export type DeviceQueryResult = DeviceHasReceivedData | DeviceHasNotReceivedData;

export interface DevicesQueryResult {
    device: DeviceQueryResult;
};

const ONLINE_DEVICE_THRESHOLD = 90000; // 1 minute
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
            }
        },
        // Include relevant relations
        include: {
            Sensors: true,
            Groups: true,

        }
    });
    const group = device.Groups[0];
    await Promise.all([
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
            User: true
        }
    });
    if (!device) {
        return null;
    }
    device.status = getDeviceStatusFromLastValueAt(device.lastValueAt);
    return device;
}
export const getDevicesWithActiveSensors = async (userId: string) => {
    // This query gets devices with their active sensors
    // The device holds the active group, joined with groups table, group sensors, 
    // active sensors, last 5 values per sensor, and sensor category
    const devices: DevicesQueryResult[] = await db.$queryRaw`
        SELECT jsonb_build_object(
                'id', d."id",
                'name', d."name",
                'status', d."status",
                'lastValueAt', d."lastValueAt",
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
        LEFT JOIN "Group" g ON d."activeGroupId" = g."id"
        LEFT JOIN "GroupSensor" gs ON g."id" = gs."groupId" AND gs."active" = true
        LEFT JOIN "Sensor" s ON gs."sensorId" = s."id"
        LEFT JOIN "SensorCategory" c ON s."categoryId" = c."id"
        WHERE d."userId" = ${userId}
        GROUP BY d."id", g."id"
        ORDER BY CASE 
                WHEN d."status" = 'ONLINE' THEN 1
                WHEN d."status" = 'OFFLINE' THEN 2
                ELSE 3
            END, d."name" ASC
    `;
    // Map status accordingly

    devices.forEach(device => {
        device.device.status = getDeviceStatusFromLastValueAt(device.device.lastValueAt);
    });
    console.debug(devices[0].device.group)

    return devices;
};
export const getDeviceWithActiveSensors = async (userId: string, deviceId: string) => {
    const devices: DevicesQueryResult[] = await db.$queryRaw`
        SELECT jsonb_build_object(
                'id', d."id",
                'name', d."name",
                'status', d."status",
                'lastValueAt', d."lastValueAt",
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
        LEFT JOIN "Group" g ON d."activeGroupId" = g."id"
        LEFT JOIN "GroupSensor" gs ON g."id" = gs."groupId" AND gs."active" = true
        LEFT JOIN "Sensor" s ON gs."sensorId" = s."id"
        LEFT JOIN "SensorCategory" c ON s."categoryId" = c."id"
        WHERE d."userId" = ${userId}
        AND d."id" = ${deviceId}
        GROUP BY d."id", g."id"
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
    console.debug(res.device.group)

    return res;
}

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
            console.log('Parsed lastValueAt:', new Date(lastValueTime).toISOString());
        } else {
            lastValueTime = new Date(lastValueAt).getTime();
        }
    } else {
        // Already a Date object
        lastValueTime = lastValueAt.getTime();
    }

    const now = Date.now();
    console.log('Current time:', new Date(now).toISOString());
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