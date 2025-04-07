"use server"

import db from "../prisma"

export async function createView(userId: string, name: string, devicesIds: string[] = []) {
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

export async function deleteView(viewId: string, defaultViewId: string) {
    // First, update all devices in this view to the default view
    await db.device.updateMany({
        where: {
            viewId
        },
        data: {
            viewId: defaultViewId
        }
    });

    // Then delete the view
    return await db.view.delete({
        where: {
            id: viewId
        }
    });
}

export async function getUserDefaultViewId(userId: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            defaultViewId: true
        }
    });

    return user?.defaultViewId;
}

export async function getDeviceCountInView(viewId: string) {
    return await db.device.count({
        where: {
            viewId
        }
    });
}

export async function getAllUserViews(userId: string) {
    // Fetch all views for the user with device count
    const views = await db.view.findMany({
        where: {
            userId
        },
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    Devices: true
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });

    // Format the response
    return views.map(view => ({
        id: view.id,
        name: view.name,
        devicesCount: view._count.Devices
    }));
}