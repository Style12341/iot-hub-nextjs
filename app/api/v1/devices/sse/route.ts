import { validateDeviceOwnership } from "@/lib/contexts/deviceContext";
import { redisSub } from "@/lib/redis";
import { getDeviceChannel } from "@/lib/sseUtils";
import { DeviceSSEMessage, DeviceSSEType } from "@/types/types";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

const redis = redisSub;

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }
    const searchParams = req.nextUrl.searchParams
    const deviceIds = searchParams.get("deviceIds")?.split(",");
    if (!deviceIds) {
        return new Response("Bad request: No device ids provided", { status: 400 });
    }

    // Verify user has access to this device
    const hasAccess = await Promise.all(deviceIds.map(deviceId => validateDeviceOwnership(userId, deviceId)));
    if (!hasAccess.every(access => access)) {
        return new Response("Forbidden: You don't have access to these devices", { status: 403 });
    }

    // Get channels for all sensors in this device
    const channels = deviceIds.map(deviceId => { return { channel: getDeviceChannel(deviceId), deviceId } });
    const channelNames = new Set(channels.map(channel => channel.channel));
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            const sendEvent = (data: object) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            // Subscribe to all sensor channels for this device
            channels.forEach(channel => {
                redis.subscribe(channel.channel).then(() => {
                    console.log(`Subscribed to ${channel.channel} for device ${channel.deviceId}`);
                    sendEvent({
                        type: "connected",
                        message: `Monitoring device ${channel.deviceId}`
                    });
                })
            });


            // Listen for messages on any of the subscribed channels
            const listener = (channel: string, message: string) => {
                if (channelNames.has(channel)) {
                    try {
                        const data: DeviceSSEMessage = JSON.parse(message);
                        const type: DeviceSSEType = data.type;
                        // Add channel info to help identify the sensor
                        sendEvent({
                            ...data,
                            channelId: channel
                        });
                    } catch (err) {
                        console.error("Error parsing message:", err);
                    }
                }
            };

            redis.on("message", listener);

            // Clean up on client disconnect
            req.signal.addEventListener("abort", () => {
                channelNames.forEach(channel => {
                    redis.unsubscribe(channel)
                })
                redis.off("message", listener);
                controller.close();

                console.log(`Closed SSE connection for devices ${channels}`);
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}