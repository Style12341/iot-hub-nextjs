"use server";

import { uploadFirmware, deleteFirmwareFileById, getFirmwareForDownload } from '@/lib/firmwareUtils';
import { assignFirmwareToDevice, validateDeviceOwnership } from '@/lib/contexts/deviceContext';
import {
    deleteFirmwareById,
    validateFirmwareOwnership,
    getDeviceFirmwares as getFirmwares,
    getFirmwareByDeviceAndVersion
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

/**
 * Get all firmwares for a device
 */
export async function getDeviceFirmwaresAction(
    deviceId: string,
    token?: string | null,
    context?: string
): Promise<ServerActionResponse<Firmware[]>> {
    try {
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, 'Unauthorized access');
        }

        // Validate user owns the device
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, 'Access denied to this device');
        }

        // Get all firmwares for the device
        const firmwares = await getFirmwares(deviceId);

        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            'Firmwares retrieved successfully',
            firmwares
        );
    } catch (error) {
        console.error('Error fetching firmware list:', error);
        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to fetch firmware list');
    }
}

/**
 * Upload firmware for a device
 */
export async function uploadDeviceFirmwareAction(
    deviceId: string,
    data: {
        file: File | Blob,
        description: string,
        version: string,
        autoAssign: boolean
    },
    token?: string | null,
    context?: string
): Promise<ServerActionResponse<Firmware>> {
    try {
        const userId = await getUserIdFromAuthOrToken(token, context);
        if (!userId) {
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, 'Unauthorized access');
        }

        // Validate user owns the device
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, 'Access denied to this device');
        }

        // Extract data
        const { file, description, version, autoAssign } = data;

        // Validate required fields
        if (!file || !description || !version) {
            return createErrorResponse(
                ServerActionReason.INVALID_DATA,
                'Missing required fields: file, description, or version'
            );
        }

        // Check if firmware doesn't already exist
        const existingFirmware = await getFirmwareByDeviceAndVersion(deviceId, version);
        if (existingFirmware) {
            return createErrorResponse(
                ServerActionReason.CONFLICT,
                'Firmware with this version already exists'
            );
        }

        // Convert File to MulterFile-like object
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const multerFile = {
            fieldname: 'file',
            originalname: file instanceof File ? file.name : 'unknown',
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
        console.error('Error uploading firmware:', error);
        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to upload firmware');
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
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, 'Unauthorized access');
        }

        // Validate user has access to this device and firmware
        const [hasDeviceAccess, hasFirmwareAccess] = await Promise.all([
            validateDeviceOwnership(userId, deviceId),
            validateFirmwareOwnership(userId, firmwareId)
        ]);

        if (!hasDeviceAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, 'Access denied to this device');
        }

        if (!hasFirmwareAccess) {
            return createErrorResponse(ServerActionReason.FORBIDDEN, 'Access denied to this firmware');
        }

        return createSuccessResponse(ServerActionReason.SUCCESS, 'Access validated', true);
    } catch (error) {
        console.error('Error validating firmware access:', error);
        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to validate firmware access');
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
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, 'Unauthorized access');
        }

        const accessResult = await validateFirmwareAccessAction(deviceId, firmwareId, token, context);
        if (!accessResult.success) {
            return createErrorResponse(accessResult.reason, accessResult.message);
        }

        // Get the firmware file for download
        const downloadResult = await getFirmwareForDownload(firmwareId);

        return createSuccessResponse(
            ServerActionReason.SUCCESS,
            'Firmware retrieved successfully',
            downloadResult
        );
    } catch (error) {
        console.error('Error downloading firmware:', error);

        if (error instanceof Error) {
            if (error.message === 'Firmware not found' || error.message === 'Firmware file not found in storage') {
                return createErrorResponse(ServerActionReason.NOT_FOUND, error.message);
            }
        }

        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to download firmware');
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
            return createErrorResponse(ServerActionReason.UNAUTHORIZED, 'Unauthorized access');
        }

        // Validate access
        const accessResult = await validateFirmwareAccessAction(deviceId, firmwareId, token, context);
        if (!accessResult.success) {
            return createErrorResponse(accessResult.reason, accessResult.message);
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
        console.error('Error deleting firmware:', error);
        return createErrorResponse(ServerActionReason.INTERNAL_ERROR, 'Failed to delete firmware');
    }
}