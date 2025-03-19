// /api/v1/devices/log
// Could have device id as a query parameter but for compatibility it will stay in the request body

import { getDevice } from "@/lib/contexts/deviceContext"
import { getGroupSensors } from "@/lib/contexts/groupSensorsContext"
import { createMultipleSensorValues } from "@/lib/contexts/sensorValuesContext"
import { getUserFromToken } from "@/lib/contexts/userTokensContext"
import redis from "@/lib/redis"
import { SensorValueEntry } from "@/types/types"

type SensorsLogBody = {
    sensor_id: string
    timestamp?: number
    value: number
}
type DeviceLogBody = {
    device_id: string
    group_id: string
    sensors: SensorsLogBody[]
}
type RedisRequestCache<T = Object> = {
    device_id: string
    group_id: string
    sensors_ids: string[]
    groupSensorIdMap: T
}
const CACHE_EXPIRATION = 90 // 90 seconds

type GetFromDBResponse = RedisRequestCache<Map<string, string>> | "Error: bad token" | "Error: device not found" | "Error: user does not own device, group or sensors"


export async function POST(req: Request) {
    const token = req.headers.get('Authorization')
    if (!token) {
        return new Response('Error: bad token', {
            status: 403,
        })
    }
    const body = await req.json()
    const { device_id, group_id, sensors } = body as DeviceLogBody
    const sensor_ids = sensors.map(sensor => sensor.sensor_id)
    let cache = await tryGetCache(token, device_id)
    if (!isCacheValid(cache, device_id, group_id, sensor_ids)) {
        console.log('Cache miss')
        const dbResponse = await validateRequestFromDB(token, device_id, group_id, sensor_ids)
        switch (dbResponse) {
            case "Error: bad token":
                return new Response(dbResponse, {
                    status: 403,
                })
            case "Error: device not found":
                return new Response(dbResponse, {
                    status: 404,
                })
            case "Error: user does not own device, group or sensors":
                return new Response(dbResponse, {
                    status: 403,
                })
        }
        await forceCache(token, dbResponse)
        cache = dbResponse;
    } else {
        console.log('Cache hit')
        await redis.expire(token + device_id, CACHE_EXPIRATION)
    }
    const { groupSensorIdMap } = cache as RedisRequestCache<Map<string, string>>
    const logs: SensorValueEntry[] = sensors.map(sensor => (
        {
            groupSensorId: groupSensorIdMap.get(sensor.sensor_id),
            timestamp: sensor.timestamp ? new Date(sensor.timestamp * 1000) : new Date(),
            value: sensor.value
        })).filter((log): log is SensorValueEntry => log !== null);
    //Store logs in the database
    await createMultipleSensorValues(logs)
    return new Response('Success', {
        status: 201,
    })

}
// Will try to check if the token is cached with the information needed to validate ownership
// If not, will return null
async function tryGetCache(token: string, device_id: string) {
    const cache_key = `${token}:${device_id}`;
    const data = await redis.get(cache_key);
    if (!data) return null;
    const parsed = JSON.parse(data);
    parsed.groupSensorIdMap = new Map(Object.entries(parsed.groupSensorIdMap));
    return parsed as RedisRequestCache<Map<string, string>>;
}
function getCacheKey(token: string, device_id: string) {
    return token + ":" + device_id
}
async function validateRequestFromDB(token: string, device_id: string, group_id: string, sensor_ids: string[]): Promise<GetFromDBResponse> {
    const [user, device] = await Promise.all([
        getUserFromToken(token, 'log'),
        getDevice(device_id)
    ]);

    if (!user) {
        return "Error: bad token"
    }
    if (!device) {
        return "Error: device not found"
    }
    const userOwnsDevice = device.userId === user.id
    const userOwnsGroup = device.Groups.find(group => group.id === group_id) !== undefined
    const userOwnsSensors = device.Sensors.filter(sensor => sensor_ids.includes(sensor.id)).length === sensor_ids.length
    if (!userOwnsDevice || !userOwnsGroup || !userOwnsSensors) {
        return "Error: user does not own device, group or sensors"
    }
    const groupSensors = await getGroupSensors(group_id, sensor_ids)
    // Make a map of sensor_id to groupSensorId
    const groupSensorIdMap = new Map<string, string>()
    groupSensors.forEach(groupSensor => {
        groupSensorIdMap.set(groupSensor.sensorId, groupSensor.id)
    })
    const ans: RedisRequestCache<Map<string, string>> = {
        device_id,
        group_id,
        sensors_ids: sensor_ids,
        groupSensorIdMap
    }
    return ans
}
async function forceCache(token: string, data: RedisRequestCache<Map<string, string>>) {
    const cache_key = getCacheKey(token, data.device_id)
    const dataCopy: RedisRequestCache = { ...data }
    dataCopy.groupSensorIdMap = Object.fromEntries(data.groupSensorIdMap)
    await redis.pipeline()
        .set(cache_key, JSON.stringify(dataCopy))
        .expire(cache_key, CACHE_EXPIRATION)
        .exec();
}
function isCacheValid(cache: RedisRequestCache<Map<string, string>> | null, device_id: string, group_id: string, sensor_ids: string[]) {
    if (cache === null || cache.device_id !== device_id || cache.group_id !== group_id) {
        return false
    }
    const cacheSet = new Set(cache.sensors_ids);
    const sensorSet = new Set(sensor_ids);
    if (cacheSet.size !== sensorSet.size) return false;
    for (let sensor of sensorSet) {
        if (!cacheSet.has(sensor)) return false;
    }
    return true;
}