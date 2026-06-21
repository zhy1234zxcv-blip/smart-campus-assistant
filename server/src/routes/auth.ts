import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register as any);
router.post('/login', login as any);
router.get('/profile', authMiddleware as any, getProfile as any);

export default router;
