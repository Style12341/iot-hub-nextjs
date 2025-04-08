"use server";

import getUserIdFromAuthOrToken from "@/lib/authUtils";
import { getDeviceGroupsWithActiveSensors, updateDevice, validateDeviceOwnership, createDevice, getDevicesQty, getDevicesViewWithActiveSensorsBetween, getDeviceViewWithActiveSensorsBetween, getDevicesWithActiveSensors, getDeviceWithActiveSensors, getDeviceActiveView, getDevicesWithViews, getPlainDevice, getDeviceSensorsWithGroupCount, deleteDevice } from "@/lib/contexts/deviceContext";

import { getAllUserViews } from "@/lib/contexts/userContext";
import { CreateDeviceFormData, createErrorResponse, createSuccessResponse, ServerActionReason, ServerActionResponse } from "@/types/types";
import { auth } from "@clerk/nextjs/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
// Add these functions to your existing deviceActions.ts file

/**
 * Update a device's details
 * @param deviceId - ID of the device to update
 * @param data - Data to update
 */
export async function updateDeviceAction(
  deviceId: string,
  data: { name: string; viewId: string },
  token?: string | null,
  context?: string
): Promise<ServerActionResponse> {
  const userId = await getUserIdFromAuthOrToken(token, context);
  try {
    if (!userId) {
      return createErrorResponse(ServerActionReason.UNAUTHORIZED, "Unauthorized access", {
        body: {
          userId: userId,
          context: context,
          token: token,
          deviceId: deviceId,
          data: data
        }
      });
    }

    // Validate device ownership
    const hasAccess = await validateDeviceOwnership(userId, deviceId);
    if (!hasAccess) {
      return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device", {
        body: {
          userId: userId,
          context: context,
          token: token,
          deviceId: deviceId,
          data: data
        }
      });
    }

    // Update device
    await updateDevice(deviceId, data);

    return createSuccessResponse(ServerActionReason.SUCCESS, "Device updated successfully", null);
  } catch (error) {
    // Check for unique constraint violation
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return createErrorResponse(
        ServerActionReason.CONFLICT,
        "A device with this name already exists",
        {
          error,
          body: {
            userId: userId,
            context: context,
            token: token,
            deviceId: deviceId,
            data: data
          }
        }
      );
    }

    return createErrorResponse(ServerActionReason.INTERNAL_ERROR, "Failed to update device", {
      error,
      body: {
        userId: userId,
        context: context,
        token: token,
        deviceId: deviceId,
        data: data
      }
    }
    );
  }
}

/**
 * Delete a device and all its associated data
 * @param deviceId - ID of the device to delete
 */
export async function deleteDeviceAction(
  deviceId: string,
  token?: string | null,
  context?: string
): Promise<ServerActionResponse> {
  const userId = await getUserIdFromAuthOrToken(token, context);
  try {
    if (!userId) {
      return createErrorResponse(ServerActionReason.UNAUTHORIZED, "Unauthorized access", {
        body: {
          userId: userId,
          context: context,
          token: token,
          deviceId: deviceId
        }
      });
    }

    // Validate device ownership
    const hasAccess = await validateDeviceOwnership(userId, deviceId);
    if (!hasAccess) {
      return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device", {
        body: {
          userId: userId,
          context: context,
          token: token,
          deviceId: deviceId
        }
      });
    }

    // Delete device - Prisma will cascade delete all related entities based on schema
    await deleteDevice(deviceId);

    return createSuccessResponse(ServerActionReason.SUCCESS, "Device deleted successfully", null);
  } catch (error) {
    return createErrorResponse(ServerActionReason.INTERNAL_ERROR, "Failed to delete device", {
      error,
      body: {
        userId: userId,
        context: context,
        token: token,
        deviceId: deviceId
      }
    });
  }
}
/**
 * Creates a new device given the formdata
 * @param data The form data to create the device
 */
export async function createDeviceAction(data: CreateDeviceFormData) {
  try {
    // Server side validations
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(
        ServerActionReason.UNAUTHORIZED,
        "You must be logged in to create a device",
        {
          body: {
            userId: userId,
            data: data
          }
        }
      )
    }
    data.userId = userId;

    const device = await createDevice(data);

    return createSuccessResponse(ServerActionReason.CREATED, "Device created successfully", device);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      let message: string = "";
      if (error.code === "P2002") {
        message = "Device name must be unique";
      }
      return createErrorResponse(
        ServerActionReason.INVALID_DATA,
        message || "Invalid data provided",
        error
      );
    } else {
      return createErrorResponse(ServerActionReason.INTERNAL_ERROR, "An error occurred while creating the device", {
        error,
        body: {
          data: data
        }
      });
    }
  }
}
/**
 * Gets all devices for the logged in user or the given token.
 * Returns a paginated list of devices with the active sensors of the active group
 * @param page The page number to retrieve (default: 1)
 * @param token The token to use for authentication (optional)
 * @param context The context to use for authentication (optional)
 * @returns A paginated list of devices with the active sensors of the active group
 */
