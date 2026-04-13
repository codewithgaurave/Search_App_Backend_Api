import express from 'express';
import {
  sendOtp, verifyOtp, resendOtp, adminLogin,
  logout, getMe, updateProfile,
  toggleAvailability, getWallet, getPublicProfile,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { uploadAvatar } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// OTP Auth (users, owners, workers)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// Admin/Ops password login
router.post('/admin-login', adminLogin);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/profile/:id', getPublicProfile);
router.put('/update-profile', protect, uploadAvatar('avatars'), updateProfile);
router.put('/toggle-availability', protect, toggleAvailability);
router.get('/wallet', protect, getWallet);

export default router;
