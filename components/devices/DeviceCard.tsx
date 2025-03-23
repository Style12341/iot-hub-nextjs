"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import SensorListItem from "./sensors/SensorListItem";
import { DeviceQueryResult, getDeviceStatusFromLastValueAt, SensorQueryResult } from "@/lib/contexts/deviceContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { getDeviceEventSource } from "@/lib/sseUtils";
import { DeviceSSEMessage } from "@/types/types";

interface DeviceCardProps {
    device: DeviceQueryResult
}


export default function DeviceCard({ device }: DeviceCardProps) {
    const [deviceData, setDeviceData] = useState(device);
    const [isExpanded, setIsExpanded] = useState(false);

    // Default number of sensors to show
    const initialSensorsCount = 3;
    const hasMoreSensors = deviceData.sensors.length > initialSensorsCount;
    const [refreshKey, setRefreshKey] = useState(false);
    const updateDeviceStatus = () => {
        const newStatus = getDeviceStatusFromLastValueAt(deviceData.lastValueAt);

        if (newStatus !== deviceData.status) {
            if (newStatus === "OFFLINE" && deviceData.status === "ONLINE") {
                toast.warning(`Device ${deviceData.name} has gone offline`);
            } else if (newStatus === "ONLINE" && deviceData.status === "OFFLINE") {
                toast.info(`Device ${deviceData.name} is back online`);
            }

            setDeviceData(prev => ({
                ...prev,
                status: newStatus
            }));
        }
    };

    // Effect to handle status updates based on lastValueAt changes
    useEffect(() => {
        updateDeviceStatus();
    }, [deviceData.lastValueAt, refreshKey]);

    // Effect for interval status check and SSE connection
    useEffect(() => {
        // Set up interval to check status every 10 seconds
        const intervalId = setInterval(() => { setRefreshKey((prev) => !prev) }, 10000);

        // Set up SSE connection for real-time data
        const eventSource = getDeviceEventSource(deviceData.id);

        eventSource.onmessage = (event) => {
            const data: DeviceSSEMessage = JSON.parse(event.data);

            // Skip connection messages
            if (data.type === "connected") {
                return;
            }

            // Update device data with new values
            setDeviceData(prev => {
                // Create a new sensors array with updated values
                const updatedSensors = prev.sensors.map((sensor) => {
                    // Check if this sensor has updated data in the message
                    const newSensor = data.sensors.find(
                        (s) => s.groupSensorId === sensor.groupSensorId
                    );

                    if (data.sensors && newSensor) {
                        return {
                            ...sensor,
                            values: [
                                {
                                    value: newSensor.value.value,
                                    timestamp: new Date(newSensor.value.timestamp)
                                },
                                ...sensor.values
                            ].slice(0, 5)
                        };
                    }
                    return sensor;
                });

                // Important: updating lastValueAt will trigger the other useEffect
                return {
                    ...prev,
                    lastValueAt: new Date(data.lastValueAt),
                    sensors: updatedSensors
                };
            });
        };

        eventSource.onerror = () => {
            console.error("SSE connection lost");
            eventSource.close();
        };

        return () => {
            eventSource.close();
            clearInterval(intervalId);
        };
    }, [deviceData.id, deviceData.name]); // Added required dependencies

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{deviceData.name}</CardTitle>
                    <Badge variant={deviceData.status === "ONLINE" ? "success" : "destructive"}>
                        {deviceData.status}
                    </Badge>
                </div>
                <CardDescription>
                    Group: {deviceData.group.name}
                </CardDescription>
                <CardDescription className="text-xs">
                    Last activity: {new Date(deviceData.lastValueAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                        Active Sensors ({deviceData.sensors.length})
                    </h3>

                    <Collapsible
                        open={isExpanded}
                        onOpenChange={setIsExpanded}
                        className="w-full"
                    >
                        <ul className="divide-y pb-2">
                            {/* Always visible sensors */}
                            {deviceData.sensors
                                .slice(0, initialSensorsCount)
                                .map((sensor) => (
                                    <SensorListItem key={sensor.id} sensor={sensor} />
                                ))}
                        </ul>

                        {/* Collapsible content for additional sensors */}
                        {hasMoreSensors && (
                            <>
                                <CollapsibleContent>
                                    <ul className="divide-y border-t pt-2">
                                        {deviceData.sensors
                                            .slice(initialSensorsCount)
                                            .map((sensor) => (
                                                <SensorListItem key={sensor.id} sensor={sensor} />
                                            ))}
                                    </ul>
                                </CollapsibleContent>

                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mt-2 text-xs text-muted-foreground"
                                    >
                                        {isExpanded ? (
                                            <>
                                                <ChevronUp className="h-3 w-3 mr-1" />
                                                Show less
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="h-3 w-3 mr-1" />
                                                Show {deviceData.sensors.length - initialSensorsCount} more sensors
                                            </>
                                        )}
                                    </Button>
                                </CollapsibleTrigger>
                            </>
                        )}
                    </Collapsible>

                    <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                        <Link href={`/dashboard/devices/${deviceData.id}`}>
                            View Details <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}