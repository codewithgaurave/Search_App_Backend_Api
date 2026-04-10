import express from 'express';
import {
  createRoom, getRooms, getRoomById, updateRoom,
  deleteRoom, getMyRooms, toggleRoomAvailability, trackContactView,
} from '../controllers/roomController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { uploadImages } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/', getRooms);
router.get('/my', protect, getMyRooms);
router.get('/:id', getRoomById);
router.post('/', protect, authorize('owner', 'admin', 'ops'), uploadImages('rooms'), createRoom);
router.put('/:id', protect, authorize('owner', 'admin'), uploadImages('rooms'), updateRoom);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteRoom);
router.put('/:id/toggle-availability', protect, authorize('owner', 'admin'), toggleRoomAvailability);
router.post('/:id/contact-view', protect, trackContactView);

export default router;
