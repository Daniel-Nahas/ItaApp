//backend/routes/feedbackRoutes.ts
import { Router } from 'express';
import { addFeedback } from '../controllers/feedbackController';
import { authenticateToken } from '../utils/middleware';

const router = Router();

router.post('/', authenticateToken, addFeedback);

export default router;
