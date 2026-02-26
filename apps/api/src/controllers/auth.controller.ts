import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// In production, this ALWAYS goes in the .env file!
const SECRET = process.env.JWT_SECRET || 'super_secret_sneaker_key_123';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, message: 'Please provide a userId to login' });
      return;
    }

    // Sign the VIP wristband (Token)! It will expire in 1 hour.
    const token = jwt.sign({ userId }, SECRET, { expiresIn: '1h' });

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};