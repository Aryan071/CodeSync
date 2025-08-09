import jwt from 'jsonwebtoken'
import { User, IUser } from '../models/User'
import { Room, IRoom } from '../models/Room'
import { File, IFile } from '../models/File'
import { Types } from 'mongoose'

// Test data factories
export const createTestUser = async (overrides: Partial<IUser> = {}): Promise<IUser> => {
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    ...overrides
  }
  
  const user = new User(userData)
  await user.save()
  return user
}

export const createTestRoom = async (owner: IUser, overrides: Partial<IRoom> = {}): Promise<IRoom> => {
  const roomData = {
    name: 'Test Room',
    description: 'A test room',
    owner: owner._id,
    collaborators: [{
      user: owner._id,
      role: 'owner' as const,
      joinedAt: new Date()
    }],
    isPublic: false,
    settings: {
      allowGuests: false,
      maxCollaborators: 10,
      language: 'javascript'
    },
    ...overrides
  }
  
  const room = new Room(roomData)
  await room.save()
  return room
}

export const createTestFile = async (room: IRoom, creator: IUser, overrides: Partial<IFile> = {}): Promise<IFile> => {
  const fileData = {
    name: 'test.js',
    path: '/test.js',
    type: 'file' as const,
    content: 'console.log("Hello World");',
    language: 'javascript',
    room: room._id,
    createdBy: creator._id,
    ...overrides
  }
  
  const file = new File(fileData)
  await file.save()
  return file
}

// Authentication helpers
export const generateTestToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '1h' })
}

export const createAuthHeaders = (user: IUser) => {
  const token = generateTestToken(user._id.toString())
  return {
    Authorization: `Bearer ${token}`
  }
}

// Mock Socket.io
export const createMockSocket = () => {
  const mockSocket = {
    id: 'socket-123',
    userId: 'user-123',
    username: 'testuser',
    currentRoom: undefined,
    emit: jest.fn(),
    to: jest.fn(() => mockSocket),
    join: jest.fn(),
    leave: jest.fn(),
    on: jest.fn(),
    handshake: {
      auth: {
        token: 'test-token'
      }
    }
  }
  
  return mockSocket
}

export const createMockIo = () => {
  const mockIo = {
    emit: jest.fn(),
    to: jest.fn(() => mockIo),
    use: jest.fn(),
    on: jest.fn()
  }
  
  return mockIo
}

// Database helpers
export const clearDatabase = async () => {
  await User.deleteMany({})
  await Room.deleteMany({})
  await File.deleteMany({})
}

export const generateObjectId = () => new Types.ObjectId()

// Validation helpers
export const expectValidationError = (response: any, field: string) => {
  expect(response.status).toBe(400)
  expect(response.body.message).toContain(field)
}

export const expectUnauthorized = (response: any) => {
  expect(response.status).toBe(401)
  expect(response.body.message).toContain('token')
}

export const expectForbidden = (response: any) => {
  expect(response.status).toBe(403)
  expect(response.body.message).toContain('Access denied')
}

export const expectNotFound = (response: any, resource: string = 'not found') => {
  expect(response.status).toBe(404)
  expect(response.body.message).toContain(resource)
}

// Time helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockDate = (date: string | Date) => {
  const mockDate = new Date(date)
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any)
  return mockDate
}

// Mock external services
export const mockOpenAI = () => {
  return {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{
          text: 'mocked completion'
        }]
      })
    }
  }
}

// Error simulation helpers
export const simulateNetworkError = () => {
  throw new Error('Network Error')
}

export const simulateDatabaseError = () => {
  throw new Error('Database connection failed')
}

// Performance helpers
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = Date.now()
  await fn()
  return Date.now() - start
}
