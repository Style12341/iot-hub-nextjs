// /lib/workers/logWorker.ts
import { Worker } from 'bullmq';
import redis, { redisPub } from '@/lib/redis';
import { getDevice, ONLINE_DEVICE_THRESHOLD, updateDeviceActiveGroup, updateDeviceLastValueAt } from '@/lib/contexts/deviceContext';
import { getGroupSensors } from '@/lib/contexts/groupSensorsContext';
import { createMultipleSensorValues } from '@/lib/contexts/sensorValuesContext';
import { getUserFromToken } from '@/lib/contexts/userTokensContext';
import { DeviceSSEMessage, LOGTOKEN } from '@/types/types';
import { getDeviceChannel } from '../sseUtils';
import { trackMetricInDB } from '../contexts/metricsContext';

type SensorValue = {
    value: number;
    timestamp: number;
}

type SensorsLogBody = {
    sensor_id: string;
    sensor_values: SensorValue[];
}
type DeviceLogBody = {
    token: string;
    device_id: string;
    group_id: string;
    firmware_version?: string;
    sensors: SensorsLogBody[];
};

type RedisRequestCache<T = Object> = {
    userId: string;
    device_id: string;
    group_id: string;
    sensors_ids: string[];
    groupSensorIdMap: T;
};

const CACHE_EXPIRATION = ONLINE_DEVICE_THRESHOLD / 1000; // 90 seconds
export type LogEntry = {
    groupSensorId: string;
    timestamp: Date;
    value: number;
};
// Create a wrapper for Redis operations with fallback
async function safeRedisOperation<T>(operation: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        console.warn('Redis operation failed, using fallback:', error);
        return await fallback();
    }
}
async function tryGetCache(token: string, device_id: string): Promise<RedisRequestCache<Map<string, string>> | null> {
    return safeRedisOperation(
        async () => {
            const cache_key = getCacheKey(token, device_id);
            const data = await redis.get(cache_key);
            if (!data) return null;
            const body: RedisRequestCache = JSON.parse(data);
            body.groupSensorIdMap = new Map(Object.entries(body.groupSensorIdMap));
            return body as RedisRequestCache<Map<string, string>>;
        },
        async () => {
            // Return null when Redis is down - will force DB validation
            return null;
        }
    );
}
async function forceCache(token: string, data: RedisRequestCache<Map<string, string>>): Promise<void> {
    return safeRedisOperation(
        async () => {
            const cache_key = `${token}:${data.device_id}`;
            const dataCopy: RedisRequestCache = { ...data };
            dataCopy.groupSensorIdMap = Object.fromEntries(data.groupSensorIdMap);
            await redis.pipeline()
                .set(cache_key, JSON.stringify(dataCopy))
                .expire(cache_key, CACHE_EXPIRATION)
                .exec();
        },
        async () => {
            // Do nothing if Redis is down - the application will continue without caching
            return;
        }
    );
}
function refreshTTLOnCache(token: string, device_id: string) {
    redis.expire(getCacheKey(token, device_id), CACHE_EXPIRATION);
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
        userId: user.id,
        device_id,
        group_id,
        sensors_ids: sensor_ids,
        groupSensorIdMap
    };
    return ans;
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

