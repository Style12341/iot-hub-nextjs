"use server"

import db from "../prisma";

export async function validateSensorOwnership(userId: string, sensorId: string): Promise<boolean> {
    const sensor = await db.sensor.findFirst({
        where: {
            id: sensorId,
            Device: {
                userId: userId
            }
        }
    });
    return !!sensor
}
export async function getSensorsQty(userId: string) {
    return db.sensor.count({
        where: {
            Device: {
                userId
            }
        }
    });
}

