import { Request, Response, NextFunction } from 'express';

// Express knows this is a global error handler because it takes exactly 4 arguments
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(`🚨 [ERROR] ${req.method} ${req.url} - ${err.message}`);
  
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // In real life, we hide the stack trace in production for security!
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};