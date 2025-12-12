import express from 'express';
import { authenticateToken, requireWorkAdmin } from '../controllers/auth.js';
import {
  listWork,
  createWork,
  applyWork,
  respondWork,
  workDetail,
  myWorkApplications,
} from '../controllers/workController.js';

const router = express.Router();

router.get('/', authenticateToken, listWork);
router.get('/mine', authenticateToken, myWorkApplications);
router.get('/:id', authenticateToken, workDetail);
router.post('/', authenticateToken, requireWorkAdmin, createWork);
router.post('/:id/apply', authenticateToken, applyWork);
router.post('/:id/respond/:userId', authenticateToken, respondWork);

export { router };