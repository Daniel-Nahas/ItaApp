// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { 
    register, 
    login, 
    profile, 
    forgotPassword, 
    resetPassword, 
    changePasswordAuthenticated, 
    requestChangePassword, 
    confirmChangePassword 
} from '../controllers/authController';
import { authenticateToken } from '../utils/middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, profile);

// recuperação de senha
router.post('/forgot', forgotPassword);
router.post('/reset', resetPassword);

// alterar senha autenticado (opcional - também existe em userController)
router.post('/change-password', authenticateToken, changePasswordAuthenticated);

router.post('/request-change-password', authenticateToken, requestChangePassword); 
router.post('/confirm-change-password', authenticateToken, confirmChangePassword);

export default router;
