export const config = {
    redisUrl: process.env.REDIS_URL,
    mongodbDefaultUri: process.env.MONGODB_URI,
    mongodbDefaultCollection: process.env.MONGODB_COLLECTION || 'UNLIMCLOUD',
    maxPoolSize: parseInt(process.env.MAX_POOL_SIZE || '10', 10),
    minPoolSize: parseInt(process.env.MIN_POOL_SIZE || '2', 10),
    sessionTimeoutMs: parseInt(process.env.SESSION_TIMEOUT_MS || '86400000', 10), // 24 hours
    telegramApiTokenEnv: process.env.BOT_TOKEN || '',
  };