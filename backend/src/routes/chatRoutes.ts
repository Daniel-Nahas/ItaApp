//backend/routes/chatRoutes.ts
import { Router } from 'express';
import { sendMessage, getMessages } from '../controllers/chatController';
import { authenticateToken } from '../utils/middleware';

const router = Router();

router.post('/', authenticateToken, sendMessage);
router.get('/:routeId', authenticateToken, getMessages);

export default router;
