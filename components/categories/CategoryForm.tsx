"use client";
import { CreateCategoryFormData, createCategoryFormSchema, ServerActionResponse } from "@/types/types";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { FormDescription, FormField, FormItem, FormMessage, FormControl, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SensorCategory } from "@prisma/client";

type CategoryFormProps = {
    categoryAction: (formData: CreateCategoryFormData) => Promise<ServerActionResponse>;
    addCategory?: (category: SensorCategory) => void;
    create: boolean;
}

export default function CategoryForm({ addCategory, categoryAction, create }: CategoryFormProps) {
    const { user } = useUser();
    const [isPending, startTransition] = useTransition();
    const userId = user?.id;
    const formMethods = useForm<CreateCategoryFormData>({
        resolver: zodResolver(createCategoryFormSchema),
        defaultValues: {
            name: "",
            userId: userId || "default"
        }
    });

    function handleSubmit(data: CreateCategoryFormData) {
        startTransition(async () => {
            try {
                const result = await categoryAction(data);
                if (result.success) {
                    toast.success("Category created successfully");
                    formMethods.reset();
                    if (typeof addCategory === "function") {
                        const category = (await result.data) as SensorCategory;
                        addCategory(category);
                    }
                } else {
                    toast.error("Failed to create category", { description: result.message });
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
            <form onSubmit={formMethods.handleSubmit(handleSubmit)} className="space-y-8">
                {/* Hidden form field for userID */}
                <input type="hidden" {...formMethods.register("userId")} />
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
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : "Create Category"}
                </Button>
            </form>
        </FormProvider>
    )
}