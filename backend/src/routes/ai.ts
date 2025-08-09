import express from 'express'
import Joi from 'joi'
import { authenticate, AuthRequest } from '../middleware/auth'
import { aiService } from '../services/aiService'
import { logger } from '../utils/logger'

const router = express.Router()

// Validation schemas
const codeCompletionSchema = Joi.object({
  code: Joi.string().required().max(10000),
  language: Joi.string().required().valid(
    'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'rust', 'go',
    'php', 'ruby', 'swift', 'kotlin', 'dart', 'html', 'css', 'json'
  ),
  cursorPosition: Joi.number().required().min(0),
  context: Joi.string().optional().max(500)
})

const codeExplanationSchema = Joi.object({
  code: Joi.string().required().max(5000),
  language: Joi.string().required(),
  lineNumber: Joi.number().optional()
})

const codeReviewSchema = Joi.object({
  code: Joi.string().required().max(10000),
  language: Joi.string().required(),
  fileName: Joi.string().required().max(255)
})

const codeGenerationSchema = Joi.object({
  description: Joi.string().required().max(500),
  language: Joi.string().required()
})

const codeFixSchema = Joi.object({
  code: Joi.string().required().max(5000),
  error: Joi.string().required().max(1000),
  language: Joi.string().required()
})

// Get AI service status
router.get('/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const status = aiService.getStatus()
    res.json({ status })
  } catch (error) {
    next(error)
  }
})

// AI Code Completion
router.post('/complete', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = codeCompletionSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    if (!aiService.isAvailable()) {
      return res.status(503).json({ 
        message: 'AI service unavailable',
        suggestions: [],
        confidence: 0
      })
    }

    const result = await aiService.getCodeCompletion(value)
    
    // Log usage for analytics
    logger.info(`AI completion requested by ${req.user?.username} for ${value.language}`)
    
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('AI completion error:', error)
    next(error)
  }
})

// AI Code Explanation
router.post('/explain', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = codeExplanationSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    if (!aiService.isAvailable()) {
      return res.status(503).json({ 
        message: 'AI service unavailable',
        explanation: 'AI explanation service is currently unavailable'
      })
    }

    const explanation = await aiService.explainCode(value)
    
    logger.info(`AI explanation requested by ${req.user?.username} for ${value.language}`)
    
    res.json({
      success: true,
      explanation,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

// AI Code Review
router.post('/review', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = codeReviewSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    if (!aiService.isAvailable()) {
      return res.status(503).json({ 
        message: 'AI service unavailable',
        suggestions: [],
        overallScore: 0,
        summary: 'AI code review service is currently unavailable'
      })
    }

    const review = await aiService.reviewCode(value)
    
    logger.info(`AI code review requested by ${req.user?.username} for ${value.fileName}`)
    
    res.json({
      success: true,
      ...review,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

// AI Code Generation
router.post('/generate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = codeGenerationSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    if (!aiService.isAvailable()) {
      return res.status(503).json({ 
        message: 'AI service unavailable',
        code: '// AI code generation service is currently unavailable'
      })
    }

    const code = await aiService.generateCodeSuggestion(value.language, value.description)
    
    logger.info(`AI code generation requested by ${req.user?.username} for ${value.language}`)
    
    res.json({
      success: true,
      code,
      language: value.language,
      description: value.description,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

// AI Code Fix
router.post('/fix', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = codeFixSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    if (!aiService.isAvailable()) {
      return res.status(503).json({ 
        message: 'AI service unavailable',
        fixedCode: value.code
      })
    }

    const fixedCode = await aiService.fixCodeError(value.code, value.error, value.language)
    
    logger.info(`AI code fix requested by ${req.user?.username} for ${value.language}`)
    
    res.json({
      success: true,
      originalCode: value.code,
      fixedCode,
      error: value.error,
      language: value.language,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

// Get AI usage analytics (for the user)
router.get('/analytics', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // In a real implementation, you'd track usage in a database
    // For now, return mock data
    const analytics = {
      totalRequests: 42,
      completionRequests: 25,
      explanationRequests: 10,
      reviewRequests: 5,
      generationRequests: 2,
      lastUsed: new Date().toISOString(),
      favoriteLanguage: 'typescript',
      averageResponseTime: '850ms'
    }
    
    res.json({
      success: true,
      analytics,
      user: req.user?.username
    })
  } catch (error) {
    next(error)
  }
})

export default router
