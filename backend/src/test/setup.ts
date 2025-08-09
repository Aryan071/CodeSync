import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { createClient } from 'redis'
import { logger } from '../utils/logger'

let mongoServer: MongoMemoryServer
let redisClient: any

// Setup test database before all tests
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  
  await mongoose.connect(mongoUri)
  
  // Mock Redis for tests
  redisClient = {
    connect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  }
  
  // Silence logger in tests
  logger.transports.forEach(transport => transport.silent = true)
})

// Clean database between tests
beforeEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongoServer.stop()
  
  if (redisClient.quit) {
    await redisClient.quit()
  }
})

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'test'
process.env.REDIS_URL = 'test'

// Export test utilities
export { redisClient }
