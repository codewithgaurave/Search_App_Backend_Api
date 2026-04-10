import express from 'express';
import { createBooking, getMyBookings, getReceivedBookings, updateBookingStatus } from '../controllers/bookingController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/received', protect, getReceivedBookings);
router.put('/:id/status', protect, updateBookingStatus);

export default router;
