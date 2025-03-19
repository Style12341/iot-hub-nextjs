import Redis from "ioredis";
const redisUrl = process.env.REDIS_URL || "redis://192.168.100.100:6379";
const redis = new Redis(redisUrl);
export default redis;