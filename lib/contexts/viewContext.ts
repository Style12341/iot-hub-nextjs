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
/**
 * Update a view and transfer devices to it
 * @param id - ID of the view to update
 * @param userId - ID of the user who owns the view
 * @param name - New name for the view
 * @param devicesIdsToTransfer - Array of device IDs to transfer to this view
 */
export async function updateView(id: string, userId: string, name: string, devicesIdsToTransfer: string[] = []) {
    // Update view with new data
    const updatedView = await db.view.update({
        where: {
            id,
            userId // Ensure the view belongs to this user
        },
        data: { name }
    });

    // If there are devices to transfer, connect them to this view
    if (devicesIdsToTransfer.length > 0) {
        await db.device.updateMany({
            where: {
                id: { in: devicesIdsToTransfer },
                userId // Ensure the devices belong to this user
            },
            data: {
                viewId: updatedView.id
            }
        });
    }

    // Get updated view with device count
    const viewWithCount = await db.view.findUnique({
        where: { id: updatedView.id },
        include: {
            _count: {
                select: { Devices: true }
            }
        }
    });

    if (!viewWithCount) {
        throw new Error("View not found after update");
    }

    // Return view with device count
    return {
        ...viewWithCount,
        devicesCount: viewWithCount._count.Devices
    };
}
export async function getViewById(userId: string, viewId: string) {
    // Fetch the view by ID and ensure it belongs to the user
    const view = await db.view.findFirst({
        where: {
            id: viewId,
            userId
        },
        include: {
            _count: {
                select: {
                    Devices: true
                }
            }
        }
    });
    return view;
}