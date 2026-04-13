import express from 'express';
import {
  getCategories,
  createJob,
  getJobs,
  getJobById,
  showInterest,
  withdrawInterest,
  getInterestedWorkers,
  contactWorker,
  selectWorker,
  completeJob,
  cancelJob,
  getMyPostedJobs,
  getMyInterestedJobs,
  getJobHistory,
  updateJob,
  deleteJob,
} from '../controllers/jobController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { uploadImages } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// ── Public ──────────────────────────────────────────────────
router.get('/categories', getCategories);
router.get('/', getJobs);
router.get('/:id', getJobById);

// ── User/Owner — Job post karo ───────────────────────────────
router.post('/', protect, authorize('user', 'owner', 'admin', 'ops'), uploadImages('jobs'), createJob);
router.put('/:id', protect, authorize('user', 'owner', 'admin', 'ops'), uploadImages('jobs'), updateJob);
router.delete('/:id', protect, authorize('user', 'owner', 'admin', 'ops'), deleteJob);

// ── User/Owner — Job manage karo ────────────────────────────
router.get('/my/posted', protect, authorize('user', 'owner', 'admin', 'ops'), getMyPostedJobs);
router.get('/my/history', protect, getJobHistory);
router.get('/:id/interested-workers', protect, authorize('user', 'owner', 'admin', 'ops'), getInterestedWorkers);
router.post('/:id/contact/:workerId', protect, authorize('user', 'owner', 'admin', 'ops'), contactWorker);
router.put('/:id/select/:workerId', protect, authorize('user', 'owner', 'admin', 'ops'), selectWorker);
router.put('/:id/complete', protect, authorize('user', 'owner', 'admin', 'ops'), completeJob);
router.put('/:id/cancel', protect, authorize('user', 'owner', 'admin', 'ops'), cancelJob);

// ── Worker — Job dhundho aur interest dikhao ─────────────────
router.post('/:id/interest', protect, authorize('worker'), showInterest);
router.delete('/:id/interest', protect, authorize('worker'), withdrawInterest);
router.get('/my/interested', protect, authorize('worker'), getMyInterestedJobs);

export default router;
