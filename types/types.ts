import { Firmware } from '@prisma/client';
import z from 'zod';


// Define reason codes with associated HTTP status codes
export enum ServerActionReason {
    // 2xx - Success
    SUCCESS = "SUCCESS", // 200
    CREATED = "CREATED", // 201
    NO_CONTENT = "NO_CONTENT", // 204

    // 4xx - Client errors
    UNAUTHORIZED = "UNAUTHORIZED", // 401
    FORBIDDEN = "FORBIDDEN", // 403
    NOT_FOUND = "NOT_FOUND", // 404
    INVALID_DATA = "INVALID_DATA", // 422
    CONFLICT = "CONFLICT", // 409

    // 5xx - Server errors
    INTERNAL_ERROR = "INTERNAL_ERROR", // 500
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED", // 501
    UNAVAILABLE = "UNAVAILABLE", // 503

    // Fallback
    UNKNOWN_ERROR = "UNKNOWN_ERROR" // 500
}

// Mapping from reason to HTTP status code
export const reasonToStatusCode: Record<ServerActionReason, number> = {
    [ServerActionReason.SUCCESS]: 200,
    [ServerActionReason.CREATED]: 201,
    [ServerActionReason.NO_CONTENT]: 204,
    [ServerActionReason.UNAUTHORIZED]: 401,
    [ServerActionReason.FORBIDDEN]: 403,
    [ServerActionReason.NOT_FOUND]: 404,
    [ServerActionReason.INVALID_DATA]: 422,
    [ServerActionReason.CONFLICT]: 409,
    [ServerActionReason.INTERNAL_ERROR]: 500,
    [ServerActionReason.NOT_IMPLEMENTED]: 501,
    [ServerActionReason.UNAVAILABLE]: 503,
    [ServerActionReason.UNKNOWN_ERROR]: 500,
};
type SuccessReasons = ServerActionReason.SUCCESS | ServerActionReason.CREATED | ServerActionReason.NO_CONTENT;
type ErrorReasons = Exclude<ServerActionReason, SuccessReasons>;


export type SuccessResponse<T> = {
    success: true;
    reason: SuccessReasons;
    message: string;
    data: T;
    statusCode: number;
};

export type ErrorResponse = {
    success: false;
    reason: ErrorReasons;
    message: string;
    statusCode: number;
};

// Generic response type as a union of success and error responses
export type ServerActionResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// Helper functions to create standardized responses
export const createSuccessResponse = <T>(
    reason: SuccessReasons = ServerActionReason.SUCCESS,
    message = "Operation successful",
    data: T
): SuccessResponse<T> => ({
    success: true,
    reason,
    message,
    data,
    statusCode: reasonToStatusCode[reason],
});


export const createErrorResponse = (
    reason: ErrorReasons = ServerActionReason.UNKNOWN_ERROR,
    message = "An error occurred",
    // Optional object for more detailed error information can be a generic error or a body
    error: any
): ErrorResponse => {
    try {
        throw error; // This will help to capture the stack trace in the console
    } catch (e) {
        console.error({
            reason,
            message,
            e,
            statusCode: reasonToStatusCode[reason],
        }); // Log the error for debugging
        return {
            success: false,
            reason,
            message,
            statusCode: reasonToStatusCode[reason],
        }
    }
};

export const createDeviceFormSchema = z.object({
    name: z.string().nonempty({ message: "Device name is required" }),
    userId: z.string().nonempty({ message: "User ID is required" }),
    sensors: z.array(
        z.object({
            name: z.string().nonempty({ message: "Sensor name is required" }),
            unit: z.string().nonempty({ message: "Sensor unit is required" }),
            categoryId: z.string().nonempty({ message: "Sensor category is required" }),
        })
    ).min(1, { message: "At least one sensor is required" }).superRefine((items, ctx) => {
        // The refine here checks if sensor names are unique, adding errors to all duplicated fields
        const uniqueNames = new Map<string, number>()
        items.forEach((item, idx) => {
            const firstAppearanceIndex = uniqueNames.get(item.name)
            if (firstAppearanceIndex !== undefined) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Name must be unique`,
                    path: [idx, 'name'],
                })
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Name must be unique`,
                    path: [firstAppearanceIndex, 'name'],
                })
                return
            }
            uniqueNames.set(item.name, idx)
        })
    }),
    group: z.object({
        name: z.string().optional(),
    }),
    view: z.object({
        id: z.string()
    })
});
export type CreateDeviceFormData = z.infer<typeof createDeviceFormSchema>;

export const createCategoryFormSchema = z.object({
    userId: z.string().nonempty({ message: "User ID is required" }),
    name: z.string().nonempty({ message: "Category name is required" }),
    color: z.string().nonempty({ message: "Category color is required" }).refine((val) => {
        return /^#[0-9A-F]{6}$/i.test(val);
    }).optional(),
});
export type CreateCategoryFormData = z.infer<typeof createCategoryFormSchema>;

export const createViewFormSchema = z.object({
    userId: z.string().nonempty({ message: "User ID is required" }),
    name: z.string().nonempty({ message: "View name is required" }),
    devicesIdsToTransfer: z.array(z.string()).optional(),
});
export type CreateViewFormData = z.infer<typeof createViewFormSchema>;
export type SensorValueEntry = {
    groupSensorId: string;
    timestamp: Date;
    value: number;
};
export type CreateTokenFormData = {
    userId: string;
    context: string;
};
export const LOGTOKEN = "log";
export type Token = string;
export interface SensorValueSSEMessage {
    value: number;
    timestamp: string;
}
export interface SensorSSEMessage {
    id?: string;
    groupSensorId: string;
    values: SensorValueSSEMessage[];
}
export type DeviceSSEType = "connected" | "new sensors" | "status";
type BaseDeviceSSEMessage = {
    id: string;

};
type ConnectedDeviceSSEMessage = {
    id: string;
    type: "connected";
}
type NewSensorsDeviceSSEMessage = {
    id: string;
    type: "new sensors";
    lastValueAt: Date;
    activeFirmwareVersion: string;
    sensors: SensorSSEMessage[];
};
type StatusDeviceSSEMessage = {
    id: string;
    type: "status";
    activeFirmwareVersion: string;
};

export type DeviceSSEMessage = ConnectedDeviceSSEMessage | NewSensorsDeviceSSEMessage | StatusDeviceSSEMessage;
// Type of firmware except id,createdAt,updatedAt
export type FirmwareCreate = Omit<Firmware, "id" | "createdAt" | "updatedAt" | "embedded">;
