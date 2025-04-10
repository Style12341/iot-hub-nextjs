"use client";

import { DeviceGroupsWithSensorsIds } from "@/lib/contexts/deviceContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

type SensorSelectorProps = {
    deviceGroups: DeviceGroupsWithSensorsIds | null;
    selectedGroupId: string;
    selectedSensorIds: string[];
    onSensorChange: (sensorIds: string[]) => void;
    isLoading: boolean;
};

export function SensorSelector({
    deviceGroups,
    selectedGroupId,
    selectedSensorIds,
    onSensorChange,
    isLoading
}: SensorSelectorProps) {
    // Get sensors for the selected group
    const sensors = deviceGroups?.Groups
        .find(g => g.id === selectedGroupId)
        ?.sensor || [];

    const handleSensorToggle = (groupSensorId: string, checked: boolean) => {
        if (checked) {
            onSensorChange([...selectedSensorIds, groupSensorId]);
        } else {
            onSensorChange(selectedSensorIds.filter(id => id !== groupSensorId));
        }
    };

    const handleSelectAll = () => {
        if (selectedSensorIds.length === sensors.length) {
            // If all are selected, deselect all
            onSensorChange([]);
        } else {
            // Otherwise, select all
            onSensorChange(sensors.map(s => s.groupSensorId));
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>Sensors</Label>
                {sensors.length > 0 && (
                    <button
                        onClick={handleSelectAll}
                        className="text-xs text-primary hover:underline"
                        disabled={isLoading}
                    >
                        {selectedSensorIds.length === sensors.length ? "Deselect All" : "Select All"}
                    </button>
                )}
            </div>

            <Card className="h-[200px]">
                <CardContent className="p-3">
                    {isLoading && !deviceGroups ? (
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                        </div>
                    ) : sensors.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            {selectedGroupId ? "No sensors in this group" : "Select a group first"}
                        </div>
                    ) : (
                        <ScrollArea className="h-[184px] pr-4">
                            <div className="space-y-2">
                                {sensors.map((sensor) => (
                                    <div key={sensor.groupSensorId} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`sensor-${sensor.groupSensorId}`}
                                            checked={selectedSensorIds.includes(sensor.groupSensorId)}
                                            onCheckedChange={(checked) =>
                                                handleSensorToggle(sensor.groupSensorId, checked === true)
                                            }
                                            disabled={isLoading}
                                        />
                                        <Label
                                            htmlFor={`sensor-${sensor.groupSensorId}`}
                                            className="text-sm font-normal cursor-pointer"
                                        >
                                            {sensor.name} ({sensor.unit})
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}