"use client";

import { SensorQueryResult, SensorValueQueryResult } from "@/lib/contexts/deviceContext";
import { getSensorChannel } from "@/lib/sseUtils";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SensorListItemProps {
    sensor: SensorQueryResult;
}

export default function SensorListItem({ sensor }: SensorListItemProps) {
    // Create local state to track the sensor data
    const [sensorData, setSensorData] = useState<SensorQueryResult>(sensor);
    // State to track if value was just updated
    const [isValueUpdated, setIsValueUpdated] = useState(false);
    // Key for triggering AnimatePresence
    const [valueKey, setValueKey] = useState(0);
    // Update local state when prop changes
    useEffect(() => {
        if (!sensor.values) sensor.values = [];
        const newValue = sensor.values[0]?.value?.toString();
        if (!newValue) return;

        setSensorData(sensor);
        // Trigger the animation
        setIsValueUpdated(true);
        // Increment key to trigger animation
        setValueKey(prev => prev + 1);

        // Reset the animation flag after animation completes
        setTimeout(() => {
            setIsValueUpdated(false);
        }, 600);

    }, [sensor]);

    return (
        <li className="py-2 first:pt-0 last:pb-0">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm font-medium">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="cursor-help">{sensorData.name}</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p className="text-xs font-mono">ID: {sensorData.id}</p>
                            </TooltipContent>
                        </Tooltip>
                    </p>
                    <p className="text-xs text-muted-foreground">{sensorData.category ?? "No Category"}</p>
                </div>
                {sensorData.values && sensorData.values.length > 0 && (
                    <p className="text-sm font-medium">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={valueKey}
                                initial={{
                                    scale: 1,
                                }}
                                animate={{
                                    scale: isValueUpdated ? [1, 1.15, 1] : 1,
                                }}
                                transition={{
                                    duration: 0.6,
                                    ease: "easeInOut",
                                    times: isValueUpdated ? [0, 0.3, 1] : [0, 1]
                                }}
                                className="inline-block px-1 rounded"
                            >
                                {sensorData.values[0].value}
                            </motion.span>
                        </AnimatePresence>
                        {" "}
                        {sensorData.unit}
                    </p>
                )}
            </div>
        </li>
    );
}