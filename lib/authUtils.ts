"use server"

import { auth } from "@clerk/nextjs/server"
import { getUserFromToken } from "./contexts/userTokensContext"
import { LOGTOKEN } from "@/types/types"



export default async function getUserIdFromAuthOrToken(
    token: string | null | undefined,
    context = LOGTOKEN
) {
    const { userId } = await auth()
    if (!userId) {
        if (!token) {
            return null
        } else {
            const user = await getUserFromToken(token, context)
            return user?.id
        }
    }
    return userId
}