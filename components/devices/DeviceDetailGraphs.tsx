"use client";

import { DeviceQueryResult, SensorValueQueryResult } from "@/lib/contexts/deviceContext";
import { useEffect, useState } from "react";
import { getDeviceViewWithActiveSensorsBetweenAction } from "@/app/actions/deviceActions";
import { subscribeToDeviceEvents } from "@/lib/sseUtils";
import SensorGraph from "./sensors/SensorGraph";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceSSEMessage } from "@/types/types";
import { ViewDeviceCard } from "./DeviceCard";

interface DeviceDetailGraphsProps {
    deviceId: string;
    view: string;
    initialData: DeviceQueryResult;
}

export default function DeviceDetailGraphs({
    deviceId,
    view = "Default",
    initialData
}: DeviceDetailGraphsProps) {

    return (
        <ViewDeviceCard {...initialData} />
    )
}