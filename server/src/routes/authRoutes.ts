import { Router } from 'express';
import { login, signup, customerSignup, logout, getMe, forgotPassword, verifyResetToken, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/customer-signup', customerSignup);
router.post('/customer/signup', customerSignup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);

export default router;
