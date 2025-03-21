import { upsertToken } from "@/lib/contexts/userTokensContext";
import { LOGTOKEN } from "@/types/types";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
    const admin_user_id = "user_2uL5AGOYHL61xLmDKRSlXa87v9T";
    const user = await db.user.create({
        data: {
            id: admin_user_id,
            role: "ADMIN",
        },
    });
    const category = await db.sensorCategory.create({
        data: {
            name: "Temperature",
            userId: admin_user_id,
        },
    });
    const token = await upsertToken(admin_user_id, LOGTOKEN);
    const device = await db.device.create({
        data: {
            name: "testDevice",
            userId: user.id,
            Sensors: {
                create: {
                    name: "testSensor",
                    unit: "testUnit",
                    Category: {
                        connect: {
                            id: category.id
                        }
                    }
                }
            },
            Groups: {
                create: {
                    name: "TestGroup"
                }
            }
        },
        // Include relevant relations
        include: {
            Sensors: true,
            Groups: true,

        }
    });
    const group = device.Groups[0];
    await db.groupSensor.createMany({
        data: device.Sensors.map(sensor => ({
            groupId: group.id,
            sensorId: sensor.id,
            active: true
        }))
    });
    console.log("Device: ", device);
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