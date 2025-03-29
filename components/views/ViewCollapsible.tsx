"use client";

import { useState, useEffect } from "react";
import { DeviceQueryResult } from "@/lib/contexts/deviceContext";
import { ChevronRight, ChevronDown } from "lucide-react";
import DeviceViewWrapper from "@/components/devices/DeviceViewWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { getDevicesViewWithActiveSensorsBetweenAction } from "@/app/actions/deviceActions";
import { toast } from "sonner";

interface ViewCollapsibleProps {
    viewName: string;
    defaultExpanded?: boolean;
    deviceCount: number;
}
const defaultFetchDate = new Date(Date.now() - 1000 * 60 * 10); // Default to 10 minutes ago
export default function ViewCollapsible({ viewName, deviceCount, defaultExpanded = false }: ViewCollapsibleProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [devices, setDevices] = useState<DeviceQueryResult[]>([]);

    // Only initialize SSE connections when expanded for the first time
    useEffect(() => {
        if (isExpanded && !hasInitialized) {
            setHasInitialized(true);
            const fetchData = async () => {
                const response = await getDevicesViewWithActiveSensorsBetweenAction(viewName, defaultFetchDate, new Date(Date.now()));
                if (response) {
                    setDevices(response.map((device) => {
                        return device.device
                    }));
                }
            }
            fetchData().catch((error) => {
                console.error("Error fetching devices:", error);
                toast.error("Error fetching devices. Please try again later.");
            });
        } else {
            setHasInitialized(false);
        }
    }, [isExpanded]);

    return (
        <Card className="mb-6">
            <CardHeader className="py-3">
                <Button
                    variant="ghost"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex justify-between items-center p-0 h-auto"
                >
                    <CardTitle className="text-xl flex items-center">
                        {isExpanded ?
                            <ChevronDown className="h-5 w-5 mr-2" /> :
                            <ChevronRight className="h-5 w-5 mr-2" />}
                        {viewName} View
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                        {deviceCount} {deviceCount === 1 ? "device" : "devices"}
                    </span>
                </Button>
            </CardHeader>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CardContent className="pt-0">
                            {(hasInitialized || isExpanded) && (
                                <DeviceViewWrapper
                                    initialDevices={devices}
                                    isExpanded={isExpanded}
                                />
                            )}
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}