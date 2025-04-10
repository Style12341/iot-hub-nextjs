"use client";

import { CreateViewFormData, createViewFormSchema, ServerActionResponse } from "@/types/types";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl, FormDescription } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { View } from "@prisma/client";
import { useRouter } from "next/navigation";
import { createViewAction, updateViewAction } from "@/app/actions/viewActions";
import { DeviceWithViewPaginated } from "@/lib/contexts/deviceContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { getDevicesListWithDataAction } from "@/app/actions/deviceActions";
import { z } from "zod";
import { Separator } from "../ui/separator";

// Extended schema for edit mode
const viewFormSchema = z.object({
    id: z.string().optional(), // Only needed for edit mode
    name: z.string().min(1, "View name is required"),
    userId: z.string().min(1, "User ID is required"),
    devicesIdsToTransfer: z.array(z.string()).default([])
});

type ViewFormData = z.infer<typeof viewFormSchema>;

type ViewFormProps = {
    onSubmit?: (view: View) => void;
    create: boolean;
    initialData?: View | null; // Add initialData for edit mode
    redirect?: boolean;
    formAttributes?: React.FormHTMLAttributes<HTMLFormElement>;
};

export default function ViewForm({
    onSubmit,
    create,
    initialData = null,
    redirect = false,
    formAttributes = {}
}: ViewFormProps) {
    const router = useRouter();
    const { user } = useUser();
    const [isPending, startTransition] = useTransition();
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [devices, setDevices] = useState<DeviceWithViewPaginated>({ devices: [], count: 0, page: 0, maxPage: 1 });
    const userId = user?.id;

    useEffect(() => {
        const fetchDevices = async () => {
            setLoadingDevices(true);
            try {
                const res = await getDevicesListWithDataAction();
                if (!res.success) {
                    toast.error("Failed to fetch devices");
                    return;
                }
                setDevices(res.data);
            } catch (error) {
                console.error("Error fetching devices:", error);
                toast.error("Failed to load devices");
            } finally {
                setLoadingDevices(false);
            }
        };

        fetchDevices();
    }, []);

    // Form setup
    const form = useForm<ViewFormData>({
        resolver: zodResolver(viewFormSchema),
        defaultValues: {
            id: initialData?.id || undefined,
            name: initialData?.name || "",
            userId: userId || "default",
            devicesIdsToTransfer: [],
        }
    });

    // Group devices by their current view, filtering out devices already in this view when editing
    const devicesByView = devices.devices.reduce((acc, device) => {
        if (!device) return acc;

        // When editing, skip devices that are already in this view
        if (!create && initialData && device.View?.id === initialData.id) {
            return acc;
        }

        const viewName = device.View?.name || 'No View';
        if (!acc[viewName]) {
            acc[viewName] = [];
        }
        acc[viewName].push(device);
        return acc;
    }, {} as Record<string, any[]>);

    function onFormSubmit(data: ViewFormData) {
        startTransition(async () => {
            try {
                const result = create
                    ? await createViewAction({
                        name: data.name,
                        userId: data.userId,
                        devicesIdsToTransfer: data.devicesIdsToTransfer
                    })
                    : await updateViewAction({
                        id: initialData!.id,
                        name: data.name,
                        userId: data.userId,
                        devicesIdsToTransfer: data.devicesIdsToTransfer
                    });

                if (result.success) {
                    toast.success(create ? "View created successfully" : "View updated successfully");
                    form.reset();
                    if (typeof onSubmit === "function" && result.data) {
                        onSubmit(result.data as View);
                    }
                    if (redirect) {
                        router.push("/dashboard/views");
                        router.refresh();
                    }
                } else {
                    toast.error(create ? "Failed to create view" : "Failed to update view", {
                        description: result.message
                    });
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                toast.error("An unexpected error occurred", {
                    description: error instanceof Error ? error.message : "Please try again"
                });
            }
        });
    }

    return (
        <>
            <FormProvider {...form}>
                <Form {...form}>
                    <form
                        {...formAttributes}
                        onSubmit={(e) => {
                            if (formAttributes.onSubmit) formAttributes.onSubmit(e);
                            if (!e.defaultPrevented) form.handleSubmit(onFormSubmit)(e);
                        }}
                        className="space-y-8"
                    >
                        <input type="hidden" {...form.register("userId")} />
                        {!create && <input type="hidden" {...form.register("id")} />}

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-medium">View Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Living Room" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        {create
                                            ? "Give your view a recognizable name"
                                            : "Update your view's name"}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {Object.keys(devicesByView).length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">
                                    {create
                                        ? "Select devices to transfer to this view"
                                        : "Select additional devices to transfer to this view"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Devices will be moved from their current view to {create ? "this new view" : "this view"}
                                </p>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {Object.entries(devicesByView).map(([viewName, viewDevices]) => (
                                        viewDevices.length > 0 && (
                                            <Card key={viewName} className="overflow-hidden">
                                                <CardHeader className="items-center">
                                                    <CardTitle className=" text-sm font-medium flex gap-2 justify-around items-center">
                                                        <Badge variant="outline" className="ml-2">
                                                            {viewName}
                                                        </Badge>
                                                        <span className="ml-auto text-muted-foreground">
                                                            {viewDevices.length} {viewDevices.length === 1 ? 'device' : 'devices'}
                                                        </span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <Separator></Separator>
                                                <CardContent className="">
                                                    <FormField
                                                        control={form.control}
                                                        name="devicesIdsToTransfer"
                                                        render={({ field }) => (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                {viewDevices.map((device) => (
                                                                    <FormItem
                                                                        key={device.id}
                                                                        className="flex items-center space-x-3"
                                                                    >
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                className="h-4 w-4"
                                                                                checked={field.value?.includes(device.id)}
                                                                                onCheckedChange={(checked) => {
                                                                                    const currentValues = [...(field.value || [])];
                                                                                    if (checked) {
                                                                                        field.onChange([...currentValues, device.id]);
                                                                                    } else {
                                                                                        field.onChange(
                                                                                            currentValues.filter((id) => id !== device.id)
                                                                                        );
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="cursor-pointer font-normal pl-2">
                                                                            {device.name}
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                ))}
                                                            </div>
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button type="submit" disabled={isPending || loadingDevices}>
                            {isPending
                                ? create ? "Creating..." : "Updating..."
                                : create ? "Create View" : "Update View"}
                        </Button>
                    </form>
                </Form>
            </FormProvider>
        </>
    );
}