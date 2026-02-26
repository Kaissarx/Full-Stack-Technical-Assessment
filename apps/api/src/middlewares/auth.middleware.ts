import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'super_secret_sneaker_key_123';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  // Look for the "Authorization: Bearer <token>" header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    return;
  }

  // Split the string to grab just the token part
  const token = authHeader.split(' ')[1];

  try {
    // Verify it! If it's fake or expired, this will throw an error
    const decoded = jwt.verify(token, SECRET) as { userId: string };
    
    // Pass the safe userId down to our controllers
    res.locals.userId = decoded.userId; 
    
    next(); // Let them pass!
  } catch (error) {
    res.status(403).json({ success: false, message: 'Forbidden: Invalid or expired token' });
  }
};