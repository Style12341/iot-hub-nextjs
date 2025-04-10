"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DeviceGroupSelector } from "./DeviceGroupSelector";
import { DateTimeRangeSelector } from "@/components/DateTimeRangeSelector";
import { SensorSelector } from "./SensorSelector";
import { SyncedChartGroup } from "./SyncronizedChartGroup";
import { getDeviceGroupsWithSensorsAction } from "@/app/actions/deviceActions";
import { getSensorValuesAction } from "@/app/actions/sensorValuesActions";
import { DeviceGroupsWithSensorsIds } from "@/lib/contexts/deviceContext";
import { Device } from "@prisma/client";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type SensorDataExplorerProps = {
    initialDevices: (Device & { View: { name: string } | null })[];
};

export function SensorDataExplorer({ initialDevices }: SensorDataExplorerProps) {
    // State for selections
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
    const [deviceGroups, setDeviceGroups] = useState<DeviceGroupsWithSensorsIds | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [selectedSensorIds, setSelectedSensorIds] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        end: new Date()
    });
    const [sensorData, setSensorData] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Fetch device groups when device selection changes
    useEffect(() => {
        if (!selectedDeviceId) return;

        async function fetchDeviceGroups() {
            setIsLoading(true);
            try {
                const response = await getDeviceGroupsWithSensorsAction(selectedDeviceId);
                if (response.success) {
                    setDeviceGroups(response.data);
                    // Auto-select first group if available
                    if (response.data.Groups.length > 0) {
                        setSelectedGroupId(response.data.Groups[0].id);
                    } else {
                        setSelectedGroupId("");
                    }
                    // Reset sensor selection
                    setSelectedSensorIds([]);
                    // Clear sensor data when changing device
                    setSensorData({});
                }
            } catch (error) {
                console.error("Failed to fetch device groups:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchDeviceGroups();
    }, [selectedDeviceId]);

    // Fetch sensor data (now only called by button click)
    const fetchSensorData = async () => {
        if (!selectedGroupId || selectedSensorIds.length === 0) return;

        setIsLoading(true);
        try {
            // Get group sensor IDs for the selected sensors
            const groupSensorIds = selectedSensorIds;

            if (groupSensorIds.length === 0) return;

            const response = await getSensorValuesAction(
                groupSensorIds,
                dateRange.start,
                dateRange.end
            );

            if (response.success) {
                setSensorData(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch sensor data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to check if update is possible
    const canUpdate = selectedDeviceId && selectedGroupId && selectedSensorIds.length > 0;

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DeviceGroupSelector
                            devices={initialDevices}
                            selectedDeviceId={selectedDeviceId}
                            onDeviceChange={setSelectedDeviceId}
                            deviceGroups={deviceGroups}
                            selectedGroupId={selectedGroupId}
                            onGroupChange={setSelectedGroupId}
                            isLoading={isLoading}
                        />

                        <SensorSelector
                            deviceGroups={deviceGroups}
                            selectedGroupId={selectedGroupId}
                            selectedSensorIds={selectedSensorIds}
                            onSensorChange={setSelectedSensorIds}
                            isLoading={isLoading}
                        />

                        <DateTimeRangeSelector
                            dateRange={dateRange}
                            onDateRangeChange={setDateRange}
                            onApply={fetchSensorData}
                        />
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button
                            onClick={fetchSensorData}
                            disabled={!canUpdate || isLoading}
                            className="w-full sm:w-auto"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {isLoading ? "Loading..." : "Update Charts"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            <SyncedChartGroup
                sensorData={sensorData}
                isLoading={isLoading}
            />
        </div>
    );
}