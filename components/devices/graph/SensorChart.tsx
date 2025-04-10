"use client";

import { useEffect, useRef } from "react";
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
    formatTimeSeriesDataWithGaps
} from "@/lib/configs/chartConfig";

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
    sensorName: string;
    unit: string;
    data: { timestamp: Date; value: number }[];
    onChartRef: (chart: any) => void;
    onTooltipMove: (index: number) => void;
    onTooltipLeave: () => void;
};

export function SensorChart({
    sensorId,
    sensorName,
    unit,
    data,
    onChartRef,
    onTooltipMove,
    onTooltipLeave
}: SensorChartProps) {
    const chartRef = useRef<any>(null);

    // Register chart instance for synchronization
    useEffect(() => {
        if (chartRef.current) {
            onChartRef(chartRef.current);
        }
    }, [chartRef.current, onChartRef]);

    // Process data for Chart.js using shared utility
    const chartData = {
        datasets: [
            {
                label: sensorName,
                data: formatTimeSeriesDataWithGaps(data),
                ...getLineDatasetStyle(),
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
        maintainAspectRatio: false,
        animation: { duration: 0 }, // Disable animations for better performance
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        onHover: (_: any, elements: any[]) => {
            if (elements && elements.length > 0) {
                onTooltipMove(elements[0].index);
            } else {
                onTooltipLeave();
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: any) => `${context.parsed.y} ${unit}`,
                    title: (contexts: any[]) => {
                        if (contexts.length > 0) {
                            const date = new Date(contexts[0].parsed.x);
                            return formatDate(date);
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
                {latestValue && (
                    <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                        <span>Latest: {latestValue.value} {unit}</span>
                        <span>{formatDate(latestValue.timestamp)}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}