export async function getDevicesWithActiveSensorsAction(page: number = 1, token?: string | null, context?: string) {
  const userId = await getUserIdFromAuthOrToken(token, context);
  if (!userId) {
    return createErrorResponse(
      ServerActionReason.UNAUTHORIZED,
      "Unauthorized access",
      {
        body: {
          userId: userId,
          context: context,
          token: token,
          page: page
        }
      }
    );
  }
  const res = await getDevicesWithActiveSensors(userId, page);
  return createSuccessResponse(ServerActionReason.SUCCESS, "Devices retrieved successfully", res);
}
/**
 * Gets all devices for the logged in user or the given token with their assigned view.
 * Returns a list of devices with the active sensors of the active group
 * @param page The page number to retrieve (default: 1)
 * @param token The token to use for authentication (optional)
 * @param context The context to use for authentication (optional)
 * @returns A list of devices with the active sensors of the active group
 */
export async function getDevicesListWithDataAction(page: number = 1, token?: string | null, context?: string) {
  const userId = await getUserIdFromAuthOrToken(token, context);
  if (!userId) {
    return createErrorResponse(
      ServerActionReason.UNAUTHORIZED,
      "Unauthorized access",
      {
        body: {
          userId: userId,
          context: context,
          token: token,
          page: page
        }
      }
    );
  }
  const res = await getDevicesWithViews(userId, page);
  return createSuccessResponse(ServerActionReason.SUCCESS, "Devices retrieved successfully", res);
}
/**
 * Gets the quantity of devices for the logged in user or the given token.
 */
export async function getDevicesQtyAction(token?: string | null, context?: string) {
  const userId = await getUserIdFromAuthOrToken(token, context);
  if (!userId) {
    return createErrorResponse(
      ServerActionReason.UNAUTHORIZED,
      "Unauthorized access",
      {
        body: {
          userId: userId,
          context: context,
          token: token
        }
      }
    );
  }
  const res = await getDevicesQty(userId);

  return createSuccessResponse(ServerActionReason.SUCCESS, "Devices quantity retrieved successfully", res);
  return createSuccessResponse(ServerActionReason.SUCCESS, "Devices quantity retrieved successfully", res);
}
/**
 * Get all views for the logged in user or the given token.
 * Returns the views name and device count
 */
export async function getAllUserViewsAction(token?: string | null, context?: string) {
  const userId = await getUserIdFromAuthOrToken(token, context);
  if (!userId) {
    return createErrorResponse(
      ServerActionReason.UNAUTHORIZED,
      "Unauthorized access",
      {
        body: {
          userId: userId,
          context: context,
          token: token
        }
      }
    );
  }
  const res = await getAllUserViews(userId);
  return createSuccessResponse(ServerActionReason.SUCCESS, "Views retrieved successfully", res);
}
/**
 * Gets the device with the given id for the logged in user or the given token.
 * Returns the device with the active sensors of the active group
 * @param deviceId The id of the device to retrieve
 * @param token The token to use for authentication (optional)
 * @param context The context to use for authentication (optional)
 */
export async function getDeviceWithActiveSensorsAction(deviceId: string, token?: string | null, context?: string) {
  const userId = await getUserIdFromAuthOrToken(token, context);
  if (!userId) {
    return createErrorResponse(
      ServerActionReason.UNAUTHORIZED,
      "Unauthorized access",
      {
        body: {
          userId: userId,
          context: context,
          token: token,
          deviceId: deviceId
        }
      }
    );
  }
  const device = await getDeviceWithActiveSensors(userId, deviceId);

  return createSuccessResponse(ServerActionReason.SUCCESS, "Device retrieved successfully", device);
  return createSuccessResponse(ServerActionReason.SUCCESS, "Device retrieved successfully", device);
}
/**
 * Gets the devices of a specific view with the active sensors of the active group for the logged in user or the given token.
 */
export async function getDevicesViewWithActiveSensorsBetweenAction(view: string, startDate: Date, endDate: Date, token?: string | null, context?: string) {
  const userId = await getUserIdFromAuthOrToken(token, context);
  if (!userId) {
    return createErrorResponse(
      ServerActionReason.UNAUTHORIZED,
      "Unauthorized access",
      {
        body: {
          userId: userId,
          context: context,
          token: token,
          view: view,
          startDate: startDate,
          endDate: endDate
        }
      }
    );
  }
  const res = await getDevicesViewWithActiveSensorsBetween(userId, view, startDate, endDate);
  return createSuccessResponse(ServerActionReason.SUCCESS, "Devices view retrieved successfully", res);
}
/**
 * Gets the device view with the active sensors of the active group for the logged in user or the given token.
 */
