import { SensorValueEntry } from "@/types/types"
import db from "../prisma";




export async function createMultipleSensorValues(data: SensorValueEntry[]) {
    return await db.sensorValue.createMany({
        data: data.map(entry => ({
            value: entry.value,
            groupSensorId: entry.groupSensorId,
            timestamp: entry.timestamp
        }))
    }
    )
}