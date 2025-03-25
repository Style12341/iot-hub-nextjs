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