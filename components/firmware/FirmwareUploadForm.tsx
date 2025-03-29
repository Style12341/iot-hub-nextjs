'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from 'sonner';

// Define the schema for firmware upload
const firmwareUploadSchema = z.object({
    description: z.string()
        .min(5, "Description must be at least 5 characters")
        .max(100, "Description must be at most 100 characters"),
    version: z.string()
        .regex(/^\d+\.\d+\.\d+$/, "Version must be in format x.y.z (e.g. 1.0.0)"),
    file: z.instanceof(File)
        .refine(file => file.size > 0, "File is required")
        .refine(file => file.size <= 10 * 1024 * 1024, "File must be less than 10MB")
});

type FirmwareUploadFormValues = z.infer<typeof firmwareUploadSchema>;

interface FirmwareUploadFormProps {
    deviceId: string;
    onUploadSuccess?: (firmware: any) => void;
}

export function FirmwareUploadForm({ deviceId, onUploadSuccess }: FirmwareUploadFormProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState<string>("");

    // Initialize form
    const form = useForm<FirmwareUploadFormValues>({
        resolver: zodResolver(firmwareUploadSchema),
        defaultValues: {
            description: "",
            version: "",
        }
    });

    // Handle form submission
    async function onSubmit(data: FirmwareUploadFormValues) {
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", data.file);
            formData.append("description", data.description);
            formData.append("version", data.version);

            // Make API request to upload firmware
            const response = await fetch(`/api/v1/devices/${deviceId}/firmwares`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to upload firmware");
            }

            // Show success message
            toast.info("Upload successful", {
                description: `Firmware ${result.version} uploaded successfully!`,
            })

            // Reset form after successful upload
            form.reset({
                description: "",
                version: "",
            });
            setSelectedFileName("");

            // Call success callback if provided
            if (onUploadSuccess) {
                onUploadSuccess(result);
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
                                <FormLabel>Version</FormLabel>
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