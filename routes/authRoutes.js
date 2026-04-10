import express from 'express';
import {
  register, login, logout, getMe, updateProfile,
  toggleAvailability, changePassword, getWallet, getPublicProfile,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { uploadAvatar } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/profile/:id', getPublicProfile);
router.put('/update-profile', protect, uploadAvatar('avatars'), updateProfile);
router.put('/toggle-availability', protect, toggleAvailability);
router.put('/change-password', protect, changePassword);
router.get('/wallet', protect, getWallet);

export default router;
