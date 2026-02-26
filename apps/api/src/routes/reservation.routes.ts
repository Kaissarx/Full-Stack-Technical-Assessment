import { Router } from 'express';
import { reserveProduct } from '../controllers/reservation.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// This links the URL POST /reserve to the logic we just wrote
router.post('/reserve', authenticateJWT, reserveProduct);

export default router;