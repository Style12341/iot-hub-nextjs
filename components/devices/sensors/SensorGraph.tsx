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
import {
    ChartColorSet,
    chartColors,
    generateColorSetFromBase,
    getLineDatasetStyle,
    getStandardChartOptions,
    getTimeScaleOptions,
    formatTimeSeriesDataWithGaps
} from "@/lib/configs/chartConfig";
import { Tooltip as TooltipUI, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { set } from "date-fns";

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
    const [minimum, setMinimum] = useState(0);
    const [maximum, setMaximum] = useState(0);
    const [average, setAverage] = useState(0);
    const [dataPoints, setDataPoints] = useState(0);
    const [debounceRef, setDebounceRef] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!values || values.length === 0) {
            return;
        }
        if (debounceRef) {
            clearTimeout(debounceRef);
        }
        const ref = setTimeout(() => {
            const filteredValues = values.filter(v => v.value !== null && v.value !== undefined).map(v => v.value);
            if (filteredValues.length === 0) {
                setMinimum(0);
                setMaximum(0);
                setAverage(0);
                return;
            }
            let min = Number.MAX_VALUE;
            let max = Number.MIN_VALUE;
            let sum = 0;
            for (const v of filteredValues) {
                if (v < min) {
                    min = v;
                }
                if (v > max) {
                    max = v;
                }
                sum += v;
            }
            const avg = sum / filteredValues.length;
            setMinimum(min);
            setMaximum(max);
            setAverage(avg);
            setDataPoints(filteredValues.length);
        }, 100);
        setDebounceRef(ref);
    }, [values]);

    // Determine color set to use
    const colorSet: ChartColorSet = color
        ? generateColorSetFromBase(color)
        : chartColors.primary;

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
                data: formatTimeSeriesDataWithGaps(values),
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
            duration: 200,
            easing: 'easeInQuad' as const
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
                        <>
                            <div className="flex justify-between">
                                <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                                    <span>Min: {minimum} {sensor.unit}</span>
                                    <span>Max: {maximum} {sensor.unit}</span>
                                    <span>Avg: {average.toFixed(2)} {sensor.unit}</span>
                                    <span>Latest: {values[0]?.value} {sensor.unit}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                                    <span>DataPoints: {dataPoints}</span>
                                    <span>{formatDate(values[0]?.timestamp || "")}</span>
                                </div>
                            </div>
                            <div className="flex justify-between">

                            </div>
                        </>
                    ) : null}

                </div>
            </CardContent>
        </Card >
    );
}