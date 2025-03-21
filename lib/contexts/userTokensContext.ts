import db from "../prisma";
import crypto from 'crypto';
export const getUserFromToken = async (token: string, context: string) => {
    const hash = hashToken(token);
    const tokenRes = await db.userTokens.findFirst({
        where: {
            token: hash,
            context
        },
        include: {
            User: true
        }
    });
    return tokenRes?.User;
}
export const upsertToken = async (userId: string, context: string) => {
    const { token, hash } = generateToken(context);
    //
    await db.userTokens.deleteMany({
        where: {
            userId,
            context
        }
    });
    await db.userTokens.create({
        data: {
            userId,
            token: hash,
            context
        }
    });
    return token;
}
function generateToken(prefix: string): { token: string; hash: string } {
    // Generate a random token (32 bytes = 256 bits, converted to hex = 64 characters)
    const randomToken = prefix + "_" + crypto.randomBytes(32).toString('hex');

    // Create a hash of the token for storage
    // Using SHA-256 for the hash
    const hash = hashToken(randomToken);

    return {
        token: randomToken, // Send this to the client
        hash: hash          // Store this in the database
    };
}
function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}