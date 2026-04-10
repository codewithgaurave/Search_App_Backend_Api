import express from 'express';
import { getOrCreateChat, getMyChats, getChatMessages, sendMessage } from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, getOrCreateChat);
router.get('/', protect, getMyChats);
router.get('/:id/messages', protect, getChatMessages);
router.post('/:id/messages', protect, sendMessage);

export default router;
