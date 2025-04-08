"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import SensorListItem from "./sensors/SensorListItem";
import { DeviceQueryResult, SensorValueQueryResult } from "@/lib/contexts/deviceContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/lib/utils";
import SensorGraph from "./sensors/SensorGraph";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getDeviceViewWithActiveSensorsBetweenAction } from "@/app/actions/deviceActions";
import DeviceMenu from "./DeviceMenu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface DeviceCardProps {
    device: DeviceQueryResult;
    isWrapper?: boolean; // Flag to indicate if this card is managed by DeviceIndexWrapper
    viewMode?: boolean; // Flag to indicate if this card is in view mode
}

export default function DeviceCard({ device, isWrapper = false, viewMode = false }: DeviceCardProps) {
    const [isStatusChanging, setIsStatusChanging] = useState(false);
    useEffect(() => {
        setIsStatusChanging(true)
        setTimeout(() => {
            setIsStatusChanging(false)
        }, 1000);
    }, [device.status])

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
        if (device.status === "ONLINE" && !isStatusChanging) {
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
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <CardTitle className="text-lg cursor-help">{device.name}</CardTitle>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p className="text-xs font-mono">ID: {device.id}</p>
                        </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center translate-x-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={device.status}
                                initial={animationProps.initial}
                                animate={animationProps.animate}
                                transition={animationProps.transition}
                            >
                                <Badge variant={device.status === "ONLINE" ? "success" : device.status === "WAITING" ? "outline" : "destructive"}>
                                    {device.status}
                                </Badge>
                            </motion.div>
                        </AnimatePresence>
                        <DeviceMenu className="" deviceId={device.id} variant="dropdown" dropdownButtonVariant="ghost" dropdownButtonSize="sm" />
                    </div>
                </div>

                {device.status != "WAITING" ? (
                    <>

                        <CardDescription>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="cursor-help">Group: {device.group.name}</span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p className="text-xs font-mono">ID: {device.group.id}</p>
                                </TooltipContent>
                            </Tooltip>
                        </CardDescription>
                        <CardDescription className="text-xs">
                            Last activity: {formatDate(device.lastValueAt ?? "")}
                        </CardDescription>
                    </>
                ) : <></>}
            </CardHeader>

            {viewMode ? ViewDeviceCard(device) : IndexDeviceCard(device)}
        </Card>
    );
}
function IndexDeviceCard(device: DeviceQueryResult) {
    const [isExpanded, setIsExpanded] = useState(false);
    // Default number of sensors to show
    const initialSensorsCount = 3;
    const hasMoreSensors = device.sensors ? device.sensors.length > initialSensorsCount : false;
    return (<>
        {device.status
            === "WAITING" ?
            (
                <CardContent className="flex justify-center items-center">
                    Waiting for data...
                </CardContent>
            )
            :
            !device.sensors || device.sensors?.length == 0 ? (
                <CardContent className="flex justify-center items-center">
                    No active sensors
                </CardContent>
            ) :
                (
                    <CardContent>
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">
                                Active Sensors ({device.sensors.length})
                            </h3>

                            <Collapsible
                                open={isExpanded}
                                onOpenChange={setIsExpanded}
                                className="w-full"
                            >
                                <ul className="divide-y pb-2">
                                    {device.sensors.length != 0 && device.sensors
                                        .slice(0, initialSensorsCount)
                                        .map((sensor) => (
                                            <SensorListItem key={sensor.id} sensor={sensor} />
                                        ))
                                    }
                                </ul>

                                {/* Collapsible content for additional sensors */}
                                {hasMoreSensors && (
                                    <>
                                        <CollapsibleContent>
                                            <ul className="divide-y border-t pt-2">
                                                {device.sensors
                                                    .slice(initialSensorsCount)
                                                    .map((sensor) => (
                                                        <SensorListItem key={sensor.id} sensor={sensor} />
                                                    ))
                                                }
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
                                                        Show {device.sensors.length - initialSensorsCount} more sensors
                                                    </>
                                                )}
                                            </Button>
                                        </CollapsibleTrigger>
                                    </>
                                )}
                            </Collapsible>

                            <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                                <Link href={`/dashboard/devices/${device.id}`}>
                                    View Details <ChevronRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                )}
    </>
    )

}
export function ViewDeviceCard(device: DeviceQueryResult) {
    const [timeRange, setTimeRange] = useState<number>(10); // Default time range value
    const [deviceData, setDeviceData] = useState<DeviceQueryResult>(device); // State to hold fetched data

    const [oldestValue, setOldestValue] = useState<Date>(new Date(Date.now() - 10 * 60 * 1000));
    const [oldestValues, setOldestValues] = useState<Map<string, SensorValueQueryResult[]>>(new Map());

    useEffect(() => {
        const initialValues = new Map<string, SensorValueQueryResult[]>();
        deviceData.sensors?.forEach((sensor) => {
            initialValues.set(sensor.id, sensor.values as SensorValueQueryResult[]);
        });
        setOldestValues(initialValues);
    }, []);  // Empty dependency array means this only runs once
    useEffect(() => {
        const fetchData = async () => {
            const timeToFetch = new Date(Date.now() - timeRange * 60 * 1000);
            if (timeToFetch.getTime() < oldestValue.getTime()) {
                setOldestValue(timeToFetch);
                const response = await getDeviceViewWithActiveSensorsBetweenAction(deviceData.id, deviceData.view, timeToFetch, new Date(Date.now()))
                if (!response.success) {
                    console.error("Error fetching device data:", response.message);
                    return;
                }
                const newData = response.data;
                if (newData) {
                    setDeviceData(newData.device);
                    // Create new Map to update state properly
                    const newOldestValues = new Map(oldestValues);
                    newData.device.sensors?.forEach((sensor) => {
                        newOldestValues.set(sensor.id, sensor.values as SensorValueQueryResult[]);
                    });
                    setOldestValues(newOldestValues);
                }
                // Update the oldest values map with the new data

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
    }, [timeRange, deviceData.id, deviceData.view]);
    useEffect(() => {
        const newDevice = {
            ...deviceData,
            status: device.status === "WAITING" ? "OFFLINE" : device.status,
            group: device.group,
            lastValueAt: device.lastValueAt || new Date(),
        };

        if (newDevice.sensors && device.sensors) {
            newDevice.sensors = newDevice.sensors.map((sensor) => {
                if (!sensor.values) return sensor;
                const newSensor = device.sensors?.find((s) => s.id === sensor.id);
                if (!newSensor || !newSensor.values || !newSensor.values[0]) return sensor;

                const newValues = newSensor.values.slice(0, 10);
                const newValuesFiltered = newValues.filter((value) => {
                    if (sensor.values?.some(v => v.timestamp === value.timestamp)) return false;
                    return true;
                }).sort((a, b) => {
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                })
                if (newValuesFiltered) {
                    return {
                        ...sensor,
                        values: [...newValuesFiltered, ...sensor.values.flat()] // Flatten nested arrays
                    };
                }

                return sensor;
            });

            setDeviceData(newDevice);
        }
    }, [device]);
    const timeRanges = [
        { label: "Last 10 minutes", value: 10 },
        { label: "Last 30 minutes", value: 30 },
        { label: "Last hour", value: 60 },
        { label: "Last 3 hours", value: 180 },
        { label: "Last 6 hours", value: 360 },
        { label: "Last 12 hours", value: 720 },
        { label: "Last 24 hours", value: 1440 },
    ];
    // Oldest value is by default 10 minutes ago

    return (
        <CardContent className="px-2 space-y-4">
            <Select
                defaultValue={timeRange.toString()}
                onValueChange={(value) => setTimeRange(parseInt(value))}
            >
                <SelectTrigger className="w-[180px] h-8 text-xs">
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
            <div className="space-y-4">
                {deviceData.sensors && deviceData.sensors.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {deviceData.sensors.map((sensor) => (
                            <SensorGraph
                                key={sensor.id}
                                sensor={sensor}
                                // Get color based on category, or use default if category not found
                                color={sensor.categoryColor}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted-foreground">
                        No sensor data available
                    </div>
                )}
            </div>
        </CardContent>
    );
}