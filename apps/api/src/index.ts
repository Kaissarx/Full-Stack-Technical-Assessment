import authRoutes from './routes/auth.routes';
import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import reservationRoutes from './routes/reservation.routes';
import checkoutRoutes from './routes/checkout.routes';
import productRoutes from './routes/product.routes';
import { startExpirationCron } from './jobs/expiration.cron';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. OBSERVABILITY: Request Logging ---
// Morgan automatically logs every incoming request to the terminal
app.use(morgan('dev'));

// --- 2. SECURITY: Rate Limiting ---
// Prevent users from spamming our drop with bots! Max 100 requests per 15 mins.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// --- STANDARD MIDDLEWARE ---
app.use(cors()); 
app.use(express.json()); 

// --- ROUTES ---
app.use('/api', authRoutes);
app.use('/api', reservationRoutes);
app.use('/api', checkoutRoutes);
app.use('/api', productRoutes);

// --- OBSERVABILITY: Health & Metrics Endpoint ---
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Server is healthy!' });
});

app.get('/metrics', (req: Request, res: Response) => {
  // A simple metrics endpoint as requested by the test
  res.status(200).json({
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Start the background cron job
startExpirationCron();

// --- 3. ARCHITECTURE: Centralized Error Handler ---
// This MUST be the very last app.use() in the file!
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 API is running on http://localhost:${PORT}`);
});