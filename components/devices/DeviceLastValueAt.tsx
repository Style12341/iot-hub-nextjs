"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { subscribeToDeviceEvents } from "@/lib/sseUtils";
import { DeviceSSEMessage } from "@/types/types";
import { motion, AnimatePresence } from "framer-motion";

interface DeviceLastValueAtProps {
    deviceId: string;
    initialLastValueAt?: Date | string | null;
}

export default function DeviceLastValueAt({
    deviceId,
    initialLastValueAt
}: DeviceLastValueAtProps) {
    const [lastValueAt, setLastValueAt] = useState<Date | null>(
        initialLastValueAt ? new Date(initialLastValueAt + "Z") : null
    );
    const [isUpdating, setIsUpdating] = useState(false);

    // SSE connection effect
    useEffect(() => {
        if (!deviceId) return;

        // Subscribe to events using the function
        const unsubscribe = subscribeToDeviceEvents([deviceId], (data: DeviceSSEMessage) => {
            try {
                // Update lastValueAt when we get new sensor data
                if (data.type === "new sensors" && data.sensors && data.sensors.length > 0) {
                    // Update lastValueAt timestamp
                    if (data.lastValueAt) {
                        setLastValueAt(new Date(data.lastValueAt));
                        setIsUpdating(true);
                        setTimeout(() => setIsUpdating(false), 1000);
                    }
                }
            } catch (error) {
                console.error("Error handling SSE data:", error);
            }
        });

        // Clean up subscription on unmount
        return unsubscribe;
    }, [deviceId]);

    // Format to display
    const formattedDate = lastValueAt ? formatDate(lastValueAt) : "Never";

    return (
        <AnimatePresence mode="wait">
            <motion.span
                key={formattedDate}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`text-sm ${isUpdating ? "text-success" : ""}`}
            >
                {formattedDate}
            </motion.span>
        </AnimatePresence>
    );
}