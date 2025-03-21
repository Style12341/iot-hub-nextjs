import { CreateDeviceFormData } from "@/types/types";
import db from "../prisma";
// Example usage
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
    device.status = Date.now() - device.lastValueAt.getTime() < ONLINE_DEVICE_THRESHOLD ? "ONLINE" : "OFFLINE";
    return device;
}