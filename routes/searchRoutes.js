import express from 'express';
import { globalSearch, getNearbyFeed, getTrending } from '../controllers/searchController.js';

const router = express.Router();

router.get('/', globalSearch);
router.get('/nearby', getNearbyFeed);
router.get('/trending', getTrending);

export default router;
