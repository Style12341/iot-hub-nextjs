"use client";

import { Device } from "@prisma/client";
import { DeviceGroupsWithSensorsIds } from "@/lib/contexts/deviceContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "../../ui/label";
import { Skeleton } from "../../ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type DeviceGroupSelectorProps = {
    devices: (Device & { View: { name: string } | null })[];
    selectedDeviceId: string;
    onDeviceChange: (deviceId: string) => void;
    deviceGroups: DeviceGroupsWithSensorsIds | null;
    selectedGroupId: string;
    onGroupChange: (groupId: string) => void;
    isLoading: boolean;
};

export function DeviceGroupSelector({
    devices,
    selectedDeviceId,
    onDeviceChange,
    deviceGroups,
    selectedGroupId,
    onGroupChange,
    isLoading
}: DeviceGroupSelectorProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="device-select">Device</Label>
                <Select
                    value={selectedDeviceId}
                    onValueChange={onDeviceChange}
                    disabled={isLoading}
                >
                    <SelectTrigger id="device-select" className="w-full">
                        <SelectValue placeholder="Select a device" />
                    </SelectTrigger>
                    <SelectContent>
                        <TooltipProvider>
                            {devices.map((device) => {
                                const isWaiting = device.status === "WAITING";

                                return (
                                    <Tooltip key={device.id}>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <SelectItem
                                                    value={device.id}
                                                    disabled={isWaiting}
                                                    className={isWaiting ? "opacity-50 cursor-not-allowed" : ""}
                                                >
                                                    {device.name} ({device.View?.name || "No View"})
                                                    {isWaiting && " (Waiting)"}
                                                </SelectItem>
                                            </div>
                                        </TooltipTrigger>
                                        {isWaiting && (
                                            <TooltipContent side="right">
                                                <p>This device is waiting for sensor values</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                );
                            })}
                        </TooltipProvider>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="group-select">Group</Label>
                {isLoading && !deviceGroups ? (
                    <Skeleton className="h-10 w-full" />
                ) : (
                    <Select
                        value={selectedGroupId}
                        onValueChange={onGroupChange}
                        disabled={!deviceGroups || isLoading}
                    >
                        <SelectTrigger id="group-select" className="w-full">
                            <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                            {deviceGroups?.Groups.sort((a, b) => {
                                if (a.active === b.active) {
                                    return a.name.localeCompare(b.name);
                                }
                                return a.active ? -1 : 1;
                            }).map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                    {group.name} {group.active ? "(Active)" : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
        </div>
    );
}