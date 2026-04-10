import express from 'express';
import { getNotifications, markAllRead, deleteNotification } from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.delete('/:id', protect, deleteNotification);

export default router;
