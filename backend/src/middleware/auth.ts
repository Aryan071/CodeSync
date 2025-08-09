import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User, IUser } from '../models/User'

export interface AuthRequest extends Request {
  user?: IUser
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
}

export const authorize = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // This will be implemented when we add room-based permissions
    next()
  }
}
```

