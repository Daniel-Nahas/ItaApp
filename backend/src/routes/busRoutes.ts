import { Router } from 'express';
import { listRoutes, addRoute, ensureRoutes, getBusPositions } from '../controllers/busController';
import { authenticateToken } from '../utils/middleware';

const router = Router();

ensureRoutes();

router.get('/', listRoutes);
router.post('/', authenticateToken, addRoute);
router.get('/positions', getBusPositions);

export default router;
