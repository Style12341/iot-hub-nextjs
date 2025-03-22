"use client";

import { SensorQueryResult, SensorValueQueryResult } from "@/lib/contexts/deviceContext";
import { getSensorChannel } from "@/lib/sseUtils";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SensorListItemProps {
    sensor: SensorQueryResult;
}

export default function SensorListItem({ sensor }: SensorListItemProps) {
    // Create local state to track the sensor data
    const [sensorData, setSensorData] = useState<SensorQueryResult>(sensor);

    // Update local state when prop changes
    useEffect(() => {
        setSensorData(sensor);
    }, [sensor]);


    return (
        <li className="py-2 first:pt-0 last:pb-0">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm font-medium">{sensorData.name}</p>
                    <p className="text-xs text-muted-foreground">Category: {sensorData.category}</p>
                </div>
                {sensorData.values && sensorData.values.length > 0 && (
                    <p className="text-sm font-medium">
                        {sensorData.values[0].value} {sensorData.unit}
                    </p>
                )}
            </div>
        </li>
    );
}