"use client";

import { SensorQueryResult } from "@/lib/contexts/deviceContext";

interface SensorListItemProps {
    sensor: SensorQueryResult;
}

export default function SensorListItem({ sensor }: SensorListItemProps) {
    return (
        <li className="py-2 first:pt-0 last:pb-0">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm font-medium">{sensor.name}</p>
                    <p className="text-xs text-muted-foreground">Category: {sensor.category}</p>
                </div>
                {sensor.values && sensor.values.length > 0 && (
                    <p className="text-sm font-medium">
                        {sensor.values[0].value} {sensor.unit}
                    </p>
                )}
            </div>
        </li>
    );
}