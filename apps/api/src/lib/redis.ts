import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    // Exponential backoff: 500ms, 1000ms, 2000ms, max 16s
    const delay = Math.min(500 * Math.pow(2, times), 16000);
    return delay;
  },
  reconnectOnError(err) {
    const targetErrors = ["READONLY", "ETIMEDOUT", "ECONNRESET"];
    if (targetErrors.some((e) => err.message.includes(e))) {
      return true;
    }
    return false;
  },
});

// Connection event logging
redis.on("connect", () => {
  console.log("[redis] Connecting...");
});

redis.on("ready", () => {
  console.log("[redis] Connected and ready");
});

redis.on("error", (err) => {
  console.error("[redis] Error:", err.message);
});

redis.on("reconnecting", (delay: number) => {
  console.log(`[redis] Reconnecting in ${delay}ms`);
});

redis.on("close", () => {
  console.log("[redis] Connection closed");
});

export default redis;
