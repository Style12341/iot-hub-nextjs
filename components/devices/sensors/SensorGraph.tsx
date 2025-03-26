"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler
} from "chart.js";
import 'chartjs-adapter-date-fns';
import { SensorQueryResult } from "@/lib/contexts/deviceContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { ChartColorSet, chartColors, generateColorSetFromBase, getLineDatasetStyle, getStandardChartOptions, getTimeScaleOptions } from "@/lib/chartConfig";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Filler,
    Tooltip,
    Legend,
    TimeScale
);

const timeRanges = [
    { label: "Last 10 minutes", value: 10 },
    { label: "Last 30 minutes", value: 30 },
    { label: "Last hour", value: 60 },
    { label: "Last 3 hours", value: 180 },
    { label: "Last 6 hours", value: 360 },
    { label: "Last 12 hours", value: 720 },
    { label: "Last 24 hours", value: 1440 },
];

interface SensorGraphProps {
    sensor: SensorQueryResult;
    className?: string;
    color?: string; // Optional color override
}

export default function SensorGraph({ sensor, className = "", color }: SensorGraphProps) {
    const [timeRange, setTimeRange] = useState<number>(10); // Default 10 minutes
    const [filteredValues, setFilteredValues] = useState(sensor.values || []);

    // Determine color set to use
    const colorSet: ChartColorSet = color
        ? generateColorSetFromBase(color)
        : chartColors.primary;

    useEffect(() => {
        if (!sensor.values || sensor.values.length === 0) {
            setFilteredValues([]);
            return;
        }

        const now = new Date();
        const cutoffTime = new Date(now.getTime() - timeRange * 60 * 1000);

        // Filter values within the selected time range
        const filtered = sensor.values.map(v => {
            // Ensure we get a proper date object from the timestamp
            let timestamp;
            if (v.timestamp instanceof Date) {
                timestamp = v.timestamp;
            } else if (typeof v.timestamp === 'string') {
                // Ensure proper ISO format with Z suffix for UTC
                timestamp = new Date(v.timestamp.toString().endsWith("Z") ? v.timestamp : v.timestamp + "Z");
            } else {
                // Fallback
                timestamp = new Date(v.timestamp);
            }

            return {
                timestamp,
                value: v.value
            };
        }).filter(value => {
            return value.timestamp.getTime() > cutoffTime.getTime();
        });

        setFilteredValues(filtered);
    }, [sensor.values, timeRange]);

    // Determine appropriate time unit based on range
    const getTimeUnit = (): 'minute' | 'hour' | 'day' => {
        if (timeRange <= 60) return 'minute';
        if (timeRange <= 1440) return 'hour';
        return 'day';
    };

    const chartData = {
        datasets: [
            {
                label: sensor.name,
                data: filteredValues.map(v => ({
                    x: v.timestamp,
                    y: parseFloat(v.value.toString())
                })),
                ...getLineDatasetStyle(colorSet, true) // Using custom color set with no fill
            },
        ],
    };

    // Create custom options with proper time unit
    const options = {
        ...getStandardChartOptions(
            sensor.unit || 'Value',
            true,
            (context) => `${context.dataset.label}: ${context.parsed.y} ${sensor.unit || ''}`
        ),
        scales: {
            x: getTimeScaleOptions(getTimeUnit()),
            y: {
                title: {
                    display: true,
                    text: sensor.unit || 'Value',
                },
                beginAtZero: false,
            }
        }
    };

    return (
        <Card className={`${className} h-full`}>
            <CardHeader className="pb-2 flex flex-row justify-between items-center">
                <CardTitle className="text-sm font-medium">{sensor.name}</CardTitle>
                <Select
                    defaultValue={timeRange.toString()}
                    onValueChange={(value) => setTimeRange(parseInt(value))}
                >
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                        {timeRanges.map((range) => (
                            <SelectItem key={range.value} value={range.value.toString()}>
                                {range.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="h-[200px]">
                    {filteredValues.length > 0 ? (
                        <Line data={chartData} options={options} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No data available for the selected time range
                        </div>
                    )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                    {filteredValues.length > 0 ? (
                        <div className="flex justify-between">
                            <span>Latest: {filteredValues[0]?.value} {sensor.unit}</span>
                            <span>{formatDate(filteredValues[0]?.timestamp || "")}</span>
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}