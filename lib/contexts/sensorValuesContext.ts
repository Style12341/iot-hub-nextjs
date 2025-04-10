import { SensorValueEntry } from "@/types/types"
import db from "../prisma";
import { Prisma } from "@prisma/client";

export async function createMultipleSensorValues(data: SensorValueEntry[]) {
    return await db.sensorValue.createMany({
        data: data.map(entry => ({
            value: entry.value,
            groupSensorId: entry.groupSensorId,
            timestamp: entry.timestamp
        }))
    })
}

/**
 * Verifies a user has access to the specified group sensors and returns sensor metadata
 * @param userId User ID to check access for
 * @param groupSensorIds Array of group sensor IDs to verify
 * @returns Sensor information if access is granted, empty array if not
 */
export async function validateSensorAccess(userId: string, groupSensorIds: string[]) {
    return await db.groupSensor.findMany({
        where: {
            id: { in: groupSensorIds },
            Group: {
                Device: {
                    userId
                }
            }
        },
        select: {
            id: true,
            Sensor: {
                select: {
                    name: true,
                    unit: true,
                    Category: {
                        select: {
                            name: true,
                            color: true
                        }
                    }
                }
            }
        }
    });
}

/**
 * Gets raw sensor values for multiple sensors grouped by sensor ID
 * Uses a raw query for optimal performance with large datasets, focusing ONLY on the SensorValue table
 * 
 * @param groupSensorIds Array of group sensor IDs to fetch data for
 * @param startDate Start of date range
 * @param endDate End of date range
 * @returns Object containing raw sensor values grouped by sensor ID
 */
export async function getSensorValuesGrouped(
    groupSensorIds: string[],
    startDate: Date,
    endDate: Date
): Promise<Record<string, { timestamp: Date; value: number }[]>> {
    // Build the SQL query - focused ONLY on SensorValue table
    type Result = {
        groupsensorid: string;
        values: { timestamp: Date; value: number }[];
    }
    const result: Result = await db.$queryRaw`
        SELECT 
            sv."groupSensorId",
            jsonb_agg(
                jsonb_build_object(
                    'timestamp', sv."timestamp",
                    'value', sv."value"
                ) ORDER BY sv."timestamp" ASC
            ) as values
        FROM "SensorValue" sv
        WHERE sv."groupSensorId" IN (${Prisma.join(groupSensorIds)})
        AND sv."timestamp" >= ${startDate}
        AND sv."timestamp" <= ${endDate}
        GROUP BY sv."groupSensorId"
    `;
    // Transform the raw query result to the expected format
    const rawValues: Record<string, { timestamp: Date; value: number }[]> = {};
    // Process returned data
    if (result && Array.isArray(result)) {
        for (const row of result) {
            rawValues[row.groupSensorId] = row.values || [];
        }
    }
    // Add empty arrays for any sensors that didn't return data
    groupSensorIds.forEach(sensorId => {
        if (!rawValues[sensorId]) {
            rawValues[sensorId] = [];
        }
    });

    return rawValues;
}