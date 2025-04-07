"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createGroupAction, getDeviceSensorsAction, updateGroupAction } from "@/app/actions/groupActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Group, Sensor } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Form schema
const groupFormSchema = z.object({
    name: z.string().min(1, "Group name is required").max(100),
    activeSensorIds: z.array(z.string()).optional(),
});

type GroupFormData = z.infer<typeof groupFormSchema>;

interface SensorWithActiveStatus extends Sensor {
    isActive: boolean;
}

interface GroupFormProps {
    deviceId: string;
    group?: Group;
    onSuccess?: (group: Group, sensorCount: number) => void;
    isDialog?: boolean;
}

export function GroupForm({ deviceId, group, onSuccess, isDialog = false }: GroupFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingSensors, setLoadingSensors] = useState(true);
    const [sensors, setSensors] = useState<SensorWithActiveStatus[]>([]);
    const isEditing = !!group;

    const form = useForm<GroupFormData>({
        resolver: zodResolver(groupFormSchema),
        defaultValues: {
            name: group?.name || "",
            activeSensorIds: [],
        },
    });

    // Fetch device sensors when component mounts
    useEffect(() => {
        async function fetchSensors() {
            try {
                setLoadingSensors(true);
                const result = await getDeviceSensorsAction(deviceId, group?.id);

                if (result.success && result.data) {
                    setSensors(result.data.map(sensor => ({
                        ...sensor,
                        isActive: sensor.isActive || false
                    })));

                    // Set active sensor IDs in form
                    const activeSensorIds = result.data
                        .filter(sensor => sensor.isActive)
                        .map(sensor => sensor.id);

                    form.setValue('activeSensorIds', activeSensorIds);
                } else {
                    toast.error("Failed to load sensors");
                }
            } catch (error) {
                console.error("Error fetching sensors:", error);
                toast.error("Failed to load sensors");
            } finally {
                setLoadingSensors(false);
            }
        }

        fetchSensors();
    }, [deviceId, group, form]);

    async function onSubmit(data: GroupFormData) {
        setIsSubmitting(true);
        try {
            const activeSensorIds = data.activeSensorIds || [];

            const result = isEditing
                ? await updateGroupAction(deviceId, group.id, data.name, activeSensorIds)
                : await createGroupAction(deviceId, data.name, activeSensorIds);

            if (result.success) {
                toast.success(isEditing ? "Group updated successfully" : "Group created successfully");

                if (onSuccess && result.data) {
                    onSuccess(result.data, activeSensorIds.length);
                } else if (!isDialog) {
                    router.push(`/dashboard/devices/${deviceId}/groups`);
                    router.refresh();
                }
            } else {
                toast.error(result.message || "Failed to save group");
            }
        } catch (error) {
            console.error("Error saving group:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    }

    // Toggle all sensors
    const handleToggleAll = (checked: boolean) => {
        const newActiveSensorIds = checked
            ? sensors.map(sensor => sensor.id)
            : [];

        form.setValue('activeSensorIds', newActiveSensorIds);
    };

    const watchActiveSensorIds = form.watch('activeSensorIds') || [];
    const allSelected = sensors.length > 0 && watchActiveSensorIds.length === sensors.length;
    const someSelected = watchActiveSensorIds.length > 0 && watchActiveSensorIds.length < sensors.length;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Group Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Sensors Group" {...field} />
                            </FormControl>
                            <FormDescription>
                                Give your group a descriptive name for organizing sensors
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <div>
                        <FormLabel>Active Sensors</FormLabel>
                        <FormDescription>
                            Select which sensors should be active in this group
                        </FormDescription>
                    </div>

                    <Card>
                        <CardContent className="">
                            {loadingSensors ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : sensors.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No sensors found for this device
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="select-all"
                                            checked={allSelected}
                                            ref={(input) => {
                                                const checkboxInput = input as HTMLInputElement | null;
                                                if (checkboxInput) {
                                                    (checkboxInput).indeterminate = someSelected && !allSelected;
                                                }
                                            }}
                                            onCheckedChange={handleToggleAll}
                                        />
                                        <label
                                            htmlFor="select-all"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {allSelected ? "Deselect all" : "Select all"}
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <FormField
                                            control={form.control}
                                            name="activeSensorIds"
                                            render={() => (
                                                <>
                                                    {sensors.map((sensor) => (
                                                        <FormField
                                                            key={sensor.id}
                                                            control={form.control}
                                                            name="activeSensorIds"
                                                            render={({ field }) => {
                                                                return (
                                                                    <FormItem
                                                                        key={sensor.id}
                                                                        className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                                                    >
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(sensor.id)}
                                                                                onCheckedChange={(checked) => {
                                                                                    const currentValues = [...(field.value || [])];

                                                                                    if (checked) {
                                                                                        field.onChange([...currentValues, sensor.id]);
                                                                                    } else {
                                                                                        field.onChange(
                                                                                            currentValues.filter(value => value !== sensor.id)
                                                                                        );
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <div className="space-y-1 leading-none">
                                                                            <FormLabel className="font-medium">
                                                                                {sensor.name}
                                                                            </FormLabel>
                                                                            <FormDescription className="text-xs">
                                                                                {sensor.unit}
                                                                            </FormDescription>
                                                                        </div>
                                                                    </FormItem>
                                                                );
                                                            }}
                                                        />
                                                    ))}
                                                </>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Button type="submit" disabled={isSubmitting || loadingSensors}>
                    {isSubmitting
                        ? isEditing ? "Updating..." : "Creating..."
                        : isEditing ? "Update Group" : "Create Group"
                    }
                </Button>
            </form>
        </Form>
    );
}