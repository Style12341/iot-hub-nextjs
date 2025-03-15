import { UserRole } from "@prisma/client"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { auth } from '@clerk/nextjs/server'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const checkRole = async (role: UserRole) => {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata.role === role
}
export const isAdmin = async () => {
  return checkRole('ADMIN')
}