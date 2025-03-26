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
    });

    // Create all sensor categories first
    const categories = await Promise.all([
        db.sensorCategory.create({
            data: { name: "Temperature", userId: admin_user_id }
        }),
        db.sensorCategory.create({
            data: { name: "Humidity", userId: admin_user_id }
        }),
        db.sensorCategory.create({
            data: { name: "Pressure", userId: admin_user_id }
        }),
        db.sensorCategory.create({
            data: { name: "Light", userId: admin_user_id }
        }),
        db.sensorCategory.create({
            data: { name: "Velocity", userId: admin_user_id }
        })
    ]);

    // Store categories in an easily accessible object for later use
    const categoryMap = {
        "Temperature": categories[0],
        "Humidity": categories[1],
        "Pressure": categories[2],
        "Light": categories[3],
        "Velocity": categories[4]
    };

    const token = await upsertToken(admin_user_id, LOGTOKEN);

    // First device with sensors from different categories
    const device1 = await db.device.create({
        data: {
            name: "testDevice",
            viewId: defaultView.id,
            userId: user.id,
            Sensors: {
                create: [
                    {
                        name: "Temperature Sensor",
                        unit: "°C",
                        categoryId: categoryMap["Temperature"].id
                    },
                    {
                        name: "Humidity Sensor",
                        unit: "%",
                        categoryId: categoryMap["Humidity"].id
                    },
                    {
                        name: "Pressure Sensor",
                        unit: "hPa",
                        categoryId: categoryMap["Pressure"].id
                    },
                    {
                        name: "Light Sensor",
                        unit: "lux",
                        categoryId: categoryMap["Light"].id
                    },
                    {
                        name: "Velocity Sensor",
                        unit: "m/s",
                        categoryId: categoryMap["Velocity"].id
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

    // Second device with different sensor types
    const device2 = await db.device.create({
        data: {
            name: "secondDevice",
            viewId: defaultView.id,
            userId: user.id,
            Sensors: {
                create: [
                    {
                        name: "Secondary Temperature",
                        unit: "°F",
                        categoryId: categoryMap["Temperature"].id
                    },
                    {
                        name: "Secondary Humidity",
                        unit: "%",
                        categoryId: categoryMap["Humidity"].id
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
            "value": Math.floor(Math.random() * 100) // Random values for testing
        }))
    }, null, 2));

    console.log("\nDevice 2 Postman Template:");
    console.log(JSON.stringify({
        "device_id": device2.id,
        "group_id": group2.id,
        "fast": true,
        "sensors": device2.Sensors.map(sensor => ({
            "sensor_id": sensor.id,
            "value": Math.floor(Math.random() * 100) // Random values for testing
        }))
    }, null, 2));
    console.log("Token: ", token);

    // Output category information as well
    console.log("\nCategories created:");
    for (const [name, category] of Object.entries(categoryMap)) {
        console.log(`${name}: ${category.id}`);
    }
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