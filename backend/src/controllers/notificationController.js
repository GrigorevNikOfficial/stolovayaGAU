import {
  createUserNotification,
  deleteNotification,
  fetchNotificationFeed,
  getNotificationStats,
  getUserNotificationPreferences,
  markAllNotificationsRead,
  serializeNotification,
  toggleNotificationReadState,
  updateNotificationPreferences,
} from '../services/notificationService.js';

export const listNotifications = async (req, res) => {
  try {
    const { limit, before, category, status } = req.query;
    const unreadOnly = status === 'unread';
    const feed = await fetchNotificationFeed(req.user._id, {
      limit,
      before,
      category,
      unreadOnly,
    });

    res.json(feed);
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ error: 'Не удалось получить уведомления' });
  }
};

export const getNotificationSummary = async (req, res) => {
  try {
    const summary = await getNotificationStats(req.user._id);
    res.json(summary);
  } catch (error) {
    console.error('Notification summary error:', error);
    res.status(500).json({ error: 'Не удалось получить статистику уведомлений' });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await toggleNotificationReadState({
      userId: req.user._id,
      notificationId: req.params.id,
      read: true,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    res.json({ notification: serializeNotification(notification) });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Не удалось обновить статус уведомления' });
  }
};

export const markNotificationUnread = async (req, res) => {
  try {
    const notification = await toggleNotificationReadState({
      userId: req.user._id,
      notificationId: req.params.id,
      read: false,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    res.json({ notification: serializeNotification(notification) });
  } catch (error) {
    console.error('Mark notification unread error:', error);
    res.status(500).json({ error: 'Не удалось обновить статус уведомления' });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const { updated } = await markAllNotificationsRead(req.user._id);
    res.json({ updated });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Не удалось обновить уведомления' });
  }
};

export const removeNotification = async (req, res) => {
  try {
    const removed = await deleteNotification({
      userId: req.user._id,
      notificationId: req.params.id,
    });

    if (!removed) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Не удалось удалить уведомление' });
  }
};

export const getPreferences = async (req, res) => {
  try {
    const preferences = await getUserNotificationPreferences(req.user._id);
    res.json(preferences);
  } catch (error) {
    console.error('Notification preferences error:', error);
    res.status(500).json({ error: 'Не удалось получить настройки уведомлений' });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const updated = await updateNotificationPreferences(req.user._id, req.body || {});
    res.json(updated);
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Не удалось обновить настройки уведомлений' });
  }
};

export const seedSystemNotification = async (req, res) => {
  try {
    const { title, body, userId, category, severity } = req.body || {};

    if (!title || !body || !userId) {
      return res.status(400).json({ error: 'Необходимо указать title, body и userId' });
    }

    const created = await createUserNotification({
      userId,
      title,
      body,
      category,
      severity,
      type: 'manual',
    });

    res.status(201).json({ notification: serializeNotification(created) });
  } catch (error) {
    console.error('Seed notification error:', error);
    res.status(500).json({ error: 'Не удалось создать уведомление' });
  }
};
