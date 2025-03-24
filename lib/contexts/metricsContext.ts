"use server"
import db from '@/lib/prisma';
import { Metrics } from '@prisma/client';

// Add this function to track metrics in the database
export async function trackMetricInDB(metricName: Metrics, user_id: string, value: number = 1) {
    try {
        const ts = getMetricTimestamp(metricName);

        // Upsert pattern - create or increment the metric for this minute
        await db.metric.upsert({
            where: {
                name_userId_timestamp: {
                    name: metricName,
                    userId: user_id,
                    timestamp: ts
                }
            },
            update: {
                value: {
                    increment: value
                }
            },
            create: {
                name: metricName,
                userId: user_id,
                timestamp: ts,
                value: value
            }
        });

        console.log(`Tracked metric in DB: ${metricName} = ${value} at ${ts.toISOString()}`);
    } catch (error) {
        console.warn(`Failed to track metric ${metricName} in DB:`, error);
    }
}
export async function getMetricValueBetween(metricName: Metrics, user_id: string, start: Date, end: Date) {
    const metric = await db.metric.findMany({
        where: {
            name: metricName,
            userId: user_id,
            timestamp: {
                gte: start,
                lte: end
            }
        },
        select: {
            value: true,
            timestamp: true
        }
    });
    //Fill in missing timestamps with 0 values
    const timestamps = getTimestampsBetween(start, end, metricName);
    console.log("timestamps", timestamps);
    const metricMap = new Map(metric.map(m => [m.timestamp.toISOString(), m.value]));
    console.log("metricMap", metricMap);
    timestamps.forEach(ts => {
        if (!metricMap.has(ts.toISOString())) {
            metricMap.set(ts.toISOString(), 0);
        }
    }
    );
    console.log("metricMap", metricMap);
    // Return in object format
    return Array.from(metricMap).map(([timestamp, value]) => {
        const newts = new Date(timestamp);
        return { timestamp: newts, value };
    });
}
function getTimestampsBetween(start: Date, end: Date, metric: Metrics) {
    let ts = new Date(start);
    let timestamps = [];
    let interval = 1;
    while (ts < end) {
        if (metric.endsWith("PER_MINUTE")) {
            ts.setMinutes(ts.getMinutes() + interval, 0, 0);
        } else if (metric.endsWith("PER_HOUR")) {
            ts.setHours(ts.getHours() + interval, 0, 0, 0);
        } else if (metric.endsWith("PER_DAY")) {
            ts.setDate(ts.getDate() + interval);
        }
        const newTs = new Date(ts);
        if (newTs <= end)
            timestamps.push(newTs);

    }
    return timestamps;
}

function getMetricTimestamp(metric: Metrics) {
    let ts = new Date();
    if (metric.endsWith("PER_MINUTE")) {
        ts.setSeconds(0, 0);
    } else if (metric.endsWith("PER_HOUR")) {
        ts.setMinutes(0, 0, 0);
    } else if (metric.endsWith("PER_DAY")) {
        ts.setHours(0, 0, 0, 0);
    }
    return ts;
}