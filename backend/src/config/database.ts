import mongoose from 'mongoose'
import { logger } from '../utils/logger'

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/codesync'
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    
    logger.info('📊 Connected to MongoDB')
    
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error)
    })
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected')
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to connect to MongoDB:', errorMessage)
    logger.warn('⚠️  Running without database - some features will be limited')
    // Don't throw error in development mode
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
  }
}

