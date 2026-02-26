import { Router } from 'express';
import { login } from '../controllers/auth.controller';

const router = Router();

// Our new login route!
router.post('/login', login);

export default router;