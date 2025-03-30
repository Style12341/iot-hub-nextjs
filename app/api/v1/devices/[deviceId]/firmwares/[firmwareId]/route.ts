import { NextRequest, NextResponse } from 'next/server';
import { downloadFirmwareAction, deleteFirmwareAction } from '@/app/actions/firmwareActions';
import { auth } from '@clerk/nextjs/server';
import getUserIdFromAuthOrToken from '@/lib/authUtils';
import { ServerActionReason } from '@/types/types';

/**
 * GET handler for firmware direct download
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ deviceId: string, firmwareId: string }> }
): Promise<Response> {
    try {
        // Get authenticated user ID
        const token = req.headers.get('Authorization');
        const { deviceId, firmwareId } = await params;
        // Use the server action to download the firmware
        const result = await downloadFirmwareAction(deviceId, firmwareId, token);

        if (!result.success) {
            return new Response(JSON.stringify({ error: result.message }), {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Extract download result data
        const { stream, fileName, contentType, fileSizeBytes } = result.data;

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
        console.error('Error in firmware download route:', error);
        return new Response(JSON.stringify({ error: 'Failed to download firmware' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * DELETE handler for firmware deletion
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ deviceId: string, firmwareId: string }> }
): Promise<Response> {
    try {
        // Get user ID from auth or token
        const token = req.headers.get('Authorization');
        const { deviceId, firmwareId } = await params;
        // Use the server action to delete the firmware
        const result = await deleteFirmwareAction(deviceId, firmwareId, token);

        if (!result.success) {

            return new NextResponse(JSON.stringify({ error: result.message }), {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        // Return success response
        return new NextResponse(JSON.stringify({ message: result.message }), {
            status: result.statusCode,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in firmware delete route:', error);
        return new NextResponse(JSON.stringify({ error: 'Failed to delete firmware' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}