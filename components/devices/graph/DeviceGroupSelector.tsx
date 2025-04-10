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
                    <SelectTrigger id="device-select">
                        <SelectValue placeholder="Select a device" />
                    </SelectTrigger>
                    <SelectContent>
                        {devices.map((device) => (
                            <SelectItem key={device.id} value={device.id}>
                                {device.name} ({device.View?.name || "No View"})
                            </SelectItem>
                        ))}
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
                        <SelectTrigger id="group-select">
                            <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                            {deviceGroups?.Groups.map((group) => (
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