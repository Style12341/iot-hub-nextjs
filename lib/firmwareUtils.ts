import { bucket } from './configs/gcsConfig';
import { createHash } from 'crypto';
import { Firmware } from '@prisma/client';
import { Readable } from 'stream';
import { createFirmware, FirmwareType, getFirmwareById } from './contexts/firmwareContext';
import { GetSignedUrlConfig } from '@google-cloud/storage';
import { FirmwareCreate } from '@/types/types';

// Define types for the file and metadata
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}

interface FirmwareMetadata {
    description: string;
    version: string;
    deviceId: string;
}

interface DownloadResult {
    stream: Readable;
    fileName: string;
    contentType: string;
    fileSizeBytes: number;
}

interface PresignedUrlResult {
    url: string;
    fileName: string;
    version: string;
    checksum: string | null;
    fileSizeBytes: number;
}

/**
 * Upload firmware to Google Cloud Storage and create DB record
 * @param file - The file object from multer
 * @param metadata - Firmware metadata
 */
export async function uploadFirmware(file: MulterFile, metadata: FirmwareMetadata) {
    try {
        // Create a unique filename in GCS
        const filePath = `firmwares/${metadata.deviceId}/${metadata.version}-${file.originalname}`;

        // Calculate SHA256 checksum
        const fileBuffer = file.buffer;
        const checksum = createHash('sha256').update(fileBuffer).digest('hex');

        // Upload the file to Google Cloud Storage
        const blob = bucket.file(filePath);
        const blobStream = blob.createWriteStream({
            resumable: false,
            metadata: {
                contentType: file.mimetype,
                metadata: {
                    checksum,
                    version: metadata.version,
                    description: metadata.description
                }
            }
        });

        return new Promise<FirmwareType>((resolve, reject) => {
            blobStream.on('error', (err: Error) => reject(err));

            blobStream.on('finish', async () => {
                try {
                    // Store just the file path instead of full URL
                    const firmwareData: FirmwareCreate = {
                        description: metadata.description,
                        version: metadata.version,
                        fileUrl: filePath, // Store only the path
                        fileName: file.originalname,
                        fileSizeBytes: file.size,
                        contentType: file.mimetype,
                        checksum,
                        deviceId: metadata.deviceId,
                    }
                    const firmware = await createFirmware(firmwareData);
                    if (!firmware) {
                        throw new Error('Failed to create firmware record in DB');
                    }

                    resolve(firmware);
                } catch (error) {
                    reject(error);
                }
            });

            blobStream.end(fileBuffer);
        });
    } catch (error) {
        console.error('Error uploading firmware:', {
            error,
            body: {
                file,
                metadata,
            }
        });
        throw error;
    }
}

/**
 * Get firmware file for direct download
 * @param firmwareId - ID of the firmware to download
 */
export async function getFirmwareForDownload(firmwareId: string): Promise<DownloadResult> {
    try {
        // Get firmware metadata from the database using context function
        const firmware = await getFirmwareById(firmwareId);

        if (!firmware) {
            throw new Error('Firmware not found');
        }
        if (firmware.embedded) {
            throw new Error('Firmware is embedded, cannot be downloaded');
        }
        // Get file from Google Cloud Storage using stored path directly
        const file = bucket.file(firmware.fileUrl);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            throw new Error('Firmware file not found in storage');
        }

        // Create a readable stream
        const stream = file.createReadStream();

        return {
            stream,
            fileName: firmware.fileName,
            contentType: firmware.contentType,
            fileSizeBytes: firmware.fileSizeBytes
        };
    } catch (error) {
        console.error('Error downloading firmware:', {
            error,
            body: {
                firmwareId: firmwareId,
            }
        });
        throw error;
    }
}

/**
 * Generate a presigned URL for device firmware updates
 * @param firmwareId - ID of the firmware
 * @param expirationMinutes - URL expiration time in minutes
 */
export async function generateFirmwarePresignedUrl(
    firmwareId: string,
    expirationMinutes: number = 10
): Promise<PresignedUrlResult> {
    try {
        // Get firmware metadata from the database using context function
        const firmware = await getFirmwareById(firmwareId);

        if (!firmware) {
            throw new Error('Firmware not found');
        }
        if (firmware.embedded) {
            throw new Error('Firmware is embedded, cannot be downloaded');
        }

        // Get file from Google Cloud Storage using stored path directly
        const file = bucket.file(firmware.fileUrl);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            throw new Error('Firmware file not found in storage');
        }

        // Generate signed URL options
        const options: GetSignedUrlConfig = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + expirationMinutes * 60 * 1000, // Convert minutes to milliseconds
        };

        // Generate the signed URL
        const [url] = await file.getSignedUrl(options);

        return {
            url,
            fileName: firmware.fileName,
            version: firmware.version,
            checksum: firmware.checksum,
            fileSizeBytes: firmware.fileSizeBytes
        };
    } catch (error) {
        console.error('Error generating presigned URL:', {
            error,
            body: {
                firmwareId: firmwareId,
                expirationMinutes: expirationMinutes,
            }

        });
        throw error;
    }
}
export async function deleteFirmwareFileById(firmwareId: string): Promise<void> {
    try {
        // Get firmware metadata from the database using context function
        const firmware = await getFirmwareById(firmwareId);

        if (!firmware) {
            throw new Error('Firmware not found');
        }
        if (firmware.embedded) {
            return; // No need to delete embedded firmware
        }
        // Get file from Google Cloud Storage using stored path directly
        const file = bucket.file(firmware.fileUrl);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            throw new Error('Firmware file not found in storage');
        }

        // Delete the file from Google Cloud Storage
        await file.delete();
    } catch (error) {
        console.error('Error deleting firmware file:', {
            error,
            body: {
                firmwareId: firmwareId,
            }
        });
        throw error;
    }
}