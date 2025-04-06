"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sensor, SensorCategory, Group } from "@prisma/client";
import { useRouter } from "next/navigation";
import { createSensorAction, updateSensorAction } from "@/app/actions/sensorActions";
import { getDeviceGroupsAction } from "@/app/actions/groupActions";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SensorWithActiveGroupCount } from "@/lib/contexts/deviceContext";

// Define the schema for form validation
const sensorFormSchema = z.object({
  name: z.string().min(1, "Sensor name is required").max(100),
  unit: z.string().min(1, "Unit is required").max(50),
  categoryId: z.string().min(1, "Category is required"),
  activeGroupIds: z.array(z.string()).default([])
});

type SensorFormData = z.infer<typeof sensorFormSchema>;

interface GroupWithSensorCount {
  id: string;
  name: string;
  sensorCount: number;
  createdAt: Date;
}

interface SensorFormProps {
  deviceId: string;
  sensor?: SensorWithActiveGroupCount;
  categories: SensorCategory[];
  onSuccess?: (sensor: Sensor, activeGroups: number) => void;
  isDialog?: boolean;
}

export function SensorForm({ deviceId, sensor, categories, onSuccess, isDialog = false }: SensorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groups, setGroups] = useState<GroupWithSensorCount[]>([]);
  const isEditing = !!sensor;

  const form = useForm<SensorFormData>({
    resolver: zodResolver(sensorFormSchema),
    defaultValues: {
      name: sensor?.name || "",
      unit: sensor?.unit || "",
      categoryId: sensor?.categoryId || "",
      activeGroupIds: []
    }
  });

  // Fetch device groups when component mounts
  useEffect(() => {
    async function fetchGroups() {
      try {
        setLoadingGroups(true);
        const response = await getDeviceGroupsAction(deviceId);

        if (response.success && response.data) {
          setGroups(response.data.groups);

          // If editing, set active groups based on GroupSensor data
          if (isEditing && sensor?.GroupSensor) {
            const activeGroupIds = sensor.GroupSensor
              .filter(gs => gs.active)
              .map(gs => gs.groupId);

            form.setValue('activeGroupIds', activeGroupIds);
          } else {
            // For new sensors, default to all groups active
            form.setValue('activeGroupIds', response.data.groups.map(g => g.id));
          }
        } else {
          toast.error("Failed to load device groups");
        }
      } catch (error) {
        console.error("Error fetching device groups:", error);
        toast.error("Failed to load device groups");
      } finally {
        setLoadingGroups(false);
      }
    }

    fetchGroups();
  }, [deviceId, sensor, form, isEditing]);

  // Function to handle form submission
  async function onSubmit(data: SensorFormData) {
    if (isEditing && (data.unit !== sensor?.unit || data.categoryId !== sensor?.categoryId)) {
      // If unit or category changed, show warning
      setShowWarning(true);
    } else {
      // If no warning needed, process normally
      await handleSubmitData(data);
    }
  }

  // Function to handle actual data submission after warning (if any)
  async function handleSubmitData(data: SensorFormData) {
    setIsSubmitting(true);
    try {
      const result = isEditing
        ? await updateSensorAction(deviceId, sensor.id, {
          name: data.name,
          unit: data.unit,
          categoryId: data.categoryId,
          activeGroupIds: data.activeGroupIds
        })
        : await createSensorAction(deviceId, {
          name: data.name,
          unit: data.unit,
          categoryId: data.categoryId,
          activeGroupIds: data.activeGroupIds
        });

      if (result.success) {
        toast.success(isEditing ? "Sensor updated successfully" : "Sensor created successfully");

        if (onSuccess && result.data) {
          onSuccess(result.data, data.activeGroupIds.length);
        } else if (!isDialog) {
          router.push(`/dashboard/devices/${deviceId}/sensors`);
          router.refresh();
        }
      } else {
        toast.error(result.message || "Failed to save sensor");
      }
    } catch (error) {
      console.error("Error saving sensor:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
      setShowWarning(false);
    }
  }

  // Toggle all groups
  const handleToggleAll = (checked: boolean) => {
    const newActiveGroupIds = checked
      ? groups.map(group => group.id)
      : [];

    form.setValue('activeGroupIds', newActiveGroupIds);
  };

  const watchActiveGroupIds = form.watch('activeGroupIds') || [];
  const allSelected = groups.length > 0 && watchActiveGroupIds.length === groups.length;
  const someSelected = watchActiveGroupIds.length > 0 && watchActiveGroupIds.length < groups.length;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sensor Name</FormLabel>
                <FormControl>
                  <Input placeholder="Temperature" {...field} />
                </FormControl>
                <FormDescription>
                  Name of the sensor (e.g., Temperature, Humidity)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input placeholder="°C" {...field} />
                </FormControl>
                <FormDescription>
                  The unit of measurement for this sensor (e.g., °C, %, ppm)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose a category for this sensor
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Active Groups Selection */}
          <div className="space-y-4">
            <div>
              <FormLabel>Active Groups</FormLabel>
              <FormDescription>
                Select which groups this sensor should be active in
              </FormDescription>
            </div>

            <Card>
              <CardContent className="">
                {loadingGroups ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No groups found for this device
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all-groups"
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
                        htmlFor="select-all-groups"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {allSelected ? "Deselect all groups" : "Select all groups"}
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="activeGroupIds"
                        render={() => (
                          <>
                            {groups.map((group) => (
                              <FormField
                                key={group.id}
                                control={form.control}
                                name="activeGroupIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={group.id}
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(group.id)}
                                          onCheckedChange={(checked) => {
                                            const currentValues = [...(field.value || [])];

                                            if (checked) {
                                              field.onChange([...currentValues, group.id]);
                                            } else {
                                              field.onChange(
                                                currentValues.filter(value => value !== group.id)
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="font-medium">
                                          {group.name}
                                        </FormLabel>
                                        <FormDescription className="text-xs">
                                          {group.sensorCount} {group.sensorCount === 1 ? 'sensor' : 'sensors'}
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

          <Button type="submit" disabled={isSubmitting || loadingGroups}>
            {isSubmitting
              ? isEditing ? "Updating..." : "Creating..."
              : isEditing ? "Update Sensor" : "Create Sensor"
            }
          </Button>
        </form>
      </Form>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Changing Sensor Metadata</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change the unit or category for this sensor.
              This change will affect all historical data for this sensor.
              All previous values will be displayed with the new unit and category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleSubmitData(form.getValues())}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}