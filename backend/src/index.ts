import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

import { connectDatabase } from './config/database'
import { connectRedis } from './config/redis'
import { setupSocket } from './socket'
import authRoutes from './routes/auth'
import roomRoutes from './routes/rooms'
import fileRoutes from './routes/files'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './utils/logger'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)

// Socket.io setup
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}))

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/files', fileRoutes)

// Error handling
app.use(errorHandler)

// Socket setup
setupSocket(io)

// Start server
const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase()
    await connectRedis()
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`)
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`📊 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

startServer()
