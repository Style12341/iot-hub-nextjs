import { UserJSON } from "@clerk/nextjs/server";
import { User } from "@prisma/client";
import db from "../prisma";

// Creates user from Clerk webhook and sets its default view
export async function createUserFromClerk(data: UserJSON): Promise<User> {
    const user = await db.user.create({
        data: {
            id: data.id
        }
    });
    await db.view.create({
        data: {
            name: "Default view",
            userId: user.id,
            DefaultForUser: {
                connect: {
                    id: user.id
                }
            }
        },
    });
    return user;
}
export async function getAllUserViews(userId: string) {
    const views = await db.view.findMany({
        where: {
            userId: userId
        },
        select: {
            name: true,
            id: true,
            _count: {
                select: {
                    Devices: true
                }
            }
        }
    });
    return views.map((view) => {
        return {
            id: view.id,
            name: view.name,
            devicesCount: view._count.Devices
        }
    }
    );
}