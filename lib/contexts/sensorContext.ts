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