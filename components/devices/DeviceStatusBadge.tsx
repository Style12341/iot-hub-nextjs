"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToDeviceEvents } from "@/lib/sseUtils";
import { getDeviceStatusFromLastValueAt } from "@/lib/contexts/deviceContext";
import { DeviceSSEMessage } from "@/types/types";

interface DeviceStatusBadgeProps {
    deviceId: string;
    initialStatus: "ONLINE" | "OFFLINE" | "WAITING";
    initialLastValueAt?: Date | string | null;
}

export default function DeviceStatusBadge({
    deviceId,
    initialStatus,
    initialLastValueAt
}: DeviceStatusBadgeProps) {
    const [status, setStatus] = useState<"ONLINE" | "OFFLINE" | "WAITING">(initialStatus);
    const [isAnimating, setIsAnimating] = useState(false);
    const [lastValueAt, setLastValueAt] = useState<Date | null>(
        initialLastValueAt ? new Date(initialLastValueAt + "Z") : null
    );

    // Use interval timer for status checks
    useEffect(() => {
        // Set up interval to check status every 10 seconds
        const intervalId = setInterval(() => {
            // Only check timeout-based status if we have a lastValueAt timestamp
            if (lastValueAt && status === "ONLINE") {
                console.log("Checking device status based on time...");
                const newStatus = getDeviceStatusFromLastValueAt(lastValueAt);

                // If status should change based on time
                if (newStatus !== status) {
                    setStatus(newStatus);
                    setIsAnimating(true);
                    setTimeout(() => setIsAnimating(false), 1000);
                }
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(intervalId);
    }, [lastValueAt, status]);

    // SSE connection effect
    useEffect(() => {
        if (!deviceId) return;

        // Subscribe to events using the new function
        const unsubscribe = subscribeToDeviceEvents([deviceId], (data: DeviceSSEMessage) => {
            try {
                // Update lastValueAt and status when we get new sensor data
                if (data.type === "new sensors" && data.sensors && data.sensors.length > 0) {
                    // Update lastValueAt timestamp
                    if (data.lastValueAt) {
                        setLastValueAt(data.lastValueAt);
                    } else {
                        setLastValueAt(new Date(Date.now()));
                    }

                    // Set status to ONLINE
                    if (status !== "ONLINE") {
                        setStatus("ONLINE");
                        setIsAnimating(true);
                        setTimeout(() => setIsAnimating(false), 1000);
                    }
                }
            } catch (error) {
                console.error("Error handling SSE data:", error);
            }
        });

        // Clean up subscription on unmount
        return unsubscribe;
    }, [deviceId, status]);

    // Get animation settings based on status
    const getAnimationProps = () => {
        // Base animation for status change
        const baseAnimation = {
            initial: { scale: 0.8, opacity: 0 },
            animate: {
                scale: isAnimating ? [1, 1.2, 1] : 1,
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
        if (status === "ONLINE" && !isAnimating) {
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
        <AnimatePresence mode="wait">
            <motion.div
                key={status}
                initial={animationProps.initial}
                animate={animationProps.animate}
                transition={animationProps.transition}
            >
                <Badge variant={
                    status === "ONLINE"
                        ? "success"
                        : status === "WAITING"
                            ? "outline"
                            : "destructive"
                }>
                    {status}
                </Badge>
            </motion.div>
        </AnimatePresence>
    );
}