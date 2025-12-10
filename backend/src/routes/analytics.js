import express from 'express';
import { authenticateToken, requireAdmin } from '../controllers/auth.js';
import { getAdminAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/admin', authenticateToken, requireAdmin, getAdminAnalytics);

export { router };
