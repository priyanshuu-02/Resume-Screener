import express from 'express';
import {
  googleAuth,
  registerUser,
  loginUser,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/google', googleAuth);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

export default router;
