import { createClient, RedisClientType } from 'redis'
import { logger } from '../utils/logger'

let redisClient: RedisClientType

export const connectRedis = async (): Promise<void> => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    })
    
    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error)
    })
    
    redisClient.on('connect', () => {
      logger.info('🔗 Connected to Redis')
    })
    
    redisClient.on('reconnecting', () => {
      logger.info('🔄 Reconnecting to Redis')
    })
    
    await redisClient.connect()
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.warn('Redis not available, continuing without cache:', errorMessage)
    // Create a mock Redis client for development
    redisClient = {
      set: async () => 'OK',
      get: async () => null,
      del: async () => 1,
      quit: async () => 'OK',
      isReady: false
    } as any
  }
}

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized')
  }
  return redisClient
}
