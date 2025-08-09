import { Server as SocketServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import { Room } from '../models/Room'
import { File } from '../models/File'
import { logger } from '../utils/logger'
import { OperationTransform, ConflictResolver, Operation } from '../services/operationTransform'

interface AuthenticatedSocket extends Socket {
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

// Global conflict resolver for handling OT
const conflictResolver = new ConflictResolver()

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

    // Setup all socket event handlers
    setupRoomHandlers(socket, io)
    setupFileHandlers(socket, io)
    setupCollaborationHandlers(socket, io)
    setupDisconnectHandler(socket)
  })
}

function setupRoomHandlers(socket: AuthenticatedSocket, io: SocketServer) {
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
}

function setupFileHandlers(socket: AuthenticatedSocket, io: SocketServer) {
  // File creation
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

      // Determine language from file extension
      let language = 'plaintext'
      if (data.type === 'file') {
        const extension = data.name.split('.').pop()?.toLowerCase()
        const languageMap: { [key: string]: string } = {
          'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
          'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'rs': 'rust',
          'go': 'go', 'php': 'php', 'rb': 'ruby', 'swift': 'swift', 'kt': 'kotlin',
          'dart': 'dart', 'html': 'html', 'css': 'css', 'scss': 'scss', 'sass': 'sass',
          'json': 'json', 'xml': 'xml', 'md': 'markdown', 'txt': 'plaintext',
          'yml': 'yaml', 'yaml': 'yaml'
        }
        language = languageMap[extension || ''] || 'plaintext'
      }

      const file = new File({
        name: data.name,
        path: data.path,
        type: data.type,
        content: data.content || '',
        language,
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

  // File deletion
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
}

function setupCollaborationHandlers(socket: AuthenticatedSocket, io: SocketServer) {
  // Basic file update
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
          color: generateUserColor(socket.userId!)
        }
      })
    }
  })
}

function setupDisconnectHandler(socket: AuthenticatedSocket) {
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
}

// Generate a consistent color for a user
function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}
