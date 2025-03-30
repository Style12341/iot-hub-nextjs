'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { uploadDeviceFirmwareAction } from '@/app/actions/firmwareActions';
import { Firmware } from '@prisma/client';

// Define the schema for firmware upload
const firmwareUploadSchema = z.object({
    description: z.string()
        .min(5, "Description must be at least 5 characters")
        .max(100, "Description must be at most 100 characters"),
    version: z.string()
        .regex(/^\d+\.\d+\.\d+$/, "Version must be in format x.y.z (e.g. 1.0.0)"),
    file: z.instanceof(File)
        .refine(file => file.size > 0, "File is required")
        .refine(file => file.type === "application/octet-stream", "File must be a binary file")
        .refine(file => file.size <= 10 * 1024 * 1024, "File must be less than 10MB"),
    autoAssign: z.boolean().default(false)
});

type FirmwareUploadFormValues = z.infer<typeof firmwareUploadSchema>;

interface FirmwareUploadFormProps {
    deviceId: string;
    currentAssignedFirmwareVersion?: string;
    onUploadSuccess?: (firmware: Firmware) => void;
}

export function FirmwareUploadForm({ deviceId, currentAssignedFirmwareVersion, onUploadSuccess }: FirmwareUploadFormProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState<string>("");

    // Initialize form
    const form = useForm<FirmwareUploadFormValues>({
        resolver: zodResolver(firmwareUploadSchema),
        defaultValues: {
            description: "",
            version: "",
            autoAssign: false
        }
    });

    // Handle form submission
    async function onSubmit(data: FirmwareUploadFormValues) {
        setIsUploading(true);

        try {
            const formData = {
                file: data.file,
                description: data.description,
                version: data.version,
                autoAssign: data.autoAssign
            }

            // Make API request to upload firmware
            const response = await uploadDeviceFirmwareAction(deviceId, formData);

            if (!response.success) {
                throw new Error(response.message || "Failed to upload firmware");
            }

            // Show success message
            toast.info("Upload successful", {
                description: `Firmware ${response.data.version} uploaded successfully!${data.autoAssign ? ' Device firmware assignment updated.' : ''}`,
            })

            // Reset form after successful upload
            form.reset({
                description: "",
                version: "",
                autoAssign: false
            });
            setSelectedFileName("");

            // Call success callback if provided
            if (onUploadSuccess) {
                onUploadSuccess(response.data);
            }
        } catch (error) {
            console.error("Error uploading firmware:", error);
            toast.error("Upload failed", {
                description: error instanceof Error ? error.message : "An unexpected error occurred",
            });
        } finally {
            setIsUploading(false);
        }
    }

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue("file", file, { shouldValidate: true });
            setSelectedFileName(file.name);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-xl font-semibold">Upload Firmware</h2>
                <p className="text-sm text-muted-foreground">
                    Upload a new firmware version for this device.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter firmware description"
                                        className="resize-none min-h-[100px]"
                                        disabled={isUploading}
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Briefly describe the purpose of this firmware update.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="version"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex justify-between items-center">
                                    <FormLabel>Version</FormLabel>
                                    {
                                        <span className="text-xs text-muted-foreground">
                                            {currentAssignedFirmwareVersion === undefined ? "" : "Current:"} <span className="font-medium">{currentAssignedFirmwareVersion ?? "No version assigned"}</span>
                                        </span>
                                    }
                                </div>
                                <FormControl>
                                    <Input
                                        placeholder="1.0.0"
                                        disabled={isUploading}
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Use semantic versioning (e.g., 1.0.0)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="autoAssign"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center gap-5 rounded-md border p-4">
                                <FormControl className="flex items-center pt-0.5">
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isUploading}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Automatically assign to device
                                    </FormLabel>
                                    <FormDescription>
                                        The device will be configured to use this firmware immediately after upload
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="file"
                        render={() => (
                            <FormItem>
                                <FormLabel>Firmware File</FormLabel>
                                <FormControl>
                                    <div className="grid w-full items-center gap-1.5">
                                        <div className="flex items-center gap-3">
                                            <Input
                                                id="firmware-file"
                                                type="file"
                                                className="w-full"
                                                onChange={handleFileChange}
                                                disabled={isUploading}
                                                accept=".bin,.hex,.uf2"
                                            />
                                        </div>
                                        {selectedFileName && (
                                            <p className="text-sm text-gray-500">
                                                Selected: {selectedFileName}
                                            </p>
                                        )}
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Upload the firmware binary file (max 10MB).
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={isUploading}
                            className="w-full sm:w-auto"
                        >
                            {isUploading ? "Uploading..." : "Upload Firmware"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}