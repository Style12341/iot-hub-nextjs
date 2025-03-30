import { NextRequest, NextResponse } from 'next/server';
import { getDeviceFirmwaresAction, uploadDeviceFirmwareAction, UploadFileData } from '@/app/actions/firmwareActions';
import { auth } from '@clerk/nextjs/server';
/**
 * GET all firmwares for a specific device
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ deviceId: string }> }
): Promise<NextResponse> {
    try {
        const token = req.headers.get('Authorization');
        const { deviceId } = await params;
        // Use server action to get firmwares
        const result = await getDeviceFirmwaresAction(deviceId, token);
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: result.statusCode });
        }
        return NextResponse.json(result.data, { status: result.statusCode });
    } catch (error) {
        console.error('Error in GET firmwares route:', error);
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
        const token = req.headers.get('Authorization');
        const { deviceId } = await params;
        // Process the form data
        const formData = await req.formData();
        const file = formData.get('file');
        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: 'Invalid file format' },
                { status: 400 }
            );
        }
        const fileData: UploadFileData = {
            buffer: await file.arrayBuffer(),
            name: file.name,
            type: file.type,
            size: file.size
        };
        const description = formData.get('description') as string;
        const version = formData.get('version') as string;
        const autoAssign = formData.get('autoAssign') === 'true';
        // Validate required form data
        if (!file || !description || !version) {
            return NextResponse.json(
                { error: 'Missing required fields: file, description, or version' },
                { status: 400 }
            );
        }
        // Use server action to upload firmware
        const result = await uploadDeviceFirmwareAction(deviceId, {
            file: fileData,
            description,
            version,
            autoAssign
        }, token);

        // Handle response based on result
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: result.statusCode });
        }

        return NextResponse.json(result.data, { status: result.statusCode });
    } catch (error) {
        console.error('Error in POST firmware route:', error);
        return NextResponse.json(
            { error: 'Failed to upload firmware' },
            { status: 500 }
        );
    }
}