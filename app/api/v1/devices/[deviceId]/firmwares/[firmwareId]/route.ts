import { NextRequest, NextResponse } from 'next/server';
import { getFirmwareForDownload } from '@/lib/firmwareUtils';
import { validateDeviceOwnership } from '@/lib/contexts/deviceContext';
import { validateFirmwareOwnership } from '@/lib/contexts/firmwareContext';
import { auth } from '@clerk/nextjs/server';

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

        // Validate user has access to this device
        const hasDeviceAccess = await validateDeviceOwnership(userId, deviceId);
        if (!hasDeviceAccess) {
            return new Response(JSON.stringify({ error: 'Access denied to this device' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate that the firmware belongs to the specified device
        const hasFirmwareAccess = await validateFirmwareOwnership(userId, firmwareId);
        if (!hasFirmwareAccess) {
            return new Response(JSON.stringify({ error: 'Access denied to this firmware' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
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