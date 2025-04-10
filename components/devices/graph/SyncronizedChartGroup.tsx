"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { SensorChart } from "./SensorChart";

type SyncedChartGroupProps = {
    sensorData: Record<string, {
        name: string;
        unit: string;
        values: { timestamp: Date; value: number }[];
    }>;
    isLoading: boolean;
};

export function SyncedChartGroup({ sensorData, isLoading }: SyncedChartGroupProps) {
    // For chart synchronization
    const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);
    const chartRefs = useRef<Record<string, any>>({});

    // Handler for tooltip sync
    const handleTooltipMove = (sensorId: string, index: number) => {
        if (activeTooltipIndex !== index) {
            setActiveTooltipIndex(index);

            // Synchronize all other charts
            Object.entries(chartRefs.current).forEach(([id, chart]) => {
                if (id !== sensorId && chart) {
                    const meta = chart.getDatasetMeta(0);
                    if (meta.data[index]) {
                        chart.tooltip.setActiveElements(
                            [{ datasetIndex: 0, index }],
                            { x: meta.data[index].x, y: meta.data[index].y }
                        );
                        chart.update();
                    }
                }
            });
        }
    };

    // Reset tooltip across all charts
    const handleTooltipLeave = () => {
        setActiveTooltipIndex(null);
        Object.values(chartRefs.current).forEach(chart => {
            if (chart) {
                chart.tooltip.setActiveElements([], {});
                chart.update();
            }
        });
    };

    // Get sensor IDs with data
    const sensorIds = Object.keys(sensorData);

    if (sensorIds.length === 0 && !isLoading) {
        return (
            <Alert>
                <AlertDescription>
                    Select a device, group, and at least one sensor to see charts.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <Skeleton className="h-[300px] w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sensorIds.map((sensorId) => (
                        <SensorChart
                            key={sensorId}
                            sensorId={sensorId}
                            sensorName={sensorData[sensorId].name}
                            unit={sensorData[sensorId].unit}
                            data={sensorData[sensorId].values}
                            onChartRef={(chart) => chartRefs.current[sensorId] = chart}
                            onTooltipMove={(index) => handleTooltipMove(sensorId, index)}
                            onTooltipLeave={handleTooltipLeave}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}