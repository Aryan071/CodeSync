import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode = 500, message } = err

  logger.error({
    error: {
      message: err.message,
      stack: err.stack,
    },
    request: {
      url: req.url,
      method: req.method,
      ip: req.ip,
    },
  })

  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      message: statusCode === 500 ? 'Internal Server Error' : message,
    })
  } else {
    res.status(statusCode).json({
      message,
      stack: err.stack,
    })
  }
}