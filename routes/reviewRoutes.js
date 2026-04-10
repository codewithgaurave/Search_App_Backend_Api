import express from 'express';
import { createReview, getReviews, deleteReview } from '../controllers/reviewController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/:refType/:refId', getReviews);
router.delete('/:id', protect, deleteReview);

export default router;
