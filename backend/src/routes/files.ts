import express from 'express'
import Joi from 'joi'
import { File } from '../models/File'
import { Room } from '../models/Room'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = express.Router()

// Validation schemas
const createFileSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  path: Joi.string().required(),
  type: Joi.string().valid('file', 'folder').required(),
  content: Joi.string().optional(),
  language: Joi.string().optional(),
  roomId: Joi.string().required()
})

const updateFileSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  content: Joi.string().optional(),
  language: Joi.string().optional()
})

// Get files for a room
router.get('/room/:roomId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { roomId } = req.params

    // Check if user has access to the room
    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }

    const hasAccess = room.owner.toString() === req.user!._id.toString() ||
      room.collaborators.some(c => c.user.toString() === req.user!._id.toString()) ||
      room.isPublic

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const files = await File.find({ room: roomId })
      .populate('createdBy', 'username')
      .sort({ path: 1 })

    res.json({ files })
  } catch (error) {
    next(error)
  }
})

// Create a new file
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = createFileSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const { name, path, type, content, language, roomId } = value

    // Check if user has access to the room
    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: 'Room not found' })
    }

    const hasAccess = room.owner.toString() === req.user!._id.toString() ||
      room.collaborators.some(c => c.user.toString() === req.user!._id.toString())

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Check if file already exists
    const existingFile = await File.findOne({ room: roomId, path })
    if (existingFile) {
      return res.status(400).json({ message: 'File already exists at this path' })
    }

    // Determine language from file extension if not provided
    let fileLanguage = language
    if (!fileLanguage && type === 'file') {
      const extension = name.split('.').pop()?.toLowerCase()
      const languageMap: { [key: string]: string } = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'rs': 'rust',
        'go': 'go',
        'php': 'php',
        'rb': 'ruby',
        'swift': 'swift',
        'kt': 'kotlin',
        'dart': 'dart',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'sass': 'sass',
        'json': 'json',
        'xml': 'xml',
        'md': 'markdown',
        'txt': 'plaintext',
        'yml': 'yaml',
        'yaml': 'yaml'
      }
      fileLanguage = languageMap[extension || ''] || 'plaintext'
    }

    const file = new File({
      name,
      path,
      type,
      content: content || '',
      language: fileLanguage,
      room: roomId,
      createdBy: req.user!._id
    })

    await file.save()
    await file.populate('createdBy', 'username')

    res.status(201).json({
      message: 'File created successfully',
      file: {
        id: file._id,
        name: file.name,
        path: file.path,
        type: file.type,
        content: file.content,
        language: file.language,
        size: file.size,
        lastModified: file.lastModified,
        createdBy: file.createdBy,
        createdAt: file.createdAt
      }
    })
  } catch (error) {
    next(error)
  }
})

// Get a specific file
router.get('/:fileId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { fileId } = req.params

    const file = await File.findById(fileId)
      .populate('createdBy', 'username')
      .populate('room', 'name owner collaborators isPublic')

    if (!file) {
      return res.status(404).json({ message: 'File not found' })
    }

    // Check if user has access to the file's room
    const room = file.room as any
    const hasAccess = room.owner.toString() === req.user!._id.toString() ||
      room.collaborators.some((c: any) => c.user.toString() === req.user!._id.toString()) ||
      room.isPublic

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json({
      file: {
        id: file._id,
        name: file.name,
        path: file.path,
        type: file.type,
        content: file.content,
        language: file.language,
        size: file.size,
        lastModified: file.lastModified,
        createdBy: file.createdBy,
        createdAt: file.createdAt
      }
    })
  } catch (error) {
    next(error)
  }
})

// Update a file
router.put('/:fileId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { fileId } = req.params
    const { error, value } = updateFileSchema.validate(req.body)
    
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const file = await File.findById(fileId).populate('room', 'owner collaborators')
    if (!file) {
      return res.status(404).json({ message: 'File not found' })
    }

    // Check if user has edit access to the file's room
    const room = file.room as any
    const hasEditAccess = room.owner.toString() === req.user!._id.toString() ||
      room.collaborators.some((c: any) => 
        c.user.toString() === req.user!._id.toString() && 
        (c.role === 'owner' || c.role === 'editor')
      )

    if (!hasEditAccess) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Update file
    if (value.name !== undefined) file.name = value.name
    if (value.content !== undefined) file.content = value.content
    if (value.language !== undefined) file.language = value.language

    await file.save()

    res.json({
      message: 'File updated successfully',
      file: {
        id: file._id,
        name: file.name,
        path: file.path,
        type: file.type,
        content: file.content,
        language: file.language,
        size: file.size,
        lastModified: file.lastModified,
        createdAt: file.createdAt
      }
    })
  } catch (error) {
    next(error)
  }
})

// Delete a file
router.delete('/:fileId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { fileId } = req.params

    const file = await File.findById(fileId).populate('room', 'owner collaborators')
    if (!file) {
      return res.status(404).json({ message: 'File not found' })
    }

    // Check if user has edit access to the file's room
    const room = file.room as any
    const hasEditAccess = room.owner.toString() === req.user!._id.toString() ||
      room.collaborators.some((c: any) => 
        c.user.toString() === req.user!._id.toString() && 
        (c.role === 'owner' || c.role === 'editor')
      )

    if (!hasEditAccess) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await File.findByIdAndDelete(fileId)

    res.json({ message: 'File deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
