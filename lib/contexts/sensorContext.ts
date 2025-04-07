"use server"

import db from "../prisma";
import { Sensor } from "@prisma/client";



export async function validateSensorOwnership(userId: string, sensorId: string): Promise<boolean> {
  const sensor = await db.sensor.findFirst({
    where: {
      id: sensorId,
      Device: {
        userId: userId
      }
    }
  });
  return !!sensor;
}

export async function getSensorsQty(userId: string) {
  return db.sensor.count({
    where: {
      Device: {
        userId
      }
    }
  });
}


export async function updateSensor(sensorId: string, data: {
  name: string;
  unit: string;
  categoryId: string;
  activeGroupIds?: string[];
}): Promise<Sensor> {
  // First update the sensor basic properties
  const sensor = await db.sensor.update({
    where: { id: sensorId },
    data: {
      name: data.name,
      unit: data.unit,
      categoryId: data.categoryId
    },
    include: {
      Category: true
    }
  });

  // If activeGroupIds is provided, update group sensors
  if (data.activeGroupIds) {
    // Get current group sensors for this sensor
    const currentGroupSensors = await db.groupSensor.findMany({
      where: { sensorId }
    });
    const updateData = currentGroupSensors.map(gs => ({
      where: { id: gs.id },

    }));
    await Promise.all(
      currentGroupSensors.map(gs =>
        db.groupSensor.update({
          where: { id: gs.id },
          data: { active: data.activeGroupIds!.includes(gs.groupId) }
        })
      )
    );
  }

  return sensor;
}

export async function createSensor(deviceId: string, data: {
  name: string;
  unit: string;
  categoryId: string;
  activeGroupIds?: string[];
}): Promise<Sensor> {
  // Create the sensor
  const sensor = await db.sensor.create({
    data: {
      name: data.name,
      unit: data.unit,
      categoryId: data.categoryId,
      deviceId: deviceId
    },
    include: {
      Category: true
    }
  });

  // For each group in the device, create a GroupSensor with proper active status
  const groups = await db.group.findMany({
    where: { deviceId }
  });

  if (groups.length > 0) {
    await db.groupSensor.createMany({
      data: groups.map(group => ({
        groupId: group.id,
        sensorId: sensor.id,
        // If activeGroupIds is provided, check if this group should be active
        // Otherwise default to false
        active: data.activeGroupIds
          ? data.activeGroupIds.includes(group.id)
          : false
      }))
    });
  }

  return sensor;
}

export async function deleteSensor(sensorId: string): Promise<Sensor> {
  return await db.sensor.delete({
    where: { id: sensorId }
  });
}
