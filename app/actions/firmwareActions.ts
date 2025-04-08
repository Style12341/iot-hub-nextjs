"use server";

import { uploadFirmware, deleteFirmwareFileById, getFirmwareForDownload } from '@/lib/firmwareUtils';
import { assignFirmwareToDevice, getDeviceFirmwareState, validateDeviceOwnership } from '@/lib/contexts/deviceContext';
import {
    deleteFirmwareById,
    validateFirmwareOwnership,
    getDeviceFirmwares as getFirmwares,
    getFirmwareByDeviceAndVersion,
    updateFirmwareDescription
} from '@/lib/contexts/firmwareContext';
import { createErrorResponse, createSuccessResponse, ServerActionReason, ServerActionResponse } from "@/types/types";
import { Readable } from 'stream';
import { Firmware } from '@prisma/client';
import getUserIdFromAuthOrToken from '@/lib/authUtils';

interface DownloadResult {
    stream: Readable;
    fileName: string;
    contentType: string;
    fileSizeBytes: number;
}
// Add this interface at the top of your file
export interface UploadFileData {
    buffer: ArrayBuffer;
    name: string;
    type: string;
    size: number;
}
/**
 * Get all firmwares for a device
 */
export async function getDeviceFirmwaresAction(
    deviceId: string,
    token?: string | null,
    context?: string
) {
    try {
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, 'Unauthorized access', {
                body: {
                    userId,
                    deviceId,
                    token,
                    context
                }
            });
        }

        // Validate user owns the device
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, 'Access denied to this device', {
                body: {
                    userId,
                    deviceId,
                    token,
                    context
                }
            });
        }

        // Get all firmwares for the device
        const firmwares = await getFirmwares(deviceId);
        const deviceData = await getDeviceFirmwareState(deviceId);
        if (!deviceData) {
            return createErrorResponse(ServerActionReason.NOT_FOUND, 'Device not found', {
                body: {
                    userId,
                    deviceId,
                    token,
                    context
                }
            });
        }
        const response = {
            firmwares,
            deviceData,
        }

        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            'Firmwares retrieved successfully',
            response
        );
    } catch (error) {
        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to fetch firmware list', {
            error,
            body: {
                deviceId,
                token,
                context
            }
        });
    }
}

/**
 * Upload firmware for a device
 */
export async function uploadDeviceFirmwareAction(
    deviceId: string,
    data: {
        file: UploadFileData, // Replace File | Blob with our custom interface
        description: string,
        version: string,
        autoAssign: boolean
    },
    token?: string | null,
    context?: string
) {
    try {
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, 'Unauthorized access', {
                body: {
                    userId,
                    deviceId,
                    token,
                    context
                }
            });
        }

        // Validate user owns the device
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, 'Access denied to this device', {
                body: {
                    userId,
                    deviceId,
                    token,
                    context
                }
            });
        }

        // Extract data
        const { file, description, version, autoAssign } = data;

        // Validate required fields
        if (!file || !description || !version) {
            return createErrorResponse(
                ServerActionReason.INVALID_DATA,
                'Missing required fields: file, description, or version',
                {
                    body: {
                        userId,
                        deviceId,
                        token,
                        context
                    }
                }
            );
        }

        // Check if firmware doesn't already exist
        const existingFirmware = await getFirmwareByDeviceAndVersion(deviceId, version);
        if (existingFirmware) {
            return createErrorResponse(
                ServerActionReason.CONFLICT,
                'Firmware with this version already exists',
                {
                    body: {
                        userId,
                        deviceId,
                        token,
                        context
                    }
                }
            );
        }

        // Convert File data to Buffer
        const buffer = Buffer.from(file.buffer);

        const multerFile = {
            fieldname: 'file',
            originalname: file.name || 'firmware.bin',
            encoding: '7bit',
            mimetype: file.type,
            size: file.size,
            buffer: buffer,
        };

        // Upload firmware using our utility
        const firmware = await uploadFirmware(multerFile, {
            description,
            version,
            deviceId,
        });
        if (!firmware) {
            return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to upload firmware', {
                body: {
                    userId,
                    deviceId,
                    token,
                    context
                }
            });
        }

        // If autoAssign is true, assign firmware to device
        if (autoAssign) {
            await assignFirmwareToDevice(deviceId, firmware.id);
        }

        return createSuccessResponse(
            ServerActionReason.CREATED,
            'Firmware uploaded successfully',
            firmware
        );
    } catch (error) {
        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to upload firmware', {
            error,
            body: {
                deviceId,
                token,
                context
            }
        });
    }
}

/**
 * Validate access to firmware for a specific user and device
 */
