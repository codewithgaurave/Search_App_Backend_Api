import express from 'express';
import { createRequirement, getRequirements, deleteRequirement } from '../controllers/requirementController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getRequirements);
router.post('/', protect, createRequirement);
router.delete('/:id', protect, deleteRequirement);

export default router;
