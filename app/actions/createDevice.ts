"use server";

import { createDevice } from "@/lib/contexts/deviceContext";
import { CreateDeviceFormData } from "@/types/types";
import { auth } from "@clerk/nextjs/server";

export async function createDeviceAction(data: CreateDeviceFormData): Promise<{ success: boolean; message: string }> {
    try {
        // Server side validations
        const { userId } = await auth();
        if (!userId) {
            return {
                success: false,
                message: "You must be logged in to create a device",
            };
        }
        if (userId !== data.userId) {
            return {
                success: false,
                message: "User ID mismatch",
            };
        }

        createDevice(data);

        return {
            success: true,
            message: `Device "${data.name}" created successfully with ${data.sensors.length} sensors`,
        };
    } catch (error) {
        console.error("Error creating device:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
}