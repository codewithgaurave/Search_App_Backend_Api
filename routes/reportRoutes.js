import express from 'express';
import { createReport, getMyReports } from '../controllers/reportController.js';
import { protect } from '../middlewares/auth.js';
import { uploadImages } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/', protect, uploadImages('reports'), createReport);
router.get('/my', protect, getMyReports);

export default router;
