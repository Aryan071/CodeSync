import express from 'express'
import Joi from 'joi'
import { Room } from '../models/Room'
import { File } from '../models/File'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = express.Router()

// Validation schemas
const createRoomSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  isPublic: Joi.boolean().default(false),
  settings: Joi.object({
    allowGuests: Joi.boolean().default(false),
    maxCollaborators: Joi.number().min(1).max(50).default(10),
    language: Joi.string().default('javascript')
  }).optional()
})

// Create room
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = createRoomSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const room = new Room({
      ...value,
      owner: req.user!._id,
      collaborators: [{
        user: req.user!._id,
        role: 'owner',
        joinedAt: new Date()
      }]
    })

    await room.save()
    await room.populate('owner collaborators.user', 'username email avatar')

    // Create default files
    const defaultFiles = [
      {
        name: 'index.js',
        path: '/index.js',
        type: 'file' as const,
        content: '// Welcome to CodeSync!\nconsole.log("Hello, World!");',
        language: 'javascript',
        room: room._id,
        createdBy: req.user!._id
      },
      {
        name: 'README.md',
        path: '/README.md',
        type: 'file' as const,
        content: '# My CodeSync Project\n\nStart coding collaboratively!',
        language: 'markdown',
        room: room._id,
        createdBy: req.user!._id
      }
    ]

    await File.insertMany(defaultFiles)

    res.status(201).json({
      message: 'Room created successfully',
      room
    })
  } catch (error) {
    next(error)
  }
})

// Get user's rooms
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const rooms = await Room.find({
      $or: [
        { owner: req.user!._id },
        { 'collaborators.user': req.user!._id }
      ]
    })
    .populate('owner collaborators.user', 'username email avatar')
    .sort({ updatedAt: -1 })

    res.json({ rooms })
  } catch (error) {
    next(error)
  }
})

// Get room by ID
router.get('/:roomId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('owner collaborators.user', 'username email avatar')

    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }

    // Check if user has access
    const hasAccess = room.owner._id.toString() === req.user!._id.toString() ||
      room.collaborators.some(c => c.user._id.toString() === req.user!._id.toString()) ||
      room.isPublic

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Get room files
    const files = await File.find({ room: room._id })
      .populate('createdBy', 'username')
      .sort({ path: 1 })

    res.json({ room, files })
  } catch (error) {
    next(error)
  }
})

// Join room
router.post('/:roomId/join', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const room = await Room.findById(req.params.roomId)

    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }

    // Check if already a collaborator
    const isCollaborator = room.collaborators.some(
      c => c.user.toString() === req.user!._id.toString()
    )

    if (isCollaborator) {
      return res.status(400).json({ message: 'Already a collaborator' })
    }

    // Check if room is public or user has permission
    if (!room.isPublic && !room.settings.allowGuests) {
      return res.status(403).json({ message: 'Room is private' })
    }

    // Check collaborator limit
    if (room.collaborators.length >= room.settings.maxCollaborators) {
      return res.status(400).json({ message: 'Room is full' })
    }

    // Add user as collaborator
    room.collaborators.push({
      user: req.user!._id,
      role: 'editor',
      joinedAt: new Date()
    })

    await room.save()
    await room.populate('owner collaborators.user', 'username email avatar')

    res.json({
      message: 'Joined room successfully',
      room
    })
  } catch (error) {
    next(error)
  }
})

