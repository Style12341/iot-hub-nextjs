import { upsertToken } from "@/lib/contexts/userTokensContext";
import { LOGTOKEN } from "@/types/types";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
    const admin_user_id = "user_2uL5AGOYHL61xLmDKRSlXa87v9T";

    const userNoView = await db.user.create({
        data: {
            id: admin_user_id,
            role: "ADMIN"
        },
    });
    const defaultView = await db.view.create({
        data: {
            name: "Default",
            userId: admin_user_id,
        },
    });
    const user = await db.user.update({
        where: {
            id: admin_user_id
        },
        data: {
            defaultViewId: defaultView.id
        }
    })
    const category = await db.sensorCategory.create({
        data: {
            name: "Temperature",
            userId: admin_user_id,
        },
    });
    const token = await upsertToken(admin_user_id, LOGTOKEN);

    // First device with 5 sensors
    const device1 = await db.device.create({
        data: {
            name: "testDevice",
            viewId: defaultView.id,
            userId: user.id,
            Sensors: {
                create: [
                    {
                        name: "testSensor1",
                        unit: "°C",
                        Category: {
                            connect: {
                                id: category.id
                            }
                        }
                    },
                    {
                        name: "testSensor2",
                        unit: "°F",
                        Category: {
                            connect: {
                                id: category.id
                            }
                        }
                    },
                    {
                        name: "testSensor3",
                        unit: "K",
                        Category: {
                            connect: {
                                id: category.id
                            }
                        }
                    },
                    {
                        name: "testSensor4",
                        unit: "hPa",
                        Category: {
                            connect: {
                                id: category.id
                            }
                        }
                    },
                    {
                        name: "testSensor5",
                        unit: "%",
                        Category: {
                            connect: {
                                id: category.id
                            }
                        }
                    }
                ]
            },
            Groups: {
                create: {
                    name: "TestGroup"
                }
            }
        },
        include: {
            Sensors: true,
            Groups: true,
        }
    });

    await db.device.update({
        where: {
            id: device1.id
        },
        data: {
            activeGroupId: device1.Groups[0].id
        }
    });

    const group1 = device1.Groups[0];
    device1.activeGroupId = group1.id;

    await db.groupSensor.createMany({
        data: device1.Sensors.map(sensor => ({
            groupId: group1.id,
            sensorId: sensor.id,
            active: true
        }))
    });

    // Second device with 2 sensors
    const device2 = await db.device.create({
        data: {
            name: "secondDevice",
            userId: user.id,
            Sensors: {
                create: [
                    {
                        name: "secondSensor1",
                        unit: "m/s",
                        Category: {
                            connect: {
                                id: category.id
                            }
                        }
                    },
                    {
                        name: "secondSensor2",
                        unit: "lux",
                        Category: {
                            connect: {
                                id: category.id
                            }
                        }
                    }
                ]
            },
            Groups: {
                create: {
                    name: "SecondGroup"
                }
            }
        },
        include: {
            Sensors: true,
            Groups: true,
        }
    });

    await db.device.update({
        where: {
            id: device2.id
        },
        data: {
            activeGroupId: device2.Groups[0].id
        }
    });

    const group2 = device2.Groups[0];
    device2.activeGroupId = group2.id;

    await db.groupSensor.createMany({
        data: device2.Sensors.map(sensor => ({
            groupId: group2.id,
            sensorId: sensor.id,
            active: true
        }))
    });

    // Console log in the required format for Postman templates
    console.log("Device 1 Postman Template:");
    console.log(JSON.stringify({
        "device_id": device1.id,
        "group_id": group1.id,
        "fast": true,
        "sensors": device1.Sensors.map(sensor => ({
            "sensor_id": sensor.id,
            "value": 200
        }))
    }, null, 2));

    console.log("\nDevice 2 Postman Template:");
    console.log(JSON.stringify({
        "device_id": device2.id,
        "group_id": group2.id,
        "fast": true,
        "sensors": device2.Sensors.map(sensor => ({
            "sensor_id": sensor.id,
            "value": 200
        }))
    }, null, 2));

    console.log("\nDevice: ", device1);
    console.log("Device: ", device2);
    console.log("Token: ", token);
}
main()
    .then(async () => {
        await db.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await db.$disconnect();
        process.exit(1);
    });