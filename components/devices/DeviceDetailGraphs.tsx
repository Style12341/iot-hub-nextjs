"use client";

import { DeviceQueryResult, SensorValueQueryResult } from "@/lib/contexts/deviceContext";
import { useEffect, useState } from "react";
import { getDeviceViewWithActiveSensorsBetweenAction } from "@/app/actions/deviceActions";
import { subscribeToDeviceEvents } from "@/lib/sseUtils";
import SensorGraph from "./sensors/SensorGraph";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceSSEMessage } from "@/types/types";

interface DeviceDetailGraphsProps {
    deviceId: string;
    view: string;
    initialData: DeviceQueryResult;
}

export default function DeviceDetailGraphs({
    deviceId,
    view = "Default",
    initialData
}: DeviceDetailGraphsProps) {
    const [timeRange, setTimeRange] = useState<number>(10); // Default: 10 minutes
    const [deviceData, setDeviceData] = useState<DeviceQueryResult>(initialData);

    // Add cache states for historical data like in DeviceCard
    const [oldestValue, setOldestValue] = useState<Date>(new Date(Date.now() - 15 * 60 * 1000)); // Default: 15 minutes ago
    const [oldestValues, setOldestValues] = useState<Map<string, SensorValueQueryResult[]>>(new Map());

    // Initialize the cache with initial data
    useEffect(() => {
        const initialValues = new Map<string, SensorValueQueryResult[]>();
        initialData.sensors?.forEach((sensor) => {
            console.log(sensor.values)
            initialValues.set(sensor.id, sensor.values || []);
        });
        setOldestValues(initialValues);
    }, [initialData]);

    // Time ranges for dropdown
    const timeRanges = [
        { label: "Last 10 minutes", value: 10 },
        { label: "Last 30 minutes", value: 30 },
        { label: "Last hour", value: 60 },
        { label: "Last 3 hours", value: 180 },
        { label: "Last 6 hours", value: 360 },
        { label: "Last 12 hours", value: 720 },
        { label: "Last 24 hours", value: 1440 },
    ];

    // Effect for fetching historical data when time range changes
    useEffect(() => {
        const fetchData = async () => {
            const timeToFetch = new Date(Date.now() - timeRange * 60 * 1000);
            // Only fetch if we need older data than what we have
            if (timeToFetch.getTime() < oldestValue.getTime()) {
                console.log("Fetching new data for time range:", timeToFetch);
                setOldestValue(timeToFetch);
                const response = await getDeviceViewWithActiveSensorsBetweenAction(
                    deviceId,
                    view,
                    timeToFetch,
                    new Date(Date.now())
                );

                if (response.success && response.data) {
                    // Update device data
                    setDeviceData(response.data.device);

                    // Update cached values
                    const newOldestValues = new Map(oldestValues);
                    response.data.device.sensors?.forEach((sensor) => {
                        // Merge with existing values if we have them
                        const existingValues = oldestValues.get(sensor.id) || [];

                        // Create a set of existing timestamps for quick lookup
                        const existingTimestamps = new Set(
                            existingValues.map(v => new Date(v.timestamp).getTime())
                        );

                        // Add only new values that don't already exist
                        const newValues = sensor.values?.filter(v =>
                            !existingTimestamps.has(new Date(v.timestamp).getTime())
                        ) || [];

                        // Combine and sort by timestamp (newest first)
                        const combinedValues = [...existingValues, ...newValues]
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                        // Store in cache
                        newOldestValues.set(sensor.id, combinedValues);
                    });

                    setOldestValues(newOldestValues);
                }
            } else {
                // Create updated sensors with filtered values
                const newData = deviceData.sensors?.map(sensor => {
                    // Get all historical values from cache
                    const allValues = oldestValues.get(sensor.id) || [];
                    // Filter values based on selected time range
                    const filteredValues = allValues.filter(value => {
                        // Add Z only if timestamp is not already in ISO format
                        // This is to ensure compatibility with the Date constructor
                        // and avoid issues with time zones
                        if (typeof value.timestamp === "string" && !value.timestamp.endsWith("Z")) {
                            value.timestamp = new Date(value.timestamp + "Z")
                        } else {
                            value.timestamp = new Date(value.timestamp)
                        }


                        return value.timestamp.getTime() >= timeToFetch.getTime()
                    }
                    );

                    return {
                        ...sensor,
                        values: filteredValues
                    };
                });

                if (newData && deviceData.status !== "WAITING" && newData.length) {
                    const newDevice: DeviceQueryResult = {
                        ...deviceData,
                        sensors: newData,
                    };
                    setDeviceData(newDevice);
                }
            }
        };

        fetchData();
    }, [timeRange, deviceId, view, oldestValues]);

    // Effect for SSE to get real-time updates
    useEffect(() => {
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
                                const newValue = {
                                    value: newSensorData.value.value,
                                    timestamp: new Date(newSensorData.value.timestamp || new Date())
                                };

                                // Check if this value already exists
                                const valueExists = sensor.values?.some(v =>
                                    new Date(v.timestamp).getTime() === newValue.timestamp.getTime()
                                );

                                if (!valueExists) {
                                    // Also update the cache

                                    setOldestValues(prev => {
                                        const cachedValues = prev.get(sensor.id) || [];
                                        const newCachedValues = [...cachedValues, newValue]
                                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                                        return new Map(prev).set(sensor.id, newCachedValues);
                                    })

                                    return {
                                        ...sensor,
                                        values: [newValue, ...(sensor.values || [])]
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
    }, [deviceId]);

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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Sensor Data</h2>
                <Select
                    value={timeRange.toString()}
                    onValueChange={(value) => setTimeRange(parseInt(value))}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                        {timeRanges.map((range) => (
                            <SelectItem key={range.value} value={range.value.toString()}>
                                {range.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {deviceData.sensors && deviceData.sensors.length > 0 ? (
                    deviceData.sensors.map((sensor) => (
                        <SensorGraph
                            key={sensor.id}
                            sensor={sensor}
                            color={
                                sensor.categoryColor
                            }
                        />
                    ))
                ) : (
                    <div className="col-span-2 text-center py-10 text-muted-foreground">
                        No active sensors found for this device.
                    </div>
                )}
            </div>
        </div>
    );
}