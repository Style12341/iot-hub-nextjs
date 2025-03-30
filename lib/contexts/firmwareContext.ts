"use server"

import { FirmwareCreate } from "@/types/types";
import db from "../prisma";
import { Firmware as PrismaFirmware } from "@prisma/client";
import { map } from "zod";

/**
 * Create a new firmware record in the database
 * @param data - The firmware data to create
 */
export async function createFirmware(data: FirmwareCreate) {
    return db.firmware.create({
        data
    });
}

/**
 * Find a firmware by ID
 * @param firmwareId - The ID of the firmware to find
 */
export async function getFirmwareById(firmwareId: string) {
    const res = await db.firmware.findUnique({
        where: { id: firmwareId }
    });
    return await mapFirmwareType(res as PrismaFirmware);
}

/**
 * Validate that a firmware belongs to the specified user
 * @param userId - The user ID to check ownership against
 * @param firmwareId - The firmware ID to validate
 */
export async function validateFirmwareOwnership(userId: string, firmwareId: string) {
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
export async function getFirmwaresQty(userId: string) {
    return db.firmware.count({
        where: {
            Device: {
                userId
            }
        }
    });
}

export async function getFirmwareByDeviceAndVersion(deviceId: string, version: string) {
    const response = await db.firmware.findFirst({
        where: {
            deviceId,
            version
        }
    });
    return await mapFirmwareType(response as PrismaFirmware);
}
export async function deleteFirmwareById(firmwareId: string) {
    return await db.firmware.delete({
        where: {
            id: firmwareId
        }
    });
}
/**
 * Get all firmwares for a specific device
 * @param deviceId - The device ID to get firmwares for
 */
export async function getDeviceFirmwares(deviceId: string) {
    const response = await db.firmware.findMany({
        where: {
            deviceId
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return await Promise.all(response.map(firmware => mapFirmwareType(firmware as PrismaFirmware)));
}
/**
    * Check if a firmware update is available for a device
    * @param deviceId - The device ID to check for updates
    */
export async function getAssignedFirmware(deviceId: string) {
    const response = await db.device.findFirst({
        where: {
            id: deviceId,
        },
        select: {
            AssignedFirmware: true,
        }
    });
    return await mapFirmwareType(response?.AssignedFirmware as PrismaFirmware);
}
/**
 * Update the active firmware for a device it creates the default device firmware if it doesn't exist
 * @param deviceId - The device ID to get the latest firmware for
 */

export async function updateActiveFirmware(deviceId: string, firmware_version: string) {
    return await db.device.update({
        where: {
            id: deviceId,
        },
        data: {
            ActiveFirmware: {
                connectOrCreate: {
                    where: {
                        deviceId_version: {
                            deviceId: deviceId,
                            version: firmware_version,
                        },
                    },
                    create: {
                        version: firmware_version,
                        description: "Firmware sent by device",
                        Device: {
                            connect: {
                                id: deviceId,
                            },
                        },
                        embedded: true,
                    },
                },
            }
        }
    });
}
export async function getFirmwareIdForUpdate(deviceId: string,) {
    const response = await db.device.findFirst({
        where: {
            id: deviceId,
        },
        select: {
            assignedFirmwareId: true,
            activeFirmwareId: true,
        }
    });
    if (!response || !response.activeFirmwareId || !response.assignedFirmwareId) {
        return false;
    }
    if (response.activeFirmwareId === response.assignedFirmwareId) {
        return false;
    }
    return response.assignedFirmwareId;
}




// For embedded firmware (limited fields)
export type EmbeddedFirmware = {
    id: string;
    description: string;
    version: string;
    embedded: true;
    deviceId: string;
    createdAt: Date;
    updatedAt: Date;
};

// For downloadable firmware (all fields)
export type DownloadableFirmware = PrismaFirmware & {
    embedded: false;
    fileUrl: string;
    fileName: string;
    fileSizeBytes: number;
    contentType: string;
    checksum: string;

};

// Combined type - use this throughout your application
export type FirmwareType = EmbeddedFirmware | DownloadableFirmware;

/**
 * Converts a Prisma Firmware to the appropriate FirmwareType variant
 * @param firmware The firmware from Prisma
 * @returns Properly typed firmware with only the relevant fields
 */
export async function mapFirmwareType(firmware: PrismaFirmware): Promise<FirmwareType> {
    if (firmware.embedded) {
        // Return only the permitted fields for embedded firmware
        return new Promise<EmbeddedFirmware>((resolve) => {
            resolve({
                id: firmware.id,
                description: firmware.description,
                version: firmware.version,
                embedded: true,
                deviceId: firmware.deviceId,
                createdAt: firmware.createdAt,
                updatedAt: firmware.updatedAt,
            });
        })
    } else {
        // Return all fields for downloadable firmware
        if (firmware.fileUrl && firmware.fileName && firmware.fileSizeBytes && firmware.contentType && firmware.checksum) {
            return new Promise<DownloadableFirmware>((resolve) => {
                resolve({
                    ...firmware,
                    embedded: false,
                    fileUrl: firmware.fileUrl as string,
                    fileName: firmware.fileName as string,
                    fileSizeBytes: firmware.fileSizeBytes as number,
                    contentType: firmware.contentType as string,
                    checksum: firmware.checksum as string,
                });
            })
        } else {
            throw new Error("Invalid firmware data: Missing fields for downloadable firmware");
        }
    }
}