export async function processLog(body: DeviceLogBody) {
    try {
        const { token, device_id, group_id, sensors, firmware_version } = body;
        const sensor_ids = sensors.map(sensor => sensor.sensor_id);

        // Cache validation
        let cache = null;
        try {
            cache = await tryGetCache(token, device_id);
        } catch (error: any) {
            console.warn('Redis operation failed, using fallback:', error);
            // Continue without cache - will force DB validation
        }

        let validationResult: RedisRequestCache<Map<string, string>> | string | null = null;

        if (!isCacheValid(cache, device_id, group_id, sensor_ids)) {
            try {
                validationResult = await validateRequestFromDB(token, device_id, group_id, sensor_ids);

                if (typeof validationResult === 'string') {
                    console.error(`[${device_id}] Validation failed: ${validationResult}`);
                    return validationResult;
                }

                try {
                    await forceCache(token, validationResult);
                } catch (cacheError: any) {
                    console.warn(`[${device_id}] Could not update cache: ${cacheError.message}`);
                    // Continue without caching
                }

                cache = validationResult;
            } catch (validationError: any) {
                console.error(`[${device_id}] Database validation error: ${validationError.message}`);
                return "Error: database validation failed";
            }
        } else {
            try {
                refreshTTLOnCache(token, device_id);
            } catch (ttlError: any) {
                console.warn(`[${device_id}] Could not refresh cache TTL: ${ttlError.message}`);
                // Continue anyway
            }
        }

        // Essential checkpoint that was missing - ensure we have valid data
        if (!cache || !cache.groupSensorIdMap) {
            console.error(`[${device_id}] Invalid cache state after validation`);
            return "Error: invalid cache state";
        }

        const { groupSensorIdMap } = cache as RedisRequestCache<Map<string, string>>;

        // Validate all sensors have mappings
        const missingMappings = sensors.filter(s => !groupSensorIdMap.has(s.sensor_id));
        if (missingMappings.length > 0) {
            console.error(`[${device_id}] Missing groupSensor mappings for sensors: ${missingMappings.map(s => s.sensor_id).join(', ')}`);
            return "Error: missing sensor mappings";
        }

        const sensorLogs = sensors.map(sensor => {
            const groupSensorId = groupSensorIdMap.get(sensor.sensor_id);
            if (!groupSensorId) {
                throw new Error(`Missing groupSensorId for sensor_id ${sensor.sensor_id}`);
            }
            return sensor.sensor_values.map(sv => {
                return {
                    groupSensorId,
                    timestamp: sv.timestamp ? new Date(sv.timestamp * 1000) : new Date(),
                    value: sv.value
                }
            });
        });
        const logs: LogEntry[] = sensorLogs.flatMap(logs => logs);

        const deviceStatus: DeviceSSEMessage = {
            id: device_id,
            lastValueAt: new Date(),
            activeFirmwareVersion: firmware_version || "unknown",
            type: "new sensors",
            sensors: logs.map(log => ({
                groupSensorId: log.groupSensorId,
                value: {
                    value: log.value,
                    timestamp: log.timestamp.toISOString()
                }
            }))
        };

        try {
            await Promise.all([
                updateDeviceActiveGroup(device_id, group_id),
                updateDeviceLastValueAt(device_id),
                createMultipleSensorValues(logs),
                trackMetricInDB('SENSOR_VALUES_PER_MINUTE', cache.userId, logs.length),
                publishDeviceStatus(deviceStatus)
            ]);

            return "Success";
        } catch (processingError: any) {
            console.error(`[${device_id}] Failed to process logs: ${processingError.message}`, { error: processingError, body: { body } });
            return "Error: processing failed";
        }
    } catch (error: any) {
        // Catch all uncaught errors
        const deviceId = body?.device_id || 'unknown';
        console.error(`[${deviceId}] Unexpected error in processLog: ${error.message}`, { error: error, body: { body } });
        return "Error: unexpected exception";
    }
}

// Improve the publishDeviceStatus function with more detailed logging
export async function publishDeviceStatus(deviceStatus: DeviceSSEMessage) {
    const deviceId = deviceStatus.id;
    try {
        const payload = JSON.stringify(deviceStatus);
        const channel = getDeviceChannel(deviceId);

        // Check if Redis is available
        if (!redisPub || typeof redisPub.publish !== 'function') {
            throw new Error('Redis publisher is not available');
        }

        const publishResult = await redisPub.publish(channel, payload);

        if (publishResult === 0) {
            console.warn(`[${deviceId}] Message published but no subscribers were listening`);
        }

        return publishResult;
    } catch (error: any) {
        console.error(`[${deviceId}] Failed to publish device status: ${error.message}`, { error: error, body: { deviceStatus } });
        throw error; // Rethrow for the caller to handle
    }
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

logWorker.on('error', err => {
    console.error('Worker error (likely Redis connection issue):', err);
});
function getCacheKey(token: string, device_id: string) {
    return `${token}:${device_id}`;
}