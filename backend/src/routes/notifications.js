import express from 'express';
import {
  getNotificationSummary,
  getPreferences,
  listNotifications,
  markAllRead,
  markNotificationRead,
  markNotificationUnread,
  removeNotification,
  seedSystemNotification,
  updatePreferences,
} from '../controllers/notificationController.js';
import { authenticateToken, requireAdmin } from '../controllers/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', listNotifications);
router.get('/summary', getNotificationSummary);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.post('/read-all', markAllRead);
router.patch('/:id/read', markNotificationRead);
router.patch('/:id/unread', markNotificationUnread);
router.delete('/:id', removeNotification);
router.post('/seed', requireAdmin, seedSystemNotification);

export { router };
