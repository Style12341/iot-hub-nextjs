import { UserJSON } from "@clerk/nextjs/server";
import { User } from "@prisma/client";
import db from "../prisma";

// Creates user from Clerk webhook
export async function createUserFromClerk(data: UserJSON): Promise<User> {
    const user = await db.user.create({
        data: {
            id: data.id
        }
    });
    return user;
}