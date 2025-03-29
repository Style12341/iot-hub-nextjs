"use server"

import { FirmwareCreate } from "@/types/types";
import db from "../prisma";
import { Firmware } from "@prisma/client";

/**
 * Create a new firmware record in the database
 * @param data - The firmware data to create
 */
export async function createFirmware(data: FirmwareCreate): Promise<Firmware> {
    return db.firmware.create({
        data
    });
}

/**
 * Find a firmware by ID
 * @param firmwareId - The ID of the firmware to find
 */
export async function getFirmwareById(firmwareId: string): Promise<Firmware | null> {
    return db.firmware.findUnique({
        where: { id: firmwareId }
    });
}

/**
 * Validate that a firmware belongs to the specified user
 * @param userId - The user ID to check ownership against
 * @param firmwareId - The firmware ID to validate
 */
export async function validateFirmwareOwnership(userId: string, firmwareId: string): Promise<boolean> {
    const firmware = await db.firmware.findFirst({
        where: {
            id: firmwareId,
            Device: {
                userId: userId
            }
        }
    });
    return !!firmware;
}

/**
 * Get the count of firmwares for a user
 * @param userId - The user ID to count firmwares for
 */
export async function getFirmwaresQty(userId: string): Promise<number> {
    return db.firmware.count({
        where: {
            Device: {
                userId
            }
        }
    });
}

/**
 * Get all firmwares for a specific device
 * @param deviceId - The device ID to get firmwares for
 */
export async function getDeviceFirmwares(deviceId: string): Promise<Firmware[]> {
    return db.firmware.findMany({
        where: {
            deviceId
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}