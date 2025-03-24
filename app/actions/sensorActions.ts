"use server"

import { getSensorsQty } from "@/lib/contexts/sensorsContext";
import { auth } from "@clerk/nextjs/server";

export async function getSensorsQtyAction(passedUserId: string) {
    const { userId } = await auth();
    if (userId !== passedUserId) {
        return null
    }
    return await getSensorsQty(userId);
}