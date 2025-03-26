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
    TimeScale
} from "chart.js";
import 'chartjs-adapter-date-fns';
import { SensorQueryResult } from "@/lib/contexts/deviceContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
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
}

export default function SensorGraph({ sensor, className = "" }: SensorGraphProps) {
    const [timeRange, setTimeRange] = useState<number>(10); // Default 10 minutes
    const [filteredValues, setFilteredValues] = useState(sensor.values || []);

    useEffect(() => {
        if (!sensor.values || sensor.values.length === 0) {
            setFilteredValues([]);
            return;
        }
        console.log(`SensorGraph: ${sensor.name} values:`, sensor.values);

        const now = new Date();
        const cutoffTime = new Date(now.getTime() - timeRange * 60 * 1000);

        // Filter values within the selected time range
        const filtered = sensor.values.map(v => { return { timestamp: new Date(v.timestamp.toString().endsWith("Z") ? v.timestamp : v.timestamp + "Z"), value: v.value } })
            .filter(value => {
                console.debug(value.timestamp, cutoffTime, new Date(value.timestamp).getTime(), cutoffTime.getTime())
                return new Date(value.timestamp).getTime() > cutoffTime.getTime()
            }
            );
        filtered
        setFilteredValues(filtered);
    }, [sensor.values, timeRange]);

    const chartData = {
        datasets: [
            {
                label: sensor.name,
                data: filteredValues.map(v => ({
                    x: v.timestamp,
                    y: parseFloat(v.value.toString())
                })),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.3,
                fill: true,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'time' as const,
                time: {
                    unit: 'minute' as const,
                    displayFormats: {
                        minute: 'HH:mm',
                    },
                },
                title: {
                    display: true,
                    text: 'Time',
                },
            },
            y: {
                title: {
                    display: true,
                    text: sensor.unit || 'Value',
                },
            },
        },
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        return `${context.dataset.label}: ${context.parsed.y} ${sensor.unit || ''}`;
                    }
                }
            }
        },
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