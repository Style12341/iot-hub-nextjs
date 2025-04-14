"use client";

import { useRef, useState, createContext, useContext } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { SensorChart } from "./SensorChart";

// Create a context for shared hover state
type HoverState = {
    activeTimestamp: Date | null;
    setActiveTimestamp: (timestamp: Date | null) => void;
};

const HoverContext = createContext<HoverState>({
    activeTimestamp: null,
    setActiveTimestamp: () => { }
});

type SyncedChartGroupProps = {
    sensorData: Record<string, {
        color: string;
        name: string;
        unit: string;
        values: { timestamp: Date; value: number }[];
    }>;
    isLoading: boolean;
};

export function SyncedChartGroup({ sensorData, isLoading }: SyncedChartGroupProps) {
    const [activeTimestamp, setActiveTimestamp] = useState<Date | null>(null);

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
        <HoverContext.Provider value={{ activeTimestamp, setActiveTimestamp }}>
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
                    <div className="grid grid-cols-1 gap-6">
                        {sensorIds.map((sensorId) => (
                            <SensorChart
                                key={sensorId}
                                color={sensorData[sensorId].color}
                                sensorId={sensorId}
                                sensorName={sensorData[sensorId].name}
                                unit={sensorData[sensorId].unit}
                                data={sensorData[sensorId].values}
                            />
                        ))}
                    </div>
                )}
            </div>
        </HoverContext.Provider>
    );
}

// Export the context for use in SensorChart
export const useHoverContext = () => useContext(HoverContext);