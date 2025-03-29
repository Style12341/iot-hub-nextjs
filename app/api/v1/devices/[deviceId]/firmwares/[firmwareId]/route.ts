import { NextRequest, NextResponse } from 'next/server';
import { deleteFirmwareFileById, getFirmwareForDownload } from '@/lib/firmwareUtils';
import { validateDeviceOwnership } from '@/lib/contexts/deviceContext';
import { deleteFirmwareById, validateFirmwareOwnership } from '@/lib/contexts/firmwareContext';
import { auth } from '@clerk/nextjs/server';
import { getUserFromToken } from '@/lib/contexts/userTokensContext';
import { LOGTOKEN } from '@/types/types';

/**
 * GET handler for firmware direct download
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ deviceId: string, firmwareId: string }> }
): Promise<Response> {
    try {

        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { deviceId, firmwareId } = await params;

        const response = await validateAccess(userId, deviceId, firmwareId);
        if (response !== true) {
            return response;
        }

        // Get the firmware file for download
        const { stream, fileName, contentType, fileSizeBytes } = await getFirmwareForDownload(firmwareId);

        // Create a ReadableStream from the Node.js Readable stream
        const readableStream = new ReadableStream({
            start(controller) {
                stream.on('data', (chunk) => {
                    controller.enqueue(chunk);
                });
                stream.on('end', () => {
                    controller.close();
                });
                stream.on('error', (err) => {
                    controller.error(err);
                });
            }
        });

        // Return the streaming response with appropriate headers for download
        return new Response(readableStream, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': fileSizeBytes.toString(),
                'Cache-Control': 'no-store'
            }
        });
    } catch (error) {
        console.error('Error downloading firmware:', error);

        if (error instanceof Error) {
            if (error.message === 'Firmware not found' || error.message === 'Firmware file not found in storage') {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response(JSON.stringify({ error: 'Failed to download firmware' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ deviceId: string, firmwareId: string }> }
): Promise<Response> {
    let { userId } = await auth();
    const token = req.headers.get('Authorization')
    if (!userId && !token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await getUserFromToken(token, LOGTOKEN);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = user.id;
    const { deviceId, firmwareId } = await params;
    const response = await validateAccess(userId, deviceId, firmwareId);
    if (response !== true) {
        return response;
    }
    try {
        await deleteFirmwareFileById(firmwareId);
        // If delete is succesfull it doesnt throw an error, so we can delete the firmware from the database
        await deleteFirmwareById(firmwareId);
    } catch {
        return new Response(JSON.stringify({ error: 'Failed to delete firmware' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    return new Response(JSON.stringify({ message: 'Firmware deleted successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
async function validateAccess(userId: string, deviceId: string, firmwareId: string) {
    // Validate user has access to this device
    const [hasDeviceAccess, hasFirmwareAccess] = await Promise.all([
        validateDeviceOwnership(userId, deviceId),
        validateFirmwareOwnership(userId, firmwareId)
    ]);
    if (!hasDeviceAccess) {
        return new Response(JSON.stringify({ error: 'Access denied to this device' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!hasFirmwareAccess) {
        return new Response(JSON.stringify({ error: 'Access denied to this firmware' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    return true;
}
