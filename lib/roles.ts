import { auth } from "@clerk/nextjs/server"
import { UserRole } from "@prisma/client"

export const checkRole = async (role: UserRole) => {
    const { sessionClaims } = await auth()
    return sessionClaims?.metadata.role === role
}
export const isAdmin = async () => {
    return checkRole('ADMIN')
}