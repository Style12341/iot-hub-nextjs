"use client";

import { CreateCategoryFormData, CreateDeviceFormData, createDeviceFormSchema, ServerActionResponse } from "@/types/types";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PlusCircle, Trash2 } from "lucide-react"
import { useUser } from "@clerk/nextjs";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import CategoryDialog from "../categories/CategoryDialog";
import { SensorCategory } from "@prisma/client";

// Props type for the component
type DeviceFormProps = {
    categories: { id: string; name: string }[];
    views: { id: string; name: string }[];
    deviceAction: (formData: CreateDeviceFormData) => Promise<ServerActionResponse>;
    categoryAction: (formData: CreateCategoryFormData) => Promise<ServerActionResponse>;
}

export default function DeviceForm({ views, categories, deviceAction, categoryAction }: DeviceFormProps) {
    const { user } = useUser();
    const userId = user?.id
    const [isPending, startTransition] = useTransition();
    const [categoriesState, setCategories] = useState(categories);
    const addCategory = (category: SensorCategory) => {
        setCategories((prevCategories) => [...prevCategories, category]);
    };
    const form = useForm<CreateDeviceFormData>({
        resolver: zodResolver(createDeviceFormSchema),
        defaultValues: {
            name: "",
            userId: userId || "default",
            sensors: [{ name: "", unit: "", categoryId: "" }],
            group: { name: "Default" },
            view: { id: views.find(v => v.name === "Default")?.id || "" },
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "sensors",
    });

    function handleSubmit(data: CreateDeviceFormData) {
        startTransition(async () => {
            try {
                const result = await deviceAction(data);

                if (result.success) {
                    toast.success("Device created successfully");
                    form.reset();
                } else {
                    toast.error("Failed to create device", { description: result.message });
                }
            } catch (error) {
                console.error("Error during form submission:", error);
                toast.error("An unexpected error occurred", {
                    description: error instanceof Error ? error.message : "Please try again"
                });
            }
        });
    }

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold mb-6">Create New Device</h1>
                <CategoryDialog create={true} categoryAction={categoryAction} addCategory={addCategory} />
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Device Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Temperature Monitor" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Give your device a recognizable name
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="group.name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Living Room" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Group for organizing this device's sensors
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* View Selection Dropdown */}
                        <FormField
                            control={form.control}
                            name="view.id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>View</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            // Find the selected view to get its name
                                            const selectedView = views.find(v => v.id === value);
                                            field.onChange(value);
                                            // Update the view name as well
                                            if (selectedView) {
                                                form.setValue("view.id", selectedView.id);
                                            }
                                        }}
                                        defaultValue={field.value || views.find(v => v.name === "Default")?.id || ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a view" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {views.map((view) => (
                                                <SelectItem key={view.id} value={view.id}>
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
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Sensors</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ name: "", unit: "", categoryId: "" })}
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Add Sensor
                            </Button>
                        </div>

                        {/* Rest of the form remains unchanged */}
                        <div className={`flex flex-wrap ${fields.length === 1 ? 'flex-col' : ''} gap-4`}>
                            {fields.map((field, index) => (
                                // Sensor fields remain the same
                                <div
                                    key={field.id}
                                    className={`p-4 border rounded-md flex flex-col ${fields.length === 1
                                        ? 'w-full'
                                        : fields.length === 2
                                            ? 'w-full sm:w-[calc(50%-8px)]'
                                            : 'w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]'
                                        }`}
                                >
                                    {/* Sensor field content remains the same */}
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium">Sensor {index + 1}</h4>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-3 flex-grow">
                                        {/* Rest of sensor fields remain unchanged */}
                                        <FormField
                                            control={form.control}
                                            name={`sensors.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Temperature" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`sensors.${index}.unit`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Unit</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="°C" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`sensors.${index}.categoryId`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select category" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {categoriesState.map((category) => (
                                                                <SelectItem key={category.id} value={category.id}>
                                                                    {category.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button type="submit" disabled={isPending} className="mt-6">
                        {isPending ? "Creating..." : "Create Device"}
                    </Button>
                </form>
            </Form>
        </>
    );
}