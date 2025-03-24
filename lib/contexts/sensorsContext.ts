"use server"

import db from "../prisma"

export async function getSensorsQty(userId: string) {
    return db.sensor.count({
        where: {
            Device: {
                userId
            }
        }
    });
}

