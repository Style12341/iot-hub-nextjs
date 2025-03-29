import { NextRequest, NextResponse } from 'next/server';
import { uploadFirmware } from '@/lib/firmwareUtils';
import { validateDeviceOwnership } from '@/lib/contexts/deviceContext';
import { getDeviceFirmwares, getFirmwareByDeviceAndVersion } from '@/lib/contexts/firmwareContext';
import { auth } from '@clerk/nextjs/server';

// Helper function to convert ReadableStream to Buffer
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    return Buffer.concat(chunks);
}

/**
 * GET all firmwares for a specific device
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ deviceId: string }> }
): Promise<NextResponse> {
    try {
        // Authenticate user
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { deviceId } = await params;


        // Validate user owns the device
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied to this device' }, { status: 403 });
        }

        // Get all firmwares for the device
        const firmwares = await getDeviceFirmwares(deviceId);

        return NextResponse.json(firmwares);
    } catch (error) {
        console.error('Error fetching firmware list:', error);
        return NextResponse.json({ error: 'Failed to fetch firmware list' }, { status: 500 });
    }
}

/**
 * POST to upload firmware for a specific device
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ deviceId: string }> }
): Promise<NextResponse> {
    try {
        // Authenticate user
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { deviceId } = await params;

        // Validate user owns the device
        const hasAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied to this device' }, { status: 403 });
        }

        // Process the form data
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const description = formData.get('description') as string;
        const version = formData.get('version') as string;

        // Validate required fields
        if (!file || !description || !version) {
            return NextResponse.json(
                { error: 'Missing required fields: file, description, or version' },
                { status: 400 }
            );
        }
        // Check if firmware doesn't already exist
        const existingFirmware = await getFirmwareByDeviceAndVersion(
            deviceId,
            version
        );
        if (existingFirmware) {
            return NextResponse.json(
                { error: 'Firmware with this version already exists' },
                { status: 409 }
            );
        }

        // Convert File to MulterFile-like object
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const multerFile = {
            fieldname: 'file',
            originalname: file.name,
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

        return NextResponse.json(firmware, { status: 201 });
    } catch (error) {
        console.error('Error uploading firmware:', error);
        return NextResponse.json(
            { error: 'Failed to upload firmware' },
            { status: 500 }
        );
    }
}