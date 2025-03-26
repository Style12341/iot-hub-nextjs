"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import SensorListItem from "./sensors/SensorListItem";
import { DeviceQueryResult } from "@/lib/contexts/deviceContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/lib/utils";
import SensorGraph from "./sensors/SensorGraph";

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
                    <CardTitle className="text-lg">{device.name}</CardTitle>
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
                </div>

                {device.status != "WAITING" ? (
                    <>
                        <CardDescription>
                            Group: {device.group.name}
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
        {
            device.status != "WAITING" ? (
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
                                {device.sensors
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
            ) : (
                <CardContent className="flex justify-center items-center">
                    Waiting for data...
                </CardContent>
            )
        }</>
    )

}
// ...existing code...

function ViewDeviceCard(device: DeviceQueryResult) {
    return (
        <CardContent className="p-2">
            <div className="space-y-4">
                {device.sensors && device.sensors.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {device.sensors.map((sensor) => (
                            <SensorGraph
                                key={sensor.id}
                                sensor={sensor}
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