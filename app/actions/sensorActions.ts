"use server";

import getUserIdFromAuthOrToken from "@/lib/authUtils";
import { createSensor, deleteSensor, getSensorsQty, updateSensor, validateSensorOwnership } from "@/lib/contexts/sensorContext";
import { validateDeviceOwnership } from "@/lib/contexts/deviceContext";
import { createErrorResponse, createSuccessResponse, ServerActionReason, ServerActionResponse } from "@/types/types";
import { Sensor } from "@prisma/client";

export async function getSensorsQtyAction(token?: string | null, context?: string) {
  const userId = await getUserIdFromAuthOrToken(token, context);
  if (!userId) {
    return createErrorResponse(
      ServerActionReason.UNAUTHORIZED,
      "Unauthorized access"
    );
  }
  const res = await getSensorsQty(userId);
  return createSuccessResponse(ServerActionReason.SUCCESS, "Sensors retrieved successfully", res);
}

export async function updateSensorAction(
  deviceId: string,
  sensorId: string,
  data: {
    name: string;
    unit: string;
    categoryId: string;
    activeGroupIds?: string[];
  },
  token?: string | null,
  context?: string
): Promise<ServerActionResponse<Sensor>> {
  try {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
      return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in");
    }

    // Validate device ownership
    const hasAccess = await validateDeviceOwnership(userId, deviceId);
    if (!hasAccess) {
      return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device");
    }

    // Validate sensor belongs to device
    const sensorOwnedByDevice = await validateSensorOwnership(userId, sensorId);
    if (!sensorOwnedByDevice) {
      return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this sensor");
    }

    // Update sensor
    const sensor = await updateSensor(sensorId, data);

    return createSuccessResponse(
      ServerActionReason.SUCCESS,
      "Sensor updated successfully",
      sensor
    );
  } catch (error) {
    console.error("Error updating sensor:", error);
    return createErrorResponse();
  }
}

export async function createSensorAction(
  deviceId: string,
  data: {
    name: string;
    unit: string;
    categoryId: string;
    activeGroupIds?: string[];
  },
  token?: string | null,
  context?: string
): Promise<ServerActionResponse<Sensor>> {
  try {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
      return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in");
    }

    // Validate device ownership
    const hasAccess = await validateDeviceOwnership(userId, deviceId);
    if (!hasAccess) {
      return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device");
    }

    // Create sensor
    const sensor = await createSensor(deviceId, data);

    return createSuccessResponse(
      ServerActionReason.CREATED,
      "Sensor created successfully",
      sensor
    );
  } catch (error) {
    console.error("Error creating sensor:", error);
    return createErrorResponse();
  }
}

export async function deleteSensorAction(
  deviceId: string,
  sensorId: string,
  token?: string | null,
  context?: string
): Promise<ServerActionResponse> {
  try {
    const userId = await getUserIdFromAuthOrToken(token, context);
    if (!userId) {
      return createErrorResponse(ServerActionReason.UNAUTHORIZED, "You must be logged in");
    }

    // Validate device ownership
    const hasAccess = await validateDeviceOwnership(userId, deviceId);
    if (!hasAccess) {
      return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this device");
    }

    // Validate sensor belongs to device
    const sensorOwnedByDevice = await validateSensorOwnership(userId, sensorId);
    if (!sensorOwnedByDevice) {
      return createErrorResponse(ServerActionReason.FORBIDDEN, "Access denied to this sensor");
    }

    // Delete sensor
    await deleteSensor(sensorId);

    return createSuccessResponse(
      ServerActionReason.SUCCESS,
      "Sensor deleted successfully",
      null
    );
  } catch (error) {
    console.error("Error deleting sensor:", error);
    return createErrorResponse();
  }
}
