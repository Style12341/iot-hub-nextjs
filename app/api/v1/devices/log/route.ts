// /api/v1/devices/log
// Could have device id as a query parameter but for compatibility it will stay in the request body

import redis from "@/lib/redis"
import { processLog } from "@/lib/workers/logWorker"
import { Queue } from "bullmq"

type SensorsLogBody = {
    sensor_id: string
    timestamp?: number
    value: number
}
type DeviceLogBody = {
    fast: boolean,
    firmware_version?: string
    device_id: string
    group_id: string
    sensors: SensorsLogBody[]
}

const logQueue = new Queue('logQueue', { connection: redis });

export async function POST(req: Request) {
    const token = req.headers.get('Authorization')
    if (!token) {
        return new Response('Error: bad token', {
            status: 403,
        })
    }

    const body: DeviceLogBody = await req.json()
    const { device_id, group_id, sensors, fast, firmware_version } = body;
    const requestData = { token, device_id, group_id, sensors, firmware_version };

    if (fast) {
        // Enqueue the job and return immediately
        console.log("Sending job to queue")
        // On catch execute processLog synchronously
        logQueue.add('logJob', requestData).catch(async () => {
            console.log("Job logging failed, executing synchronously")
            processLog(requestData);
        }
        );
        return new Response('Accepted', {
            status: 202,
        });
    } else {
        // Process synchronously for a slower but more detailed response
        const result = await processLog(requestData);
        if (result === "Success") {
            return new Response('Created', {
                status: 201,
            }
            );
        } else if (result === "Error: device not found") {
            return new Response('Error: device not found', {
                status: 404,
            });
        } else if (result === "Error: user does not own device, group or sensors") {
            return new Response('Error: user does not own device, group or sensors', {
                status: 403,
            });
        } else {
            return new Response(result, {
                status: 400,
            });
        }
    }
}