import express from 'express';
import { createService, getServices, getServiceById, updateService, deleteService, getMyServices } from '../controllers/serviceController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { uploadImages } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/', getServices);
router.get('/my', protect, getMyServices);
router.get('/:id', getServiceById);
router.post('/', protect, authorize('worker', 'admin'), uploadImages('services'), createService);
router.put('/:id', protect, authorize('worker', 'admin'), updateService);
router.delete('/:id', protect, authorize('worker', 'admin'), deleteService);

export default router;
