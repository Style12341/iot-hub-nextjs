"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { updateDeviceAction, deleteDeviceAction } from "@/app/actions/deviceActions";

// Form schema
const deviceFormSchema = z.object({
  name: z.string().min(1, "Device name is required").max(100),
  viewId: z.string().min(1, "View is required"),
});

// Delete confirmation schema
const deleteConfirmSchema = z.object({
  confirmName: z.string(),
});

interface DeviceSettingsFormProps {
  device: {
    id: string;
    name: string;
    viewId: string | null;
  };
  views: {
    id: string | null;
    name: string | null;
  }[];
}

export function DeviceSettingsForm({ device, views }: DeviceSettingsFormProps) {
  const router = useRouter();
  const [isUpdateSubmitting, setIsUpdateSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Main settings form
  const form = useForm<z.infer<typeof deviceFormSchema>>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: device.name,
      viewId: device.viewId || "",
    },
  });

  // Handle device update
  async function onSubmit(values: z.infer<typeof deviceFormSchema>) {
    setIsUpdateSubmitting(true);
    try {
      const result = await updateDeviceAction(device.id, {
        name: values.name,
        viewId: values.viewId,
      });

      if (result.success) {
        toast.success("Device updated successfully");
        router.refresh();
      } else {
        toast.error("Failed to update device", { description: result.message });
      }
    } catch (error) {
      console.error("Error updating device:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdateSubmitting(false);
    }
  }

  // Handle device deletion
  async function handleDelete() {
    if (deleteConfirmName !== device.name) {
      toast.error("Device name doesn't match");
      return;
    }

    setIsDeleteSubmitting(true);
    try {
      const result = await deleteDeviceAction(device.id);

      if (result.success) {
        toast.success("Device deleted successfully");
        router.push("/dashboard/devices");
      } else {
        toast.error("Failed to delete device", { description: result.message });
      }
    } catch (error) {
      console.error("Error deleting device:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleteSubmitting(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Device Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Device Information</CardTitle>
          <CardDescription>
            Edit your device's basic information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="settings-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Device" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the display name for your device
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="viewId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>View</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a view" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {views.map((view) => (
                          <SelectItem key={view.id} value={view.id || ""}>
                            {view.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose which view this device should appear in
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            form="settings-form"
            disabled={isUpdateSubmitting}
          >
            {isUpdateSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-destructive">
        <CardHeader className="border-b border-destructive/20">
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Delete this device</h4>
              <p className="text-sm text-muted-foreground">
                This will permanently delete the device and all associated data.
                This action cannot be undone.
              </p>
            </div>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Device</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <div className="space-y-4">
                      <p>
                        This action will permanently delete the device, along with:
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>All sensors associated with this device</li>
                        <li>All groups and their configurations</li>
                        <li>All historical sensor data</li>
                        <li>All firmware files</li>
                      </ul>
                      <div className="border-l-4 border-destructive bg-destructive/10 p-3">
                        <p className="text-sm font-medium">This action cannot be undone.</p>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm font-medium pb-2">
                          To confirm, type the device name: <span className="font-bold">{device.name}</span>
                        </p>
                        <Input
                          value={deleteConfirmName}
                          onChange={(e) => setDeleteConfirmName(e.target.value)}
                          placeholder="Enter device name"
                          className="border-destructive focus-visible:ring-destructive"
                        />
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete();
                    }}
                    disabled={deleteConfirmName !== device.name || isDeleteSubmitting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleteSubmitting ? "Deleting..." : "Delete Device"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}