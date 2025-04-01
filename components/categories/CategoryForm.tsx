"use client";
import { CreateCategoryFormData, createCategoryFormSchema, ServerActionResponse } from "@/types/types";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { Form, FormDescription, FormField, FormItem, FormMessage, FormControl, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SensorCategory } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

// Color presets for quick selection
const colorPresets = [
    "#FF5733", // Red-orange (Temperature)
    "#337DFF", // Blue (Humidity)
    "#33FF57", // Green (CO2/Air Quality)
    "#FFC733", // Yellow (Light)
    "#D433FF", // Purple (Velocity)
    "#FF33A8", // Pink (Pressure)
    "#33FFF6", // Cyan (Water)
    "#FFB733", // Orange (Energy)
    "#75C2C6", // Teal (Default)
    "#A0A0A0", // Gray
];

type CategoryFormProps = {
    categoryAction: (formData: CreateCategoryFormData) => Promise<ServerActionResponse>;
    addCategory?: (category: SensorCategory) => void;
    onUpdate?: (category: SensorCategory) => void;
    initialData?: SensorCategory | null; // New prop for edit mode
    redirect?: boolean;
    formAttributes?: React.FormHTMLAttributes<HTMLFormElement>; // For dialog integration
}

export default function CategoryForm({
    addCategory,
    onUpdate,
    categoryAction,
    initialData = null, // Default to null (create mode)
    redirect: standalone = false,
    formAttributes = {}
}: CategoryFormProps) {
    const { user } = useUser();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const userId = user?.id;

    // Determine if we're in edit mode
    const isEditMode = !!initialData;

    const formMethods = useForm<CreateCategoryFormData>({
        resolver: zodResolver(createCategoryFormSchema),
        defaultValues: {
            name: initialData?.name || "",
            userId: userId || "default",
            color: initialData?.color || "#75C2C6" // Use existing color or default
        }
    });

    // Get the current color value from the form
    const currentColor = formMethods.watch("color");

    // State to manage custom color input
    const [customColor, setCustomColor] = useState(currentColor);

    // Update custom color when form color changes (e.g. when preset is selected)
    useEffect(() => {
        setCustomColor(currentColor);
    }, [currentColor]);

    // If userId changes, update the form value
    useEffect(() => {
        if (userId) {
            formMethods.setValue("userId", userId);
        }
    }, [userId, formMethods]);

    // If initialData changes (e.g. in a dialog), update the form
    useEffect(() => {
        if (initialData) {
            formMethods.reset({
                name: initialData.name,
                userId: initialData.userId || userId || "default",
                color: initialData.color || "#75C2C6"
            });
            setCustomColor(initialData.color || "#75C2C6");
        }
    }, [initialData, formMethods, userId]);

    function handleSubmit(data: CreateCategoryFormData) {
        startTransition(async () => {
            try {
                // If in edit mode, add the category ID to the data
                const submitData = isEditMode
                    ? { ...data, id: initialData.id }
                    : data;

                const result = await categoryAction(submitData);

                if (result.success) {
                    const successMessage = isEditMode
                        ? "Category updated successfully"
                        : "Category created successfully";

                    toast.success(successMessage);

                    if (!isEditMode) {
                        formMethods.reset(); // Only reset in create mode
                    }

                    if (typeof addCategory === "function" && !isEditMode && result.data) {
                        const category = result.data as SensorCategory;
                        addCategory(category);
                    }

                    if (typeof onUpdate === "function" && isEditMode && result.data) {
                        const category = result.data as SensorCategory;
                        onUpdate(category);
                    }

                    if (standalone) {
                        router.push("/dashboard/categories");
                    }
                } else {
                    const actionType = isEditMode ? "update" : "create";
                    toast.error(`Failed to ${actionType} category`, { description: result.message });
                }
            } catch (error) {
                toast.error("An unexpected error occurred", {
                    description: error instanceof Error ? error.message : "Please try again"
                });
            }
        });
    }

    return (
        <FormProvider {...formMethods}>
            <form
                {...formAttributes}
                onSubmit={(e) => {
                    // Handle custom onSubmit from formAttributes if provided
                    if (formAttributes.onSubmit) formAttributes.onSubmit(e);
                    if (!e.defaultPrevented) formMethods.handleSubmit(handleSubmit)(e);
                }}
                className="space-y-8"
            >
                {/* Hidden form field for userID */}
                <input type="hidden" {...formMethods.register("userId")} />

                {/* Only include ID field if editing */}
                {isEditMode && initialData?.id && (
                    <input type="hidden" name="id" value={initialData.id} />
                )}

                <FormField
                    control={formMethods.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Temperature" {...field} />
                            </FormControl>
                            <FormDescription>
                                Give your category a recognizable name
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={formMethods.control}
                    name="color"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category Color</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-between",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-4 w-4 rounded-full"
                                                    style={{ backgroundColor: field.value }}
                                                />
                                                {field.value}
                                            </div>
                                            <ChevronDownIcon className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium">Color presets</h4>
                                            <div className="grid grid-cols-5 gap-2">
                                                {colorPresets.map((color) => (
                                                    <div
                                                        key={color}
                                                        className={cn(
                                                            "h-8 w-8 rounded-full cursor-pointer border",
                                                            field.value === color && "ring-2 ring-primary ring-offset-2"
                                                        )}
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => {
                                                            field.onChange(color);
                                                            setCustomColor(color);
                                                        }}
                                                    >
                                                        {field.value === color && (
                                                            <CheckIcon className="h-4 w-4 text-white m-auto translate-y-[8px]" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-medium">Custom color</h4>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-8 w-8 rounded-full"
                                                    style={{ backgroundColor: customColor }}
                                                />
                                                <Input
                                                    value={customColor}
                                                    onChange={(e) => {
                                                        setCustomColor(e.target.value);
                                                        // Only update form value if it's a valid hex color
                                                        if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)) {
                                                            field.onChange(e.target.value);
                                                        }
                                                    }}
                                                    placeholder="#RRGGBB"
                                                    className="flex-1"
                                                />
                                            </div>
                                            <input
                                                type="color"
                                                value={customColor}
                                                onChange={(e) => {
                                                    setCustomColor(e.target.value);
                                                    field.onChange(e.target.value);
                                                }}
                                                className="w-full h-8 rounded-md cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                Choose a color to represent this category on charts and dashboards
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isPending}>
                    {isPending
                        ? isEditMode ? "Updating..." : "Creating..."
                        : isEditMode ? "Update Category" : "Create Category"
                    }
                </Button>
            </form>
        </FormProvider>
    );
}