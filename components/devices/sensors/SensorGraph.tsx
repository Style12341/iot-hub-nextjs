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
import { formatDate } from "@/lib/utils";
import { ChartColorSet, chartColors, generateColorSetFromBase, getLineDatasetStyle, getStandardChartOptions, getTimeScaleOptions } from "@/lib/configs/chartConfig";
import { Tooltip as TooltipUI, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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



interface SensorGraphProps {
    sensor: SensorQueryResult;
    className?: string;
    color: string; // Optional color override
}

export default function SensorGraph({ sensor, className = "", color }: SensorGraphProps) {
    const [values, setValues] = useState(sensor.values || []);
    // Determine color set to use
    const colorSet: ChartColorSet = color
        ? generateColorSetFromBase(color)
        : chartColors.primary;

    // Format the data for Chart.js - ensures consistent Date objects
    const formatChartData = (dataPoints: any[]) => {
        return dataPoints.map(item => ({
            x: new Date(item.timestamp),
            y: parseFloat(item.value.toString())
        }));
    };

    useEffect(() => {
        if (!sensor.values || sensor.values.length === 0) {
            setValues([]);
            return;
        }
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
        })

        setValues(filtered);
    }, [sensor.values]);

    const chartData = {
        datasets: [
            {
                label: sensor.name,
                data: formatChartData(values),
                ...getLineDatasetStyle(colorSet, false)
            },
        ],
    };

    // Create custom options with proper time unit and better animations
    const options = {
        ...getStandardChartOptions(
            sensor.unit || 'Value',
            true,
            (context) => `${context.dataset.label}: ${context.parsed.y} ${sensor.unit || ''}`
        ),
        scales: {
            x: getTimeScaleOptions(),
            y: {
                title: {
                    display: true,
                    text: sensor.unit || 'Value',
                },
                beginAtZero: false,
            }
        },
        animation: {
            duration: 0
        }
    };

    return (
        <Card className={`${className} h-full`}>
            <CardHeader className="pb-2 flex flex-row justify-between items-center">
                <CardTitle className="text-sm font-medium">
                    <TooltipUI>
                        <TooltipTrigger asChild>
                            <span className="cursor-help">{sensor.name}</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p className="text-xs font-mono">ID: {sensor.id}</p>
                        </TooltipContent>
                    </TooltipUI>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px]">
                    {values.length > 0 ? (
                        <Line
                            data={chartData}
                            options={options}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No data available for the selected time range
                        </div>
                    )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                    {values.length > 0 ? (
                        <div className="flex justify-between">
                            <span>Latest: {values[0]?.value} {sensor.unit}</span>
                            <span>{formatDate(values[0]?.timestamp || "")}</span>
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card >
    );
}