export async function getDeviceViewWithActiveSensorsBetweenAction(deviceId: string, view: string, startDate: Date, endDate: Date, token?: string | null, context?: string) {
  const userId = await getUserIdFromAuthOrToken(token, context);
  if (!userId) {
    return createErrorResponse(
      ServerActionReason.UNAUTHORIZED,
      "Unauthorized access",
      {
        body: {
          userId: userId,
          context: context,
          token: token,
          deviceId: deviceId,
          view: view,
          startDate: startDate,
          endDate: endDate
        }
      }
    );
  }
  const res = await getDeviceViewWithActiveSensorsBetween(userId, deviceId, view, startDate, endDate);
  return createSuccessResponse(ServerActionReason.SUCCESS, "Device view retrieved successfully", res);
}
export async function getDeviceActiveViewWithActiveSensorsBetweenAction(deviceId: string, startDate: Date, endDate: Date, token?: string | null, context?: string) {
  const userId = await getUserIdFromAuthOrToken(token, context);
  if (!userId) {
    return createErrorResponse(
      ServerActionReason.UNAUTHORIZED,
      "Unauthorized access", {
      body: {
        userId: userId,
        context: context,
        token: token,
        deviceId: deviceId,
        startDate: startDate,
        endDate: endDate
      }
    }
    );
  }
  const view = await getDeviceActiveView(userId, deviceId);
  const name = view?.name ?? "Default";
  const res = await getDeviceViewWithActiveSensorsBetween(userId, deviceId, name, startDate, endDate);
  return createSuccessResponse(ServerActionReason.SUCCESS, "Device view retrieved successfully", res);
}
export async function getDeviceAction(deviceId: string, token?: string | null, context?: string) {
  const userId = await getUserIdFromAuthOrToken(token, context);
  if (!userId) {
    return createErrorResponse(
      ServerActionReason.UNAUTHORIZED,
      "Unauthorized access",
      {
        body: {
          userId: userId,
          context: context,
          token: token,
          deviceId: deviceId
        }
      }
    );
  }
  const device = await getPlainDevice(userId, deviceId);
  if (!device) {
    return createErrorResponse(
      ServerActionReason.NOT_FOUND,
      "Device not found",
      {
        body: {
          userId: userId,
          context: context,
          token: token,
          deviceId: deviceId
        }
      }
    );
  }
  return createSuccessResponse(ServerActionReason.SUCCESS, "Device retrieved successfully", device);
}
export async function getDeviceSensorsAction(deviceId: string, token?: string | null, context?: string) {
  const userId = await getUserIdFromAuthOrToken(token, context);
  try {
    if (!userId) {
      return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in", { body: { userId: userId, context: context, token: token, deviceId: deviceId } });
    }

    // Validate device ownership
    const hasAccess = await validateDeviceOwnership(userId, deviceId);
    if (!hasAccess) {
      return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device",
        { body: { userId: userId, context: context, token: token, deviceId: deviceId } }
      );
    }

    // Get sensors with group counts
    const sensors = await getDeviceSensorsWithGroupCount(deviceId);

    return createSuccessResponse(
      ServerActionReason.SUCCESS,
      "Device sensors retrieved successfully",
      sensors
    );
  } catch (error) {
    return createErrorResponse(ServerActionReason.INTERNAL_ERROR, "Failed to fetch device sensors", {
      error,
      body: { userId: userId, context: context, token: token, deviceId: deviceId }
    });
  }
}
/**
 * Gets the device groups each with it's active sensors
 * @param deviceId The id of the device to retrieve
 * @param token The token to use for authentication (optional)
 * @param context The context to use for authentication (optional)
 * */
export async function getDeviceGroupsWithSensorsAction(deviceId: string, token?: string | null, context?: string) {
  const userId = await getUserIdFromAuthOrToken(token, context);
  try {
    if (!userId) {
      return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in", { body: { userId: userId, context: context, token: token, deviceId: deviceId } });
    }

    // Validate device ownership
    const hasAccess = await validateDeviceOwnership(userId, deviceId);
    if (!hasAccess) {
      return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device",
        { body: { userId: userId, context: context, token: token, deviceId: deviceId } }
      );
    }

    // Get groups with active sensors
    const groups = await getDeviceGroupsWithActiveSensors(userId, deviceId);
    if (!groups) {
      return createErrorResponse(ServerActionReason.NOT_FOUND, "Device groups not found", {
        body: { userId: userId, context: context, token: token, deviceId: deviceId }
      });
    }

    return createSuccessResponse(
      ServerActionReason.SUCCESS,
      "Device groups retrieved successfully",
      groups
    );
  } catch (error) {
    return createErrorResponse(ServerActionReason.INTERNAL_ERROR, "Failed to fetch device groups", {
      error,
      body: { userId: userId, context: context, token: token, deviceId: deviceId }
    });
  }
}
