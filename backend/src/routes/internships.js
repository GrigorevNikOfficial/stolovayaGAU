import express from 'express';
import { authenticateToken, requireInternshipAdmin } from '../controllers/auth.js';
import {
  listInternships,
  createInternship,
  applyInternship,
  respondInternship,
  internshipDetail,
  myInternshipApplications,
} from '../controllers/internshipController.js';

const router = express.Router();

router.get('/', authenticateToken, listInternships);
router.get('/mine', authenticateToken, myInternshipApplications);
router.get('/:id', authenticateToken, internshipDetail);
router.post('/', authenticateToken, requireInternshipAdmin, createInternship);
router.post('/:id/apply', authenticateToken, applyInternship);
router.post('/:id/respond/:userId', authenticateToken, respondInternship);

export { router };