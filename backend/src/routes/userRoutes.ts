//backend/routes/userRoutes.ts
import { Router } from 'express';
import {
  fetchUser,
  updateUserProfile,
  updateUserPhoto,
  updateUserPassword
} from '../controllers/userController';
import { authenticateToken } from '../utils/middleware';

const router = Router();

router.get('/:id', authenticateToken, fetchUser);
router.put('/:id', authenticateToken, updateUserProfile);
router.put('/:id/photo', authenticateToken, updateUserPhoto);
router.put('/:id/password', authenticateToken, updateUserPassword);

export default router;
