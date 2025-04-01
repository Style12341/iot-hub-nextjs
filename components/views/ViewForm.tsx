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
import { createViewAction } from "@/app/actions/viewActions";
import { DeviceWithViewPaginated } from "@/lib/contexts/deviceContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { getDevicesListWithDataAction } from "@/app/actions/deviceActions";

type ViewFormProps = {
    addView?: (view: View) => void;
    create: boolean;
    formAttributes?: React.FormHTMLAttributes<HTMLFormElement>; // Add this line
    viewAction?: (formData: CreateViewFormData) => Promise<ServerActionResponse>; // Make this optional
};

export default function ViewForm({
    addView,
    create,
    formAttributes = {}, // Default to empty object
    viewAction = createViewAction // Default to the imported action
}: ViewFormProps) {
    const router = useRouter();
    const { user } = useUser();
    const [isPending, startTransition] = useTransition();
    const [devices, setDevices] = useState<DeviceWithViewPaginated>({ devices: [], count: 0, page: 0, maxPage: 1 });
    const userId = user?.id;
    useEffect(() => {
        const fetchDevices = async () => {
            const res = await getDevicesListWithDataAction();
            if (!res.success) {
                toast.error("Failed to fetch devices");
                return;
            }
            setDevices(res.data);
        }
        fetchDevices();
    }, []);

    // Group devices by their current view
    const devicesByView = devices.devices.reduce((acc, device) => {
        if (!device) return acc;

        const viewName = device.View?.name || 'No View';
        if (!acc[viewName]) {
            acc[viewName] = [];
        }
        acc[viewName].push(device);
        return acc;
    }, {} as Record<string, any[]>);

    const formMethods = useForm<CreateViewFormData>({
        resolver: zodResolver(createViewFormSchema),
        defaultValues: {
            name: "",
            userId: userId || "default",
            devicesIdsToTransfer: [],
        }
    });

    function handleSubmit(data: CreateViewFormData) {
        startTransition(async () => {
            try {
                const result = await viewAction(data); // Use the passed viewAction
                if (result.success) {
                    toast.success("View created successfully");
                    formMethods.reset();
                    if (typeof addView === "function" && result.data) {
                        const view = result.data as View;
                        addView(view);
                    }
                    router.push("/dashboard/views");
                } else {
                    toast.error("Failed to create view", { description: result.message });
                }
            } catch (error) {
                toast.error("An unexpected error occurred", {
                    description: error instanceof Error ? error.message : "Please try again"
                });
            }
        });
    }

    return (<>
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold mb-6">Create a new View</h1>
        </div>
        <FormProvider {...formMethods}>
            <Form {...formMethods}>
                {/* Apply formAttributes to prevent form nesting issues */}
                <form
                    {...formAttributes}
                    onSubmit={(e) => {
                        if (formAttributes.onSubmit) formAttributes.onSubmit(e);
                        if (!e.defaultPrevented) formMethods.handleSubmit(handleSubmit)(e);
                    }}
                    className="space-y-8"
                >
                    <input type="hidden" {...formMethods.register("userId")} />

                    <FormField
                        control={formMethods.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>View Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Living Room" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Give your view a recognizable name
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {devices.count > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Select devices to transfer to this view</h3>
                            <p className="text-sm text-muted-foreground">
                                Devices will be moved from their current view to this new view
                            </p>

                            <div className="space-y-6">
                                {Object.entries(devicesByView).map(([viewName, viewDevices]) => (
                                    <Card key={viewName} className="overflow-hidden">
                                        <CardHeader className="bg-muted/50 py-3">
                                            <CardTitle className="text-sm font-medium flex items-center">
                                                <span>Current View:</span>
                                                <Badge variant="outline" className="ml-2">
                                                    {viewName}
                                                </Badge>
                                                <span className="ml-auto text-muted-foreground">
                                                    {viewDevices.length} {viewDevices.length === 1 ? 'device' : 'devices'}
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <FormField
                                                control={formMethods.control}
                                                name="devicesIdsToTransfer"
                                                render={({ field }) => (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {viewDevices.map((device) => (
                                                            <FormItem
                                                                key={device.id}
                                                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
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
                                                                <FormLabel className="cursor-pointer font-normal">
                                                                    {device.name}
                                                                </FormLabel>
                                                            </FormItem>
                                                        ))}
                                                    </div>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Creating..." : "Create View"}
                    </Button>
                </form>
            </Form>
        </FormProvider>
    </>
    );
}