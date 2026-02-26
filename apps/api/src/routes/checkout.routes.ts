import { Router } from 'express';
import { processCheckout } from '../controllers/checkout.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Links the POST /checkout URL to our new logic
router.post('/checkout', authenticateJWT, processCheckout);

export default router;