"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import SensorListItem from "./sensors/SensorListItem";
import { DeviceQueryResult, SensorQueryResult } from "@/lib/contexts/deviceContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { timeStamp } from "console";

interface DeviceCardProps {
    device: DeviceQueryResult
}

export default function DeviceCard({ device }: DeviceCardProps) {
    const [deviceData, setDeviceData] = useState(device);
    const [isExpanded, setIsExpanded] = useState(false);
    /*     const mockedExtraSensors: SensorQueryResult[] = [
            {
                id: "sensor-4",
                name: "Temperature Sensor",
                category: "Temperature",
                unit: "°C",
                groupSensorId: "group-1-sensor-4",
                values: [{ value: 25, timestamp: new Date().toString() }]
            },
            {
                id: "sensor-5",
                name: "Humidity Sensor",
                category: "Humidity",
                unit: "%",
                groupSensorId: "group-1-sensor-5",
                values: [{ value: 50, timestamp: new Date().toString() }]
            },
            {
                id: "sensor-6",
                name: "Humidity Sensor",
                category: "Humidity",
                unit: "%",
                groupSensorId: "group-1-sensor-6",
                values: [{ value: 50, timestamp: new Date().toString() }]
            }
        ]
        useEffect(() => {
    
            setDeviceData({
                ...deviceData,
                sensors: [...deviceData.sensors, ...mockedExtraSensors]
            });
        }, []); */
    // Default number of sensors to show
    const initialSensorsCount = 3;
    const hasMoreSensors = deviceData.sensors.length > initialSensorsCount;

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