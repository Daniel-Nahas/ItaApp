import { Router } from 'express';
import {
  fetchUser,
  updateUserProfile,
  updateUserPhoto,
  updateUserPassword,
  getFavoriteRoutes,
  deleteAccount,
  registerRouteSearch
} from '../controllers/userController';
import { requestEmailChange, confirmEmailChange } from '../controllers/userEmailController';
import { authenticateToken } from '../utils/middleware';

const router = Router();

router.get('/:id', authenticateToken, fetchUser);
router.put('/:id', authenticateToken, updateUserProfile);
router.put('/:id/photo', authenticateToken, updateUserPhoto);
router.put('/:id/password', authenticateToken, updateUserPassword);
router.get('/:id/favorites', authenticateToken, getFavoriteRoutes);
router.post('/email/change-request', authenticateToken, requestEmailChange);
router.post('/email/confirm', confirmEmailChange);
router.delete('/me', authenticateToken, deleteAccount);
router.post('/route-search', authenticateToken, registerRouteSearch);
router.get('/me/favorites', authenticateToken, getFavoriteRoutes);

export default router;