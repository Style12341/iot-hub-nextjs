import { validateDeviceOwnership } from "@/lib/contexts/deviceContext";
import { redisSub } from "@/lib/redis";
import { getDeviceChannel } from "@/lib/sseUtils";
import { DeviceSSEMessage, DeviceSSEType } from "@/types/types";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

const redis = redisSub;

export async function GET(req: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
    const { userId } = await auth();
    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { deviceId } = await params

    // Verify user has access to this device
    const hasAccess = await validateDeviceOwnership(userId, deviceId);
    if (!hasAccess) {
        return new Response("Forbidden: You don't have access to this device", { status: 403 });
    }

    // Get channels for all sensors in this device
    const subscribeChannel = await getDeviceChannel(deviceId);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            const sendEvent = (data: object) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            // Subscribe to all sensor channels for this device
            redis.subscribe(subscribeChannel).then(() => {
                console.log(`Subscribed to ${subscribeChannel} for device ${deviceId}`);
                sendEvent({
                    type: "connected",
                    message: `Monitoring device ${deviceId}`
                });
            })

            // Listen for messages on any of the subscribed channels
            const listener = (channel: string, message: string) => {
                if (subscribeChannel === channel) {
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
                redis.unsubscribe(subscribeChannel);
                redis.off("message", listener);
                controller.close();
                console.log(`Closed SSE connection for device ${deviceId}`);
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