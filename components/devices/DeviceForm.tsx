"use client";

import { CreateDeviceFormData, createDeviceFormSchema } from "@/types/types";
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
import { useTransition } from "react";
import { toast } from "sonner";

// Props type for the component
type DeviceFormProps = {
    categories: { id: string; name: string }[];
    createDeviceAction: (formData: CreateDeviceFormData) => Promise<{ success: boolean; message: string }>;
}

export default function DeviceForm({ categories, createDeviceAction }: DeviceFormProps) {
    const { user } = useUser();
    const userId
        = user?.id
    const [isPending, startTransition] = useTransition();

    const form = useForm<CreateDeviceFormData>({
        resolver: zodResolver(createDeviceFormSchema),
        defaultValues: {
            name: "",
            userId: userId || "",
            sensors: [{ name: "", unit: "", categoryId: "" }],
            group: { name: "Default" }
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "sensors",
    });

    function handleSubmit(data: CreateDeviceFormData) {
        startTransition(async () => {
            const result = await createDeviceAction(data);

            if (result.success) {
                toast.success("Device created successfully");
                form.reset();
            } else {
                toast.error("Failed to create device", { description: result.message, });
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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

                    {fields.map((field, index) => (
                        <div key={field.id} className="space-y-4 p-4 border rounded-md">
                            <div className="flex items-center justify-between">
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

                            <FormField
                                control={form.control}
                                name={`sensors.${index}.name`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sensor Name</FormLabel>
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
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((category) => (
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
                    ))}
                </div>

                <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : "Create Device"}
                </Button>
            </form>
        </Form>
    );
}