// Leave room
router.post('/:roomId/leave', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const room = await Room.findById(req.params.roomId)

    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }

    // Can't leave if owner
    if (room.owner.toString() === req.user!._id.toString()) {
      return res.status(400).json({ message: 'Owner cannot leave room' })
    }

    // Remove from collaborators
    room.collaborators = room.collaborators.filter(
      c => c.user.toString() !== req.user!._id.toString()
    )

    await room.save()

    res.json({ message: 'Left room successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
```

```

### 11. Socket.io Implementation

```typescript:CodeSync/backend/src/socket/index.ts
import { Server as SocketServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import { Room } from '../models/Room'
import { File } from '../models/File'
import { logger } from '../utils/logger'
import { OperationTransform } from '../services/operationTransform'

interface AuthenticatedSocket extends SocketIO.Socket {
  userId?: string
  username?: string
  currentRoom?: string
}

const connectedUsers = new Map<string, {
  socketId: string
  userId: string
  username: string
  roomId?: string
}>()

export const setupSocket = (io: SocketServer) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        throw new Error('No token provided')
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      const user = await User.findById(decoded.userId)

      if (!user) {
        throw new Error('Invalid token')
      }

      socket.userId = user._id.toString()
      socket.username = user.username
      
      // Update user online status
      user.isOnline = true
      user.lastSeen = new Date()
      await user.save()

      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User ${socket.username} connected (${socket.id})`)

    // Store connected user
    connectedUsers.set(socket.id, {
      socketId: socket.id,
      userId: socket.userId!,
      username: socket.username!
    })

    // Join room
    socket.on('room:join', async (data: { roomId: string }) => {
      try {
        const { roomId } = data

        // Verify room access
        const room = await Room.findById(roomId)
        if (!room) {
          socket.emit('error', { message: 'Room not found' })
          return
        }

        const hasAccess = room.owner.toString() === socket.userId ||
          room.collaborators.some(c => c.user.toString() === socket.userId) ||
          room.isPublic

        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' })
          return
        }

        // Leave previous room if any
        if (socket.currentRoom) {
          socket.leave(socket.currentRoom)
          socket.to(socket.currentRoom).emit('room:user-left', {
            userId: socket.userId,
            username: socket.username
          })
        }

        // Join new room
        socket.join(roomId)
        socket.currentRoom = roomId

        // Update connected user info
        const userInfo = connectedUsers.get(socket.id)
        if (userInfo) {
          userInfo.roomId = roomId
          connectedUsers.set(socket.id, userInfo)
        }

        // Get room files
        const files = await File.find({ room: roomId }).sort({ path: 1 })

        // Notify user they joined
        socket.emit('room:joined', {
          roomId,
          files: files.map(file => ({
            id: file._id,
            name: file.name,
            path: file.path,
            type: file.type,
            content: file.content,
            language: file.language,
            lastModified: file.lastModified
          }))
        })

        // Notify others
        socket.to(roomId).emit('room:user-joined', {
          userId: socket.userId,
          username: socket.username
        })

        logger.info(`User ${socket.username} joined room ${roomId}`)
      } catch (error) {
        logger.error('Error joining room:', error)
        socket.emit('error', { message: 'Failed to join room' })
      }
    })

    // Leave room
    socket.on('room:leave', () => {
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('room:user-left', {
          userId: socket.userId,
          username: socket.username
        })
        socket.leave(socket.currentRoom)
        socket.currentRoom = undefined

        // Update connected user info
        const userInfo = connectedUsers.get(socket.id)
        if (userInfo) {
          delete userInfo.roomId
          connectedUsers.set(socket.id, userInfo)
        }
      }
    })

    // File operations
    socket.on('file:create', async (data: {
      name: string
      type: 'file' | 'folder'
      path: string
      content?: string
    }) => {
      try {
        if (!socket.currentRoom) {
          socket.emit('error', { message: 'Not in a room' })
          return
        }

        const file = new File({
          name: data.name,
          path: data.path,
          type: data.type,
          content: data.content || '',
          room: socket.currentRoom,
          createdBy: socket.userId
        })

        await file.save()

        const fileData = {
          id: file._id,
          name: file.name,
          path: file.path,
          type: file.type,
          content: file.content,
          language: file.language,
          lastModified: file.lastModified
        }

        // Broadcast to all users in room
        io.to(socket.currentRoom).emit('file:created', fileData)
        
        logger.info(`File ${data.name} created in room ${socket.currentRoom}`)
      } catch (error) {
        logger.error('Error creating file:', error)
        socket.emit('error', { message: 'Failed to create file' })
      }
    })

    socket.on('file:update', async (data: {
      fileId: string
      content: string
    }) => {
      try {
        if (!socket.currentRoom) {
          socket.emit('error', { message: 'Not in a room' })
          return
        }

        const file = await File.findOne({
          _id: data.fileId,
          room: socket.currentRoom
        })

        if (!file) {
          socket.emit('error', { message: 'File not found' })
          return
        }

        file.content = data.content
        file.lastModified = new Date()
        await file.save()

        // Broadcast to others (not sender)
        socket.to(socket.currentRoom).emit('file:updated', {
          fileId: data.fileId,
          updates: {
            content: data.content,
            lastModified: file.lastModified
          }
        })
      } catch (error) {
        logger.error('Error updating file:', error)
        socket.emit('error', { message: 'Failed to update file' })
      }
    })

    socket.on('file:delete', async (data: { fileId: string }) => {
      try {
        if (!socket.currentRoom) {
          socket.emit('error', { message: 'Not in a room' })
          return
        }

        await File.findOneAndDelete({
          _id: data.fileId,
          room: socket.currentRoom
        })

        // Broadcast to all users in room
        io.to(socket.currentRoom).emit('file:deleted', { fileId: data.fileId })
        
        logger.info(`File ${data.fileId} deleted from room ${socket.currentRoom}`)
      } catch (error) {
        logger.error('Error deleting file:', error)
        socket.emit('error', { message: 'Failed to delete file' })
      }
    })

    // Cursor tracking
    socket.on('cursor:update', (data: {
      fileId: string
      position: { line: number; column: number }
      selection?: {
        startLine: number
        startColumn: number
        endLine: number
        endColumn: number
      }
    }) => {
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('cursor:update', {
          userId: socket.userId,
          cursor: {
            userId: socket.userId,
            username: socket.username,
            position: data.position,
            selection: data.selection,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}` // Random color
          }
        })
      }
    })

    // Operation Transformation (simplified for now)
    socket.on('operation:send', async (operation: {
      type: 'insert' | 'delete' | 'retain'
      position: number
      content?: string
      length?: number
      fileId: string
    }) => {
      if (socket.currentRoom) {
        const transformedOperation = {
          ...operation,
          id: Date.now().toString(),
          author: socket.userId!,
          timestamp: Date.now()
        }

        // Broadcast to others
        socket.to(socket.currentRoom).emit('operation:apply', transformedOperation)
        
        // Apply to file (simplified - in production, this would use proper OT)
        try {
          const file = await File.findById(operation.fileId)
          if (file && file.room.toString() === socket.currentRoom) {
            // Apply operation to file content
            if (operation.type === 'insert' && operation.content) {
              const pos = operation.position
              file.content = file.content.slice(0, pos) + operation.content + file.content.slice(pos)
            } else if (operation.type === 'delete' && operation.length) {
              const pos = operation.position
              file.content = file.content.slice(0, pos) + file.content.slice(pos + operation.length)
            }
            
            file.lastModified = new Date()
            await file.save()
          }
        } catch (error) {
          logger.error('Error applying operation:', error)
        }
      }
    })

    // Disconnect handling
    socket.on('disconnect', async () => {
      logger.info(`User ${socket.username} disconnected`)

      // Remove from connected users
      connectedUsers.delete(socket.id)

      // Notify room if user was in one
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('room:user-left', {
          userId: socket.userId,
          username: socket.username
        })
      }

      // Update user offline status
      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        })
      } catch (error) {
        logger.error('Error updating user offline status:', error)
      }
    })
  })
}
```

### 12. Frontend Pages

```typescript:CodeSync/frontend/src/pages/LandingPage.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CodeBracketIcon, 
  UsersIcon, 
  LightBulbIcon,
  RocketLaunchIcon,
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CodeBracketIcon className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CodeSync</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/auth" 
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/auth" 
              className="btn-primary"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Code Together, 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}Create Together
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            A powerful real-time collaborative code editor that brings developers together. 
            Write, edit, and debug code simultaneously with your team, anywhere in the world.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link 
              to="/auth" 
              className="btn-primary text-lg px-8 py-3 flex items-center space-x-2"
            >
              <RocketLaunchIcon className="h-5 w-5" />
              <span>Start Coding Now</span>
            </Link>
            <button className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white flex items-center space-x-2 transition-colors">
              <EyeIcon className="h-5 w-5" />
              <span>Watch Demo</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything you need for collaborative coding
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Powerful features designed for modern development teams
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-700">
        <div className="container mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to revolutionize your coding workflow?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already collaborating seamlessly with CodeSync.
            </p>
            <Link 
              to="/auth" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center space-x-2"
            >
              <SparklesIcon className="h-5 w-5" />
              <span>Get Started Free</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <CodeBracketIcon className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold">CodeSync</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2024 CodeSync. Built with ❤️ for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: 'Real-time Collaboration',
    description: 'See changes instantly as your team types. No refresh needed, no conflicts.',
    icon: UsersIcon,
  },
  {
    title: 'Smart Code Intelligence',
    description: 'AI-powered code completion, error detection, and intelligent suggestions.',
    icon: LightBulbIcon,
  },
  {
    title: 'Multi-language Support',
    description: 'Syntax highlighting and IntelliSense for 50+ programming languages.',
    icon: CodeBracketIcon,
  },
  {
    title: 'Live Cursor Tracking',
    description: 'See exactly where your teammates are working in real-time.',
    icon: EyeIcon,
  },
  {
    title: 'Instant Deployment',
    description: 'Deploy your collaborative projects with one click to the cloud.',
    icon: RocketLaunchIcon,
  },
  {
    title: 'Version History',
    description: 'Complete change history with the ability to revert to any previous version.',
    icon: SparklesIcon,
  },
]

export default LandingPage
```

```

