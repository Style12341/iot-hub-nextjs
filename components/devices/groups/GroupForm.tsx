"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createGroupAction, updateGroupAction } from "@/app/actions/groupActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Group } from "@prisma/client";

// Form schema
const groupFormSchema = z.object({
    name: z.string().min(1, "Group name is required").max(100),
});

type GroupFormData = z.infer<typeof groupFormSchema>;

interface GroupFormProps {
    deviceId: string;
    group?: Group;
    onSuccess?: (group: Group) => void;
    isDialog?: boolean;
}

export function GroupForm({ deviceId, group, onSuccess, isDialog = false }: GroupFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!group;

    const form = useForm<GroupFormData>({
        resolver: zodResolver(groupFormSchema),
        defaultValues: {
            name: group?.name || "",
        },
    });

    async function onSubmit(data: GroupFormData) {
        setIsSubmitting(true);
        try {
            const result = isEditing
                ? await updateGroupAction(deviceId, group.id, data.name)
                : await createGroupAction(deviceId, data.name);

            if (result.success) {
                toast.success(isEditing ? "Group updated successfully" : "Group created successfully");

                if (onSuccess && result.data) {
                    onSuccess(result.data);
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

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? isEditing ? "Updating..." : "Creating..."
                        : isEditing ? "Update Group" : "Create Group"
                    }
                </Button>
            </form>
        </Form>
    );
}