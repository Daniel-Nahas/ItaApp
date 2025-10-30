//backend/routes/userRoutes.ts
import { Router } from 'express';
import {
  fetchUser,
  updateUserProfile,
  updateUserPhoto,
  updateUserPassword,
  getFavoriteRoutes
} from '../controllers/userController';
import { authenticateToken } from '../utils/middleware';

const router = Router();

router.get('/:id', authenticateToken, fetchUser);
router.put('/:id', authenticateToken, updateUserProfile);
router.put('/:id/photo', authenticateToken, updateUserPhoto);
router.put('/:id/password', authenticateToken, updateUserPassword);
router.get('/:id/favorites', authenticateToken, getFavoriteRoutes);

export default router;
