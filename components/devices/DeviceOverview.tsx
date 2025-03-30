import { DeviceFirmwareState, DeviceQueryResult } from "@/lib/contexts/deviceContext";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, ServerIcon, TagIcon, ClockIcon, ListOrderedIcon, EyeIcon, MicrochipIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DeviceStatusBadge from "./DeviceStatusBadge";
import DeviceLastValueAt from "./DeviceLastValueAt";
import { FirmwareInformation } from "../firmware/FirmwareInformation";

interface DeviceOverviewProps {
    device: DeviceQueryResult;
    firmware: DeviceFirmwareState;
}

export default function DeviceOverview({ device, firmware }: DeviceOverviewProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold">{device.name}</CardTitle>
                        <CardDescription>Device ID: {device.id}</CardDescription>
                    </div>
                    <DeviceStatusBadge deviceId={device.id} deviceName={device.name} initialStatus={device.status} initialLastValueAt={device.lastValueAt} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* General Information */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium flex items-center">
                            <InfoIcon className="h-4 w-4 mr-2" />
                            General Information
                        </h3>
                        <ul className="text-sm space-y-1">
                            <li className="flex items-center text-muted-foreground">
                                <ServerIcon className="h-3.5 w-3.5 mr-2" />
                                <span className="font-medium mr-1">Group:</span>
                                {device.group?.name || "No group assigned"}
                            </li>
                            <li className="flex items-center text-muted-foreground">
                                <EyeIcon className="h-3.5 w-3.5 mr-2" />
                                <span className="font-medium mr-1">View:</span>
                                {device.view || "Default view"}
                            </li>
                            <li className="flex items-center text-muted-foreground">
                                <ClockIcon className="h-3.5 w-3.5 mr-2" />
                                <DeviceLastValueAt
                                    deviceId={device.id}
                                    initialLastValueAt={device.lastValueAt}
                                />
                            </li>
                        </ul>
                    </div>

                    {/* Sensors Information */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium flex items-center">
                            <ListOrderedIcon className="h-4 w-4 mr-2" />
                            Sensors Information
                        </h3>
                        <ul className="text-sm space-y-1">
                            <li className="flex items-center text-muted-foreground">
                                <TagIcon className="h-3.5 w-3.5 mr-2" />
                                <span className="font-medium mr-1">Active sensors:</span>
                                {device.sensors?.length || 0}
                            </li>
                        </ul>
                    </div>

                    {/* Firmware Information */}
                    <FirmwareInformation deviceId={device.id} firmware={firmware} />
                </div>
            </CardContent>
        </Card>
    );
}
