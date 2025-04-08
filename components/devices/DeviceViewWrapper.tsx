"use client";

import { useEffect, useState, useRef } from "react";
import { DeviceHasReceivedData, DeviceQueryResult, getDeviceStatusFromLastValueAt } from "@/lib/contexts/deviceContext";
import { toast } from "sonner";
import { DeviceSSEMessage } from "@/types/types";
import DeviceCard from "./DeviceCard";
import { getDeviceWithActiveSensorsAction } from "@/app/actions/deviceActions";
import { subscribeToDeviceEvents } from "@/lib/sseUtils";

interface DeviceViewWrapperProps {
    initialDevices: DeviceQueryResult[];
    isExpanded?: boolean;
}

export default function DeviceViewWrapper({ initialDevices, isExpanded = true }: DeviceViewWrapperProps) {
    const [devices, setDevices] = useState<DeviceQueryResult[]>(initialDevices);
    const [refreshKey, setRefreshKey] = useState(false);
    // Reference to store unsubscribe function
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Update devices when props change
    useEffect(() => {
        setDevices(initialDevices);
    }, [initialDevices]);

    // Effect for SSE connection - will run when isExpanded changes
    useEffect(() => {
        // Clean up any existing subscription first
        if (unsubscribeRef.current) {
            console.log("Cleaning up existing SSE subscription");
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        // Only set up SSE when expanded and we have devices
        if (!isExpanded || initialDevices.length === 0) {
            return;
        }
        const deviceIds = initialDevices.map(device => device.id);

        // Set up interval to check status every 10 seconds
        const intervalId = setInterval(() => {
            setRefreshKey(prev => !prev);
        }, 10000);

        const unsubscribe = subscribeToDeviceEvents(deviceIds, async (data: DeviceSSEMessage) => {
            if (data.type === "connected") return;

            const deviceId = data.id;

            if (data.type === "new sensors" && data.lastValueAt) {
                const deviceIndex = devices.findIndex(d => d.id === deviceId);
                if (deviceIndex !== -1 && devices[deviceIndex].status === "WAITING") {
                    const response = await getDeviceWithActiveSensorsAction(deviceId);
                    if (!response.success) {
                        toast.error(`Failed to get device data for ${devices[deviceIndex].name}`);
                        return;
                    }
                }


                // Update the specific device with new sensor values
                setDevices(prev => {
                    return prev.map(device => {
                        if (device.id !== deviceId) return device;

                        // Create a new sensors array with updated values
                        const updatedSensors = device.sensors ? device.sensors.map((sensor) => {
                            const newSensor = data.sensors?.find(
                                (s) => s.groupSensorId === sensor.groupSensorId
                            );

                            if (data.sensors && newSensor) {
                                if (!sensor.values) {
                                    sensor.values = [];
                                }
                                const newValues = newSensor.values.sort((a, b) => {
                                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                                })
                                console.log(newValues)
                                return {
                                    ...sensor,
                                    values: [
                                        ...newValues,
                                        ...sensor.values,
                                    ].slice(0, 14400)
                                };
                            }
                            return sensor;
                        }) : [];

                        const lastValueAt = data.lastValueAt
                            ? new Date(data.lastValueAt)
                            : new Date();

                        if (device.status === "WAITING" || device.status === "OFFLINE") {
                            toast.info(`Device ${device.name} is back online`);
                        }

                        return {
                            ...device,
                            activeFirmwareVersion: data.activeFirmwareVersion,
                            lastValueAt: lastValueAt,
                            sensors: updatedSensors,
                            status: "ONLINE"
                        };
                    });
                });
            }
        });

        // Store the unsubscribe function for cleanup
        unsubscribeRef.current = unsubscribe;

        return () => {
            console.log("Cleaning up SSE subscription and interval");
            clearInterval(intervalId);
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [isExpanded, initialDevices]);

    // Status check effect
    useEffect(() => {
        if (!isExpanded) return;

        // Check all devices' statuses
        const updatedDevices = devices.map(device => {
            const newStatus = getDeviceStatusFromLastValueAt(device.lastValueAt);
            if (newStatus !== device.status && newStatus !== "WAITING") {
                if (newStatus === "OFFLINE" && device.status === "ONLINE") {
                    toast.warning(`Device ${device.name} has gone offline`);
                } else if (newStatus === "ONLINE" && device.status === "OFFLINE") {
                    toast.info(`Device ${device.name} is back online`);
                }
                if (!device.lastValueAt) {
                    return device;
                }
                const newDevice: DeviceHasReceivedData = {
                    ...device,
                    status: newStatus
                }
                return newDevice;
            }
            return device;
        });

        setDevices(updatedDevices);
    }, [refreshKey, isExpanded]);

    return (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
            {devices.map(device => (
                <div key={device.id} className="w-full">
                    <DeviceCard
                        key={device.id + "-card"}
                        device={device}
                        isWrapper={true}
                        viewMode={true}
                    />
                </div>
            ))}
        </div>
    );
}