export async function validateFirmwareAccessAction(
    deviceId: string,
    firmwareId: string,
    token?: string | null,
    context?: string
): Promise<ServerActionResponse<boolean>> {
    try {
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, 'Unauthorized access', {
                body: {
                    userId,
                    deviceId,
                    firmwareId,
                    token,
                    context
                }
            });
        }

        // Validate user has access to this device and firmware
        const [hasDeviceAccess, hasFirmwareAccess] = await Promise.all([
            validateDeviceOwnership(userId, deviceId),
            validateFirmwareOwnership(userId, firmwareId)
        ]);

        if (!hasDeviceAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, 'Access denied to this device', {
                body: {
                    userId,
                    deviceId,
                    firmwareId,
                    token,
                    context
                }
            });
        }

        if (!hasFirmwareAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, 'Access denied to this firmware', {
                body: {
                    userId,
                    deviceId,
                    firmwareId,
                    token,
                    context
                }
            });
        }

        return createSuccessResponse(ServerActionReason.SUCCESS, 'Access validated', true);
    } catch (error) {
        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to validate firmware access', {
            error,
            body: {
                deviceId,
                firmwareId,
                token,
                context
            }
        });
    }
}

/**
 * Get firmware for download
 */
export async function downloadFirmwareAction(
    deviceId: string,
    firmwareId: string,
    token?: string | null,
    context?: string
): Promise<ServerActionResponse<DownloadResult>> {
    try {
        // First validate access
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, 'Unauthorized access', {
                body: {
                    userId,
                    deviceId,
                    firmwareId,
                    token,
                    context
                }
            });
        }

        const accessResult = await validateFirmwareAccessAction(deviceId, firmwareId, token, context);
        if (!accessResult.success) {
            return createErrorResponse(accessResult.reason, accessResult.message, {
                body: {
                    userId,
                    deviceId,
                    firmwareId,
                    token,
                    context
                }
            });
        }

        // Get the firmware file for download
        const downloadResult = await getFirmwareForDownload(firmwareId);

        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            'Firmware retrieved successfully',
            downloadResult
        );
    } catch (error) {

        if (error instanceof Error) {
            if (error.message === 'Firmware not found' || error.message === 'Firmware file not found in storage') {
                return createErrorResponse(ServerActionReason.NOT_FOUND, error.message, {
                    error,
                    body: {
                        deviceId,
                        firmwareId,
                        token,
                        context
                    }
                });
            }
        }

        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to download firmware', {
            error,
            body: {
                deviceId,
                firmwareId,
                token,
                context
            }
        });
    }
}

/**
 * Delete firmware by ID
 */
export async function deleteFirmwareAction(
    deviceId: string,
    firmwareId: string,
    token?: string | null,
    context?: string
): Promise<ServerActionResponse> {
    try {
        // First authenticate
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, 'Unauthorized access', {
                body: {
                    userId,
                    deviceId,
                    firmwareId,
                    token,
                    context
                }
            });
        }

        // Validate access
        const accessResult = await validateFirmwareAccessAction(deviceId, firmwareId, token, context);
        if (!accessResult.success) {
            return createErrorResponse(accessResult.reason, accessResult.message, {
                body: {
                    userId,
                    deviceId,
                    firmwareId,
                    token,
                    context
                }
            });
        }

        // Delete firmware file from storage
        await deleteFirmwareFileById(firmwareId);

        // Delete firmware record from database
        await deleteFirmwareById(firmwareId);

        return createSuccessResponse(
            ServerActionReason.NO_CONTENT,
            'Firmware deleted successfully',
            null
        );
    } catch (error) {
        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to delete firmware', {
            error,
            body: {
                deviceId,
                firmwareId,
                token,
                context
            }
        });
    }
}
/**
 * Assign firmware to a device
 */
export async function assignFirmwareAction(deviceId: string, firmwareId: string, token?: string | null, context?: string) {
    try {
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, 'Unauthorized access', {
                body: {
                    userId,
                    deviceId,
                    firmwareId,
                    token,
                    context
                }
            });
        }

        // Validate user owns the device
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, 'Access denied to this device', {
                body: {
                    userId,
                    deviceId,
                    firmwareId,
                    token,
                    context
                }
            });
        }

        // Assign firmware to device
        const firmware = await assignFirmwareToDevice(deviceId, firmwareId);

        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            'Firmware assigned successfully',
            firmware
        );
    } catch (error) {
        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to assign firmware', {
            error,
            body: {
                deviceId,
                firmwareId,
                token,
                context
            }
        });
    }

}
/**
 * Update firmware description
 */
export async function updateFirmwareDescriptionAction(
    deviceId: string,
    firmwareId: string,
    description: string,
    token?: string | null,
    context?: string
) {
    try {
        // First authenticate
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, 'Unauthorized access', {
                body: {
                    userId,
                    deviceId,
                    firmwareId,
                    token,
                    context
                }
            });
        }

        // Validate access
        const accessResult = await validateFirmwareAccessAction(deviceId, firmwareId, token, context);
        if (!accessResult.success) {
            return createErrorResponse(accessResult.reason, accessResult.message, {
                body: {
                    userId,
                    deviceId,
                    firmwareId,
                    token,
                    context
                }
            });
        }

        // Update firmware description
        const firmware = await updateFirmwareDescription(firmwareId, description);

        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            'Firmware description updated successfully',
            firmware
        );
    } catch (error) {
        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to update firmware description', {
            error,
            body: {
                deviceId,
                firmwareId,
                token,
                context
            }
        });
    }
}