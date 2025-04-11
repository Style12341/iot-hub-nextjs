"use client";

import { useEffect, useRef, memo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    TimeScale
} from "chart.js";
import 'chartjs-adapter-date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
    getLineDatasetStyle,
    getStandardChartOptions,
    formatTimeSeriesDataWithGaps,
    generateColorSetFromBase,
    chartColors
} from "@/lib/configs/chartConfig";
import { useHoverContext } from "./SyncronizedChartGroup";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    ChartTooltip,
    Legend,
    TimeScale
);

type SensorChartProps = {
    sensorId: string;
    color?: string;
    sensorName: string;
    unit: string;
    data: { timestamp: Date; value: number }[];
};

export const SensorChart = memo(function SensorChart({
    sensorId,
    color,
    sensorName,
    unit,
    data
}: SensorChartProps) {
    const [minimum, setMinimum] = useState(0);
    const [maximum, setMaximum] = useState(0);
    const [average, setAverage] = useState(0);
    const [debounceRef, setDebounceRef] = useState<NodeJS.Timeout | null>(null);
    const chartRef = useRef<any>(null);
    const hoverIndexRef = useRef<number | null>(null);
    const processedData = useRef(formatTimeSeriesDataWithGaps(data));
    const { activeTimestamp, setActiveTimestamp } = useHoverContext();
    const activeTimestampRef = useRef<Date | null>(null);
    // Track if this chart initiated the hover
    const isInitiatorRef = useRef(false);
    const colorSet = color ? generateColorSetFromBase(color) : chartColors.primary;

    // Update processed data when raw data changes
    useEffect(() => {
        processedData.current = formatTimeSeriesDataWithGaps(data);
    }, [data]);

    // Handle external hover updates
    useEffect(() => {
        // Store latest timestamp in ref to avoid infinite loops
        if (activeTimestamp !== activeTimestampRef.current) {
            activeTimestampRef.current = activeTimestamp;

            // Don't react to our own updates
            if (isInitiatorRef.current) {
                isInitiatorRef.current = false;
                return;
            }

            // Only proceed if we have a chart and timestamp
            if (!chartRef.current || !activeTimestamp) {
                // If timestamp is null, clear tooltips
                if (!activeTimestamp && chartRef.current) {
                    chartRef.current.setActiveElements([]);
                    chartRef.current.update('none');
                }
                return;
            }

            try {
                // Find the closest point to the active timestamp
                let closestIndex = -1;
                let minDistance = Infinity;

                processedData.current.forEach((point, index) => {
                    if (point.y === null) return; // Skip gap points

                    const pointTime = new Date(point.x).getTime();
                    const activeTime = new Date(activeTimestamp).getTime();
                    const distance = Math.abs(pointTime - activeTime);

                    if (distance < minDistance && distance < 30000) { // Within 30 seconds
                        minDistance = distance;
                        closestIndex = index;
                    }
                });

                // If we found a close point, highlight it
                if (closestIndex >= 0) {
                    // Store index in ref to avoid re-renders
                    hoverIndexRef.current = closestIndex;

                    // Just update the tooltip position
                    const chart = chartRef.current;
                    const meta = chart.getDatasetMeta(0);
                    if (meta?.data && closestIndex < meta.data.length) {
                        chart.setActiveElements([{
                            datasetIndex: 0,
                            index: closestIndex
                        }]);
                        chart.tooltip.setActiveElements([{
                            datasetIndex: 0,
                            index: closestIndex
                        }], {
                            x: meta.data[closestIndex].x,
                            y: meta.data[closestIndex].y
                        });
                        chart.update('none');
                    }
                } else if (chartRef.current) {
                    chartRef.current.setActiveElements([]);
                    chartRef.current.update('none');
                }
            } catch (error) {
                console.error("Error synchronizing tooltip:", error);
            }
        }
    }, [activeTimestamp]);
    useEffect(() => {
        const values = data;
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
        }, 100);
        setDebounceRef(ref);
    }, [data]);
    // Process data for Chart.js using shared utility
    const chartData = {
        datasets: [
            {
                label: sensorName,
                data: processedData.current,
                ...getLineDatasetStyle(colorSet),
                spanGaps: false, // Don't connect points across gaps
            },
        ],
    };

    // Configure chart options
    const options = {
        ...getStandardChartOptions(
            unit,
            false,
            (context: any) => `${context.parsed.y} ${unit}`
        ),
        responsive: true,
        maintainAspectRatio: false
        ,
        animation: {
            duration: 200,
            easing: 'easeInQuad' as const
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
            axis: 'x' as const,
        },
        onHover: (event: any, elements: any[]) => {
            if (!event || !elements) return;

            if (elements && elements.length > 0) {
                const index = elements[0].index;
                if (index >= 0 && index < processedData.current.length) {
                    const point = processedData.current[index];
                    if (point && point.x) {
                        // Only update shared state if the index changed
                        if (hoverIndexRef.current !== index) {
                            hoverIndexRef.current = index;
                            // Mark this chart as the initiator
                            isInitiatorRef.current = true;
                            // Update shared timestamp reference
                            setActiveTimestamp(new Date(point.x));
                        }
                    }
                }
            } else if (event.type === 'mouseleave') {
                // Reset state on mouse leave
                isInitiatorRef.current = true;
                hoverIndexRef.current = null;
                setActiveTimestamp(null);
            }
        },
        plugins: {
            tooltip: {
                enabled: true,
                callbacks: {
                    label: (context: any) => `${context.parsed.y} ${unit}`,
                    title: (contexts: any[]) => {
                        if (contexts.length > 0 && contexts[0].parsed.x) {
                            return formatDate(new Date(contexts[0].parsed.x));
                        }
                        return '';
                    }
                }
            },
            legend: { display: false }
        }
    };

    // Get latest value for display
    const latestValue = data.length > 0
        ? data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        : null;

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{sensorName}</CardTitle>
                    <Badge variant="outline">{unit}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    {data.length > 0 ? (
                        <Line ref={chartRef} data={chartData} options={options} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No data available for the selected time range
                        </div>
                    )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                    {latestValue && (
                        <>
                            <div className="flex justify-between gap-3">
                                <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                                    <span>Min: {minimum} {unit}</span>
                                    <span>Max: {maximum} {unit}</span>
                                    <span>Avg: {average.toFixed(2)} {unit}</span>
                                    <span>Latest: {latestValue.value} {unit}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                                    <span>DataPoints: {data.length}</span>
                                    <span>{formatDate(latestValue.timestamp || "")}</span>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </CardContent>
        </Card>
    );
});