import { LogEntry } from "@/app/api/v1/devices/log/route";
import db from "../prisma";




export async function createMultipleSensorValues(data: LogEntry[]) {
    return await db.sensorValue.createMany({
        data: data.map(entry => ({
            value: entry.value,
            groupSensorId: entry.groupSensorId,
            timestamp: entry.timestamp
        }))
    }
    )
}