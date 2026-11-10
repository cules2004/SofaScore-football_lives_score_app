// Bên trong file: routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser, googleLogin, forgotPassword, resetPassword} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:id/:token', resetPassword);

export default router;