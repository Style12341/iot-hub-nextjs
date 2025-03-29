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
    const [devices, setDevices] = useState<DeviceQueryResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dataFetched, setDataFetched] = useState(false);

    // Fetch data when expanded and data hasn't been fetched yet
    useEffect(() => {
        if (isExpanded && !dataFetched && !isLoading) {
            const fetchData = async () => {
                try {
                    setIsLoading(true);
                    console.log(`Fetching data for ${viewName} view`);

                    const response = await getDevicesViewWithActiveSensorsBetweenAction(
                        viewName,
                        defaultFetchDate,
                        new Date(Date.now())
                    );

                    if (response) {
                        const deviceData = response.map(item => item.device);
                        setDevices(deviceData);
                        setDataFetched(true);
                    } else {
                        toast.error(`Failed to fetch devices for ${viewName} view`);
                    }
                } catch (error) {
                    console.error("Error fetching devices:", error);
                    toast.error("Error fetching devices. Please try again later.");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchData();
        }
        if (!isExpanded) {
            setDataFetched(false);
            setDevices([]);
        }
    }, [isExpanded, viewName]);

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
                            {isLoading ? (
                                <div className="py-12 flex justify-center">
                                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                                </div>
                            ) : dataFetched ? (
                                <DeviceViewWrapper
                                    initialDevices={devices}
                                    isExpanded={isExpanded}
                                />
                            ) : (
                                <div className="py-12 text-center text-muted-foreground">
                                    No devices to display
                                </div>
                            )}
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}