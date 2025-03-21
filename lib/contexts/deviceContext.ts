import { CreateDeviceFormData } from "@/types/types";
import db from "../prisma";
// Example usage
export interface SensorValueQueryResult {
    value: number;
    timestamp: string; // or Date if you plan to parse it
};

export interface SensorQueryResult {
    id: string;
    name: string;
    unit: string;
    category: string;
    groupSensorId: string;
    values: SensorValueQueryResult[];
};

export interface GroupQueryResult {
    id: number;
    name: string;
};

export interface DeviceQueryResult {
    id: number;
    name: string;
    status: "ONLINE" | "OFFLINE";
    lastValueAt: Date;
    group: GroupQueryResult;
    sensors: SensorQueryResult[];
};

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
    await db.groupSensor.createMany({
        data: device.Sensors.map(sensor => ({
            groupId: group.id,
            sensorId: sensor.id,
            active: true
        }))
    });
    return device;
};
export const updateDeviceLastValueAt = async (deviceId: string) => {
    await db.device.update({
        where: {
            id: deviceId
        },
        data: {
            lastValueAt: new Date()
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
        JOIN "Group" g ON d."activeGroupId" = g."id"
        JOIN "GroupSensor" gs ON g."id" = gs."groupId" AND gs."active" = true
        JOIN "Sensor" s ON gs."sensorId" = s."id"
        JOIN "SensorCategory" c ON s."categoryId" = c."id"
        WHERE d."userId" = ${userId}
        GROUP BY d."id", g."id"
        ORDER BY d."status" DESC, d."name" ASC
    `;
    // Map status accordinglt

    devices.forEach(device => {
        device.device.status = getDeviceStatusFromLastValueAt(device.device.lastValueAt);
    });

    return devices;
};
export function getDeviceStatusFromLastValueAt(lastValueAt: Date | string) {
    // Ensure we're working with a properly formatted date
    let lastValueTime: number;

    if (typeof lastValueAt === 'string') {
        // For strings, make sure we handle both formats correctly
        // If the string doesn't have 'Z' or '+' timezone info, assume it's UTC
        if (!lastValueAt.endsWith('Z') && !lastValueAt.includes('+')) {
            lastValueTime = new Date(`${lastValueAt}Z`).getTime();
        } else {
            lastValueTime = new Date(lastValueAt).getTime();
        }
    } else {
        // Already a Date object
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