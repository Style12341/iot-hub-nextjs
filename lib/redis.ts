import Redis from "ioredis";
const redisUrl = process.env.REDIS_URL || "redis://192.168.100.100:6379";
const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});
redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});
export default redis;