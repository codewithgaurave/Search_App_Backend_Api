import express from 'express';
import {
  createJob, getJobs, getJobById, applyJob,
  updateApplicantStatus, updateJob, deleteJob, getMyJobs, getAppliedJobs,
} from '../controllers/jobController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getJobs);
router.get('/my', protect, getMyJobs);
router.get('/applied', protect, getAppliedJobs);
router.get('/:id', getJobById);
router.post('/', protect, createJob);
router.post('/:id/apply', protect, applyJob);
router.put('/:id/applicant/:userId/status', protect, updateApplicantStatus);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);

export default router;
