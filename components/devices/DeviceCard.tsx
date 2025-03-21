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
import { motion, AnimatePresence } from "framer-motion";
import { getDeviceWithActiveSensorsAction } from "@/app/actions/deviceActions";

interface DeviceCardProps {
    device: DeviceQueryResult
}


export default function DeviceCard({ device }: DeviceCardProps) {
    const [deviceData, setDeviceData] = useState(device);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isStatusChanging, setIsStatusChanging] = useState(false);

    // Default number of sensors to show
    const initialSensorsCount = 3;
    const hasMoreSensors = deviceData.sensors ? deviceData.sensors.length > initialSensorsCount : false;
    const [refreshKey, setRefreshKey] = useState(false);
    const updateDeviceStatus = () => {
        const newStatus = getDeviceStatusFromLastValueAt(deviceData.lastValueAt);

        if (newStatus !== deviceData.status) {
            if (newStatus === "OFFLINE" && deviceData.status === "ONLINE") {
                toast.warning(`Device ${deviceData.name} has gone offline`);
            } else if (newStatus === "ONLINE" && deviceData.status === "OFFLINE") {
                toast.info(`Device ${deviceData.name} is back online`);
            }

            setIsStatusChanging(true);
            setTimeout(() => setIsStatusChanging(false), 1000);
            if (newStatus != "WAITING") {
                setDeviceData(prev => {
                    if (prev.lastValueAt === null || prev.group === null || prev.sensors === null) {
                        return prev;
                    }
                    return {
                        ...prev,
                        status: newStatus
                    };
                });
            }

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

        eventSource.onmessage = async (event) => {
            const data: DeviceSSEMessage = JSON.parse(event.data);

            // Skip connection messages
            if (data.type === "connected") {
                return;
            }
            if (data.type === "new sensors" && data.lastValueAt && deviceData.status === "WAITING") {
                const response = await getDeviceWithActiveSensorsAction(deviceData.id);
                if (!response.success) {
                    toast.error("Failed to get device data, please refresh the page.");
                    return;
                }
                setDeviceData(response.data.device);
                return;
            }

            // Update device data with new values
            setDeviceData(prev => {
                // Create a new sensors array with updated values
                const updatedSensors = prev.sensors ? prev.sensors.map((sensor) => {
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
                }) : [];
                // MOCK SENSORS
                /*  const mockSensors = [...updatedSensors, {
                     id: "1",
                     name: "mockSensor",
                     unit: "°C",
                     category: "Temperature",
                     groupSensorId: "1",
                     values: [
                         {
                             value: 20,
                             timestamp: new Date()
                         }
                     ]
                 },
                 {
                     id: "2",
                     name: "mockSensor2",
                     unit: "°C",
                     category: "Temperature",
                     groupSensorId: "2",
                     values: [
                         {
                             value: 25,
                             timestamp: new Date()
                         }
                     ]
                 }]; */
                // MOCK SENSORS
                // Important: updating lastValueAt will trigger the other useEffect
                return {
                    ...prev,
                    lastValueAt: new Date(data.lastValueAt),
                    sensors: updatedSensors,
                    status: prev.status === "ONLINE" || prev.status === "OFFLINE" ? prev.status : "OFFLINE",
                    group: prev.group// Ensure group is not null
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

    // Get animation settings based on status
    const getAnimationProps = () => {
        // Base animation for status change
        const baseAnimation = {
            initial: { scale: 0.8, opacity: 0 },
            animate: {
                scale: isStatusChanging ? [1, 1.2, 1] : 1,
                opacity: 1
            },
            transition: {
                duration: 0.5,
                scale: {
                    duration: 0.3,
                    times: [0, 0.5, 1]
                }
            }
        };

        // Add beating animation when online
        if (deviceData.status === "ONLINE" && !isStatusChanging) {
            return {
                ...baseAnimation,
                animate: {
                    ...baseAnimation.animate,
                    scale: [1, 1.04, 1],
                },
                transition: {
                    ...baseAnimation.transition,
                    scale: {
                        repeat: Infinity,
                        repeatType: "reverse" as const,
                        duration: 2,
                        ease: "easeInOut"
                    }
                }
            };
        }

        return baseAnimation;
    };

    const animationProps = getAnimationProps();

    return (
        <Card className="h-auto">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{deviceData.name}</CardTitle>
                    <AnimatePresence>
                        <motion.div
                            key={deviceData.status}
                            initial={animationProps.initial}
                            animate={animationProps.animate}
                            transition={animationProps.transition}
                        >
                            <Badge variant={deviceData.status === "ONLINE" ? "success" : deviceData.status === "WAITING" ? "outline" : "destructive"}>
                                {deviceData.status}
                            </Badge>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {deviceData.status != "WAITING" ? <>
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
                    </CardDescription> </> :
                    <></>
                }
            </CardHeader>
            {deviceData.status != "WAITING" ?
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
                :
                <CardContent className="flex justify-center items-center">
                    Waiting for data...
                </CardContent>}
        </Card>
    );
}