import express from 'express';
import {
  getDashboardStats, getAllUsers, banUser, unbanUser, verifyUser,
  approveRoom, rejectRoom, approveJob, approveService,
  featureListing, getPendingListings, getFraudSuspected,
  resolveReport, getAnalytics,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect, authorize('admin', 'ops'));

router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/pending', getPendingListings);
router.get('/fraud', getFraudSuspected);

router.get('/users', getAllUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);
router.put('/users/:id/verify', verifyUser);

router.put('/rooms/:id/approve', approveRoom);
router.put('/rooms/:id/reject', rejectRoom);
router.put('/jobs/:id/approve', approveJob);
router.put('/services/:id/approve', approveService);
router.put('/listings/:id/feature', featureListing);

router.put('/reports/:id/resolve', resolveReport);

export default router;
