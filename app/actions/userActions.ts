"use server"

import { getMetricValueBetween } from "@/lib/contexts/metricsContext"
import { auth } from "@clerk/nextjs/server";


export async function getSensorValuesMetricBetween(passedUser: string, start: Date, end: Date) {
    const { userId } = await auth();
    if (userId !== passedUser) {
        return null
    }
    return await getMetricValueBetween("SENSOR_VALUES_PER_MINUTE", userId, start, end);
}
