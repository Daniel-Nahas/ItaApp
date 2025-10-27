//backend/src/routes/busRoutes.ts
import { Router } from 'express';
import { listRoutes, addRoute } from '../controllers/busController';
import { authenticateToken } from '../utils/middleware';

const router = Router();

router.get('/', listRoutes);
router.post('/', authenticateToken, addRoute);

export default router;
