import getUserIdFromAuthOrToken from "@/lib/authUtils";
import { validateDeviceOwnership } from "@/lib/contexts/deviceContext";
import { getFirmwareIdForUpdate, updateActiveFirmware } from "@/lib/contexts/firmwareContext";
import { publishDeviceStatus } from "@/lib/workers/logWorker";
import { DeviceSSEMessage } from "@/types/types";
import { NextRequest, NextResponse } from "next/server"

interface DeviceStatusBody {
    firmware_version?: string
}
//Will be used to send the status (firmware version, fast, etc) of the device to the server
export async function POST(req: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
    const token = req.headers.get('Authorization')
    const userId = await getUserIdFromAuthOrToken(token)
    if (!userId) {
        return new NextResponse('Error: bad token', {
            status: 403,
        })
    }

    const body: DeviceStatusBody = await req.json()
    const { firmware_version } = body;
    const { deviceId } = await params

    const hasAccess = await validateDeviceOwnership(userId, deviceId);
    if (!hasAccess) {
        return new NextResponse('Error: user does not own device', {
            status: 403,
        })
    }
    if (!firmware_version) {
        return new NextResponse('Error: firmware version not provided', {
            status: 400,
        })
    }
    const deviceStatus: DeviceSSEMessage = {
        activeFirmwareVersion: firmware_version,
        type: "status",
        id: deviceId,
    }


    // Update active firmware
    await Promise.all([updateActiveFirmware(deviceId, firmware_version as string), publishDeviceStatus(deviceStatus)])
    // Should update firmware
    const firmware_id = await getFirmwareIdForUpdate(deviceId)
    const unix_time = Math.round(Date.now() / 1000)
    if (!firmware_id) {
        // No update needed
        return new NextResponse(JSON.stringify({ unix_time: unix_time }), {
            status: 200,
        })
    }
    const message = {
        notice: "update required",
        firmware_id: firmware_id,
        unix_time: unix_time,
    }
    return new NextResponse(JSON.stringify(message), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    })
}