import db from "../prisma";

export const getUserFromToken = async (token: string, context: string) => {
    const tokenRes = await db.userTokens.findFirst({
        where: {
            token,
            context
        },
        include: {
            User: true
        }
    });
    return tokenRes?.User;
}