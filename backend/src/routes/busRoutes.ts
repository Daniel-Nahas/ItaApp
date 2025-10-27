//backend/src/routes/busRoutes.ts
import { Router } from 'express';
import { listRoutes, addRoute } from '../controllers/busController';
import { authenticateToken } from '../utils/middleware';
import { getBusPositions } from '../controllers/busController';

const router = Router();

router.get('/', listRoutes);
router.post('/', authenticateToken, addRoute);
router.get('/positions', getBusPositions);


export default router;
