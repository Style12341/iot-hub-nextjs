import z from 'zod';

export const createDeviceFormSchema = z.object({
    name: z.string().nonempty({ message: "Device name is required" }),
    userId: z.string().nonempty({ message: "User ID is required" }),
    sensors: z.array(
        z.object({
            name: z.string().nonempty({ message: "Sensor name is required" }),
            unit: z.string().nonempty({ message: "Sensor unit is required" }),
            categoryId: z.string().nonempty({ message: "Sensor category is required" }),
        })
    ).min(1, { message: "At least one sensor is required" }),
    group: z.object({
        name: z.string().optional(),
    })
});

export type CreateDeviceFormData = z.infer<typeof createDeviceFormSchema>;