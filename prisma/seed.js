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
    await db.sensorCategory.create({
        data: {
            name: "Temperature",
            userId: admin_user_id,
        },
    });
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