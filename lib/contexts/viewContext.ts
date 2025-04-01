"use server"

import db from "../prisma"


export async function createView(userId: string, name: string, devicesIds: string[]) {
    const devices = devicesIds.map((deviceId) => ({ id: deviceId }));
    const res = db.view.create({
        data: {
            name,
            userId,
            Devices: {
                connect: devices,
            },
        }
    });
    return await res;
}