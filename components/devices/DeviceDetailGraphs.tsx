"use client";

import { DeviceQueryResult, SensorValueQueryResult } from "@/lib/contexts/deviceContext";
import { useEffect, useState } from "react";
import { getDeviceViewWithActiveSensorsBetweenAction } from "@/app/actions/deviceActions";
import { subscribeToDeviceEvents } from "@/lib/sseUtils";
import SensorGraph from "./sensors/SensorGraph";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceSSEMessage } from "@/types/types";
import { ViewDeviceCard } from "./DeviceCard";

interface DeviceDetailGraphsProps {
    initialData: DeviceQueryResult;
}

export default function DeviceDetailGraphs({
    initialData
}: DeviceDetailGraphsProps) {
    const [deviceData, setDeviceData] = useState<DeviceQueryResult>(initialData);
    // Effect for SSE to get real-time updates
    useEffect(() => {
        const deviceId = deviceData.id;
        if (!deviceId) return;

        // Subscribe to events using the new function
        const unsubscribe = subscribeToDeviceEvents([deviceId], (data: DeviceSSEMessage) => {
            // Skip connection messages
            if (data.type === "connected") return;

            if (data.type === "new sensors" && data.sensors && data.sensors.length > 0) {
                setDeviceData(prev => {
                    // Create updated device data
                    const updatedDevice = { ...prev };

                    // Update status and lastValueAt
                    updatedDevice.status = "ONLINE";
                    updatedDevice.lastValueAt = new Date(data.lastValueAt || new Date());

                    // Update sensors with new values
                    if (updatedDevice.sensors) {
                        updatedDevice.sensors = updatedDevice.sensors.map(sensor => {
                            // Find if this sensor has new data
                            const newSensorData = data.sensors?.find(
                                s => s.groupSensorId === sensor.groupSensorId
                            );

                            if (newSensorData) {
                                const newValues = newSensorData.values.slice(0, 10);
                                const newValuesFiltered = newValues.filter((value) => {
                                    if (sensor.values?.some(v => v.timestamp === value.timestamp)) return false;
                                    return true;
                                }).sort((a, b) => {
                                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                                })

                                if (newValuesFiltered) {

                                    return {
                                        ...sensor,
                                        values: [...newValues, ...(sensor.values || [])]
                                    };
                                }
                            }
                            return sensor;
                        });
                    }

                    return updatedDevice;
                });
            }
        });

        // Clean up subscription on unmount
        return unsubscribe;
    }, [deviceData]);

    if (deviceData.status === "WAITING") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Device Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-10 text-muted-foreground">
                        This device hasn't sent any data yet.
                        <br />
                        Graphs will appear here once the device comes online.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <ViewDeviceCard {...deviceData}></ViewDeviceCard>
    );
}