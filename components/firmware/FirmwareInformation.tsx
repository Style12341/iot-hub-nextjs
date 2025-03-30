"use client"
import { DeviceFirmwareState } from "@/lib/contexts/deviceContext";
import { subscribeToDeviceEvents } from "@/lib/sseUtils";
import { DeviceSSEMessage } from "@/types/types";
import { MicrochipIcon, TagIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function FirmwareInformation({ deviceId, firmware }: { deviceId: string, firmware: DeviceFirmwareState }) {
    //Subscribe to device events to get firmware updates
    const [activeFirmware, setActiveFirmware] = useState(firmware.ActiveFirmware);
    useEffect(() => {
        const handleFirmwareUpdate = (data: DeviceSSEMessage) => {
            if (data.type === "connected") {
                return;
            }
            setActiveFirmware(prev => {
                if (data.activeFirmwareVersion && prev) {
                    return {
                        ...prev,
                        version: data.activeFirmwareVersion,
                    };
                }
                return prev;
            });
        };

        // Subscribe to events using the function
        const unsubscribe = subscribeToDeviceEvents([deviceId], handleFirmwareUpdate);

        // Clean up subscription on unmount
        return () => unsubscribe();
    })


    return (
        <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center text-primary">
                <MicrochipIcon className="h-4 w-4 mr-2" />
                Firmware Information
            </h3>
            <ul className="text-sm space-y-1">
                <li className="flex items-center text-muted-foreground">
                    <TagIcon className="h-3.5 w-3.5 mr-2" />
                    <span className="font-medium mr-1">Active firmware:</span>
                    {activeFirmware ? "v" + (activeFirmware?.version || "Unknown") : "None"}
                </li>
                <li className="flex items-center text-muted-foreground">
                    <TagIcon className="h-3.5 w-3.5 mr-2" />
                    <span className="font-medium mr-1">Assigned firmware:</span>
                    {firmware.AssignedFirmware ? "v" + (firmware.AssignedFirmware?.version || "Unknown") : "None"}
                </li>
            </ul>
            {activeFirmware?.version !== firmware.AssignedFirmware?.version && (
                <div className="text-sm mt-2 text-yellow-300">
                    <p className="font-medium">Warning:</p>
                    {firmware.AssignedFirmware ? <p>Device pending update</p> : <p>Device is running local firmware</p>}
                </div>)
            }
        </div>
    )
}