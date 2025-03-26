"use client";

import { useEffect, useState } from "react";
import { DeviceHasReceivedData, DeviceQueryResult, getDeviceStatusFromLastValueAt } from "@/lib/contexts/deviceContext";
import { toast } from "sonner";
import { DeviceSSEMessage } from "@/types/types";
import DeviceCard from "./DeviceCard";
import { getDevicesEventSource } from "@/lib/sseUtils";
import { getDeviceWithActiveSensorsAction } from "@/app/actions/deviceActions";

interface DeviceViewWrapperProps {
    initialDevices: DeviceQueryResult[];
}

export default function DeviceViewWrapper({ initialDevices }: DeviceViewWrapperProps) {
    const [devices, setDevices] = useState<DeviceQueryResult[]>(initialDevices);
    const [refreshKey, setRefreshKey] = useState(false);

    useEffect(() => {
        setDevices(initialDevices);
    }, [initialDevices]);

    // Effect for device status check
    useEffect(() => {
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
    }, [refreshKey]);

    // Effect for SSE connection
    useEffect(() => {
        // Get all device IDs
        const deviceIds = devices.map(device => device.id);
        if (deviceIds.length === 0) return;

        // Set up interval to check status every 10 seconds
        const intervalId = setInterval(() => {
            setRefreshKey(prev => !prev);
        }, 10000);

        // Set up a single SSE connection for all devices
        const eventSource = getDevicesEventSource(deviceIds);

        eventSource.onmessage = async (event) => {
            const data: DeviceSSEMessage = JSON.parse(event.data);
            console.debug("Received SSE message: ", data);

            // Skip connection messages
            if (data.type === "connected") {
                return;
            }

            // Get the device ID from the message
            const deviceId = data.id;

            if (data.type === "new sensors" && data.lastValueAt) {
                // Find the device
                const deviceIndex = devices.findIndex(d => d.id === deviceId);
                if (deviceIndex !== -1 && devices[deviceIndex].status === "WAITING") {
                    const response = await getDeviceWithActiveSensorsAction(deviceId);
                    if (!response.success) {
                        toast.error(`Failed to get device data for ${devices[deviceIndex].name}`);
                        return;
                    }
                }
            }

            // Update the specific device with new sensor values
            setDevices(prev => {
                return prev.map(device => {
                    if (device.id !== deviceId) return device;

                    // Create a new sensors array with updated values
                    const updatedSensors = device.sensors ? device.sensors.map((sensor) => {
                        // Check if this sensor has updated data in the message
                        const newSensor = data.sensors.find(
                            (s) => s.groupSensorId === sensor.groupSensorId
                        );

                        if (data.sensors && newSensor) {
                            if (!sensor.values) {
                                sensor.values = [];
                            }
                            const timestamp = newSensor.value.timestamp
                            console.log("newtimestamp", timestamp)
                            return {
                                ...sensor,
                                values: [
                                    {
                                        value: newSensor.value.value,
                                        timestamp: timestamp
                                    },
                                    ...sensor.values,

                                ].slice(0,14400)
                            };
                        }
                        return sensor;
                    }) : [];
                    // Ensure lastValueAt is always a proper Date object
                    const lastValueAt = data.lastValueAt
                        ? new Date(data.lastValueAt)
                        : new Date();
                    // Return updated device
                    return {
                        ...device,
                        lastValueAt: lastValueAt,
                        sensors: updatedSensors,
                        status: "ONLINE"
                    };
                });
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
    }, [devices.map(d => d.id).join(',')]); // Dependency on device IDs only

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