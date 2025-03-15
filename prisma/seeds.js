import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
    await db.user.create({
        data: {
            id: "user_2uL5AGOYHL61xLmDKRSlXa87v9T",
            role: "ADMIN",
        },
    });
}