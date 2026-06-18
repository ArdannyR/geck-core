import { Router } from 'express';
import { registerUser, loginUser, confirmEmail, forgotPassword, verifyPasswordToken, resetPassword, googleLogin, googleCallback } from '../controllers/auth_controller.js';

const router = Router();

router.post('/register', registerUser);
router.get('/confirm/:token', confirmEmail);
router.post('/forgot-password', forgotPassword);
router.get('/forgot-password/:token', verifyPasswordToken);
router.post('/reset-password/:token', resetPassword);
router.post('/login', loginUser);
// Enpoints fuera de tesis 
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);

export default router;
