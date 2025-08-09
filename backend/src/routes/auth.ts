import express from 'express'
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import { User } from '../models/User'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = express.Router()

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const { username, email, password } = value

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken' 
      })
    }

    // Create user
    const user = new User({ username, email, password })
    await user.save()

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      token
    })
  } catch (error) {
    next(error)
  }
})

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const { email, password } = value

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Check password
    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Update online status
    user.isOnline = true
    user.lastSeen = new Date()
    await user.save()

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      token
    })
  } catch (error) {
    next(error)
  }
})

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    res.json({
      user: {
        id: req.user!._id,
        username: req.user!.username,
        email: req.user!.email,
        avatar: req.user!.avatar,
        createdAt: req.user!.createdAt
      }
    })
  } catch (error) {
    next(error)
  }
})

// Logout
router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    req.user!.isOnline = false
    req.user!.lastSeen = new Date()
    await req.user!.save()

    res.json({ message: 'Logout successful' })
  } catch (error) {
    next(error)
  }
})

export default router
```

