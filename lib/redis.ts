import Redis from "ioredis";
const redisUrl = process.env.REDIS_URL || "redis://192.168.100.100:6379";
const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});
const redisPub = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});
const redisSub = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});
redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});
redisPub.on('error', (err) => {
    console.error('Redis Pub connection error:', err);
});
redisSub.on('error', (err) => {
    console.error('Redis Sub connection error:', err);
});
export default redis;
export { redisPub, redisSub };