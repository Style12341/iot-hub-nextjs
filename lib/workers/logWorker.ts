// /lib/workers/logWorker.ts
import { Worker } from 'bullmq';
import redis from '@/lib/redis';
import { getDevice } from '@/lib/contexts/deviceContext';
import { getGroupSensors } from '@/lib/contexts/groupSensorsContext';
import { createMultipleSensorValues } from '@/lib/contexts/sensorValuesContext';
import { getUserFromToken } from '@/lib/contexts/userTokensContext';
import { LOGTOKEN } from '@/types/types';

type SensorsLogBody = {
    sensor_id: string;
    timestamp?: number;
    value: number;
};

type DeviceLogBody = {
    token: string;
    device_id: string;
    group_id: string;
    sensors: SensorsLogBody[];
};

type RedisRequestCache<T = Object> = {
    device_id: string;
    group_id: string;
    sensors_ids: string[];
    groupSensorIdMap: T;
};

const CACHE_EXPIRATION = 90; // 90 seconds

export type LogEntry = {
    groupSensorId: string;
    timestamp: Date;
    value: number;
};

// Utility functions (same as before)
async function tryGetCache(token: string, device_id: string): Promise<RedisRequestCache<Map<string, string>> | null> {
    const cache_key = getCacheKey(token, device_id);
    const data = await redis.get(cache_key);
    if (!data) return null;
    const body: RedisRequestCache = JSON.parse(data);
    body.groupSensorIdMap = new Map(Object.entries(body.groupSensorIdMap));
    return body as RedisRequestCache<Map<string, string>>;
}

async function validateRequestFromDB(token: string, device_id: string, group_id: string, sensor_ids: string[]): Promise<RedisRequestCache<Map<string, string>> | string> {
    const [user, device] = await Promise.all([
        getUserFromToken(token, LOGTOKEN),
        getDevice(device_id)
    ]);

    if (!user) {
        return "Error: bad token";
    }
    if (!device) {
        return "Error: device not found";
    }
    const userOwnsDevice = device.userId === user.id;
    const userOwnsGroup = device.Groups.find(group => group.id === group_id) !== undefined;
    const userOwnsSensors = device.Sensors.filter(sensor => sensor_ids.includes(sensor.id)).length === sensor_ids.length;
    if (!userOwnsDevice || !userOwnsGroup || !userOwnsSensors) {
        return "Error: user does not own device, group or sensors";
    }
    const groupSensors = await getGroupSensors(group_id, sensor_ids);
    const groupSensorIdMap = new Map<string, string>();
    groupSensors.forEach(groupSensor => {
        groupSensorIdMap.set(groupSensor.sensorId, groupSensor.id);
    });
    const ans: RedisRequestCache<Map<string, string>> = {
        device_id,
        group_id,
        sensors_ids: sensor_ids,
        groupSensorIdMap
    };
    return ans;
}

async function forceCache(token: string, data: RedisRequestCache<Map<string, string>>): Promise<void> {
    const cache_key = `${token}:${data.device_id}`;
    const dataCopy: RedisRequestCache = { ...data };
    dataCopy.groupSensorIdMap = Object.fromEntries(data.groupSensorIdMap);
    await redis.pipeline()
        .set(cache_key, JSON.stringify(dataCopy))
        .expire(cache_key, CACHE_EXPIRATION)
        .exec();
}

function isCacheValid(
    cache: RedisRequestCache<Map<string, string>> | null,
    device_id: string,
    group_id: string,
    sensor_ids: string[]
): boolean {
    if (!cache || cache.device_id !== device_id || cache.group_id !== group_id) return false;
    // Compare lengths first
    if (cache.sensors_ids.length !== sensor_ids.length) return false;
    // Check if every sensor in sensor_ids is present in the cache
    for (let sensor of sensor_ids) {
        if (!cache.sensors_ids.includes(sensor)) return false;
    }
    return true;
}

export async function processLog(body: DeviceLogBody): Promise<string> {
    const { token, device_id, group_id, sensors } = body;
    const sensor_ids = sensors.map(sensor => sensor.sensor_id);

    let cache = await tryGetCache(token, device_id);
    let validationResult: RedisRequestCache<Map<string, string>> | string | null = null;
    if (!isCacheValid(cache, device_id, group_id, sensor_ids)) {
        console.log("Cache miss");
        validationResult = await validateRequestFromDB(token, device_id, group_id, sensor_ids);
        if (typeof validationResult === 'string') {
            // Return the error message for logging purposes
            return validationResult;
        }
        await forceCache(token, validationResult);
        cache = validationResult;
    } else {
        console.log("Cache hit");
        await redis.expire(getCacheKey(token, device_id), CACHE_EXPIRATION);
    }

    const { groupSensorIdMap } = cache as RedisRequestCache<Map<string, string>>;
    const logs: LogEntry[] = sensors.map(sensor => ({
        groupSensorId: groupSensorIdMap.get(sensor.sensor_id) as string,
        timestamp: sensor.timestamp ? new Date(sensor.timestamp * 1000) : new Date(),
        value: sensor.value
    }));

    await createMultipleSensorValues(logs);
    return "Success";
}

// Instantiate a BullMQ Worker that processes log jobs
const logWorker = new Worker(
    'logQueue',
    async job => {
        try {
            const result = await processLog(job.data as DeviceLogBody);
            if (result !== "Success") {
                console.error(`Log job failed: ${result}`);
            }
        } catch (err) {
            console.error("Error processing log job:", err);
        }
    },
    {
        connection: redis.duplicate()
    }
);

logWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id || "no-id"} failed with error: ${err}`);
});
function getCacheKey(token: string, device_id: string) {
    return `${token}:${device_id}`;
}