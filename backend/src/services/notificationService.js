import { Notification } from "../models/Notification.js";
import { NotificationPreference } from "../models/NotificationPreference.js";
import {
  emitNotificationCreated,
  emitNotificationUpdated,
} from "./socketService.js";

const DEFAULT_CATEGORIES = [
  "orders",
  "marketplace",
  "system",
  "chat",
  "balance",
  "topups",
  "events",
];
const DEFAULT_SEVERITY = "info";

const cloneDefaultCategories = () => {
  const map = {};
  DEFAULT_CATEGORIES.forEach((category) => {
    map[category] = true;
  });
  return map;
};

const ensureMapFlag = (bucket, key, fallback = true) => {
  if (!bucket) {
    return fallback;
  }

  if (typeof bucket.get === "function") {
    const mapValue = bucket.get(key);
    if (typeof mapValue === "boolean") {
      return mapValue;
    }
  }

  if (Object.prototype.hasOwnProperty.call(bucket, key)) {
    const value = bucket[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return fallback;
};

const timeStringToMinutes = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const isWithinQuietHours = (preferences) => {
  if (!preferences?.quietHours?.enabled) {
    return false;
  }

  const fromMinutes =
    timeStringToMinutes(preferences.quietHours.from) ?? 22 * 60;
  const toMinutes = timeStringToMinutes(preferences.quietHours.to) ?? 8 * 60;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (fromMinutes === toMinutes) {
    return false;
  }

  if (fromMinutes < toMinutes) {
    return currentMinutes >= fromMinutes && currentMinutes < toMinutes;
  }

  return currentMinutes >= fromMinutes || currentMinutes < toMinutes;
};

const shouldMuteNotification = (preferences, category) => {
  if (!preferences) {
    return false;
  }

  if (preferences.mutedUntil && new Date(preferences.mutedUntil) > new Date()) {
    return true;
  }

  if (category && !ensureMapFlag(preferences.categories, category, true)) {
    return true;
  }

  return isWithinQuietHours(preferences);
};

const normalizeNotificationDoc = (doc) => {
  if (!doc) {
    return null;
  }

  const raw =
    typeof doc.toObject === "function"
      ? doc.toObject({ versionKey: false })
      : doc;

  return {
    id: raw._id?.toString?.() ?? raw._id,
    userId: raw.userId?.toString?.() ?? raw.userId,
    title: raw.title,
    body: raw.body,
    category: raw.category,
    severity: raw.severity,
    type: raw.type,
    topic: raw.topic,
    icon: raw.icon,
    actionLabel: raw.actionLabel,
    actionUrl: raw.actionUrl,
    sourceId: raw.sourceId ?? null,
    metadata: raw.metadata ?? {},
    read: Boolean(raw.read),
    readAt: raw.readAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    muted: Boolean(raw.muted),
    expiresAt: raw.expiresAt ?? null,
  };
};

export const ensureNotificationPreferences = async (userId) => {
  if (!userId) {
    throw new Error("USER_ID_REQUIRED");
  }

  const existing = await NotificationPreference.findOne({ userId });
  if (existing) {
    const mergedCategories = { ...cloneDefaultCategories() };
    if (existing.categories) {
      DEFAULT_CATEGORIES.forEach((category) => {
        mergedCategories[category] = ensureMapFlag(
          existing.categories,
          category,
          true
        );
      });
    }

    const hasMissingCategory = DEFAULT_CATEGORIES.some(
      (category) =>
        mergedCategories[category] !==
        ensureMapFlag(existing.categories, category, true)
    );

    if (hasMissingCategory) {
      existing.categories = mergedCategories;
      await existing.save();
    }

    return existing;
  }

  return NotificationPreference.create({
    userId,
    categories: cloneDefaultCategories(),
  });
};

export const getUserNotificationPreferences = async (userId) => {
  return ensureNotificationPreferences(userId);
};

export const updateNotificationPreferences = async (userId, updates = {}) => {
  await ensureNotificationPreferences(userId);
  const safeUpdates = { ...updates };

  if (updates.categories) {
    const sanitized = { ...cloneDefaultCategories(), ...updates.categories };
    DEFAULT_CATEGORIES.forEach((category) => {
      sanitized[category] = Boolean(sanitized[category]);
    });
    safeUpdates.categories = sanitized;
  }

  return NotificationPreference.findOneAndUpdate(
    { userId },
    { $set: safeUpdates },
    { new: true, upsert: true }
  );
};

export const createUserNotification = async ({
  userId,
  title,
  body,
  category = "system",
  severity = DEFAULT_SEVERITY,
  type = "generic",
  topic,
  icon,
  actionLabel,
  actionUrl,
  metadata,
  sourceId,
  expiresAt,
}) => {
  if (!userId || !title || !body) {
    throw new Error("INVALID_NOTIFICATION_PAYLOAD");
  }
  const preferences = await ensureNotificationPreferences(userId);

  // If the category is explicitly disabled, skip creating the notification entirely
  if (category && !ensureMapFlag(preferences.categories, category, true)) {
    return null;
  }
  const muted = shouldMuteNotification(preferences, category);

  const notification = await Notification.create({
    userId,
    title,
    body,
    category,
    severity,
    type,
    topic,
    icon,
    actionLabel,
    actionUrl,
    metadata,
    sourceId,
    expiresAt,
    muted,
  });

  if (!muted) {
    emitNotificationCreated(
      normalizeNotificationDoc(notification),
      notification.userId?.toString?.() ?? userId?.toString?.() ?? userId
    );
  }

  return notification;
};

export const fetchNotificationFeed = async (
  userId,
  { limit = 20, before, category, unreadOnly } = {}
) => {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const query = { userId };

  if (category) {
    query.category = category;
  }

  if (unreadOnly === true || unreadOnly === "true") {
    query.read = false;
  }

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const items = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(normalizedLimit + 1)
    .lean();

  const hasMore = items.length > normalizedLimit;
  const sliced = hasMore ? items.slice(0, normalizedLimit) : items;
  const nextCursor = hasMore ? sliced[sliced.length - 1]?.createdAt : null;

  const unreadCount = await Notification.countDocuments({
    userId,
    read: false,
  });

  return {
    items: sliced.map(normalizeNotificationDoc),
    meta: {
      unreadCount,
      nextCursor,
      hasMore,
    },
  };
};

export const markNotificationsRead = async (userId, notificationIds = []) => {
  if (!notificationIds.length) {
    return { updated: 0 };
  }

  const result = await Notification.updateMany(
    { _id: { $in: notificationIds }, userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  if (result.modifiedCount > 0) {
    const updatedNotifications = await Notification.find({
      _id: { $in: notificationIds },
      userId,
    }).lean();
    updatedNotifications.forEach((doc) => {
      emitNotificationUpdated(
        normalizeNotificationDoc(doc),
        doc.userId?.toString?.() ?? userId?.toString?.() ?? userId
      );
    });
  }

  return { updated: result.modifiedCount };
};

export const markAllNotificationsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  if (result.modifiedCount > 0) {
    emitNotificationUpdated(
      { markAllRead: true },
      userId?.toString?.() ?? userId
    );
  }

  return { updated: result.modifiedCount };
};

export const toggleNotificationReadState = async ({
  userId,
  notificationId,
  read,
}) => {
  const update = read
    ? { read: true, readAt: new Date() }
    : { read: false, readAt: null };

  const doc = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: update },
    { new: true }
  );

  if (doc) {
    emitNotificationUpdated(
      normalizeNotificationDoc(doc),
      doc.userId?.toString?.() ?? userId?.toString?.() ?? userId
    );
  }

  return doc;
};

export const deleteNotification = async ({ userId, notificationId }) => {
  const doc = await Notification.findOneAndDelete({
    _id: notificationId,
    userId,
  });
  if (doc) {
    emitNotificationUpdated(
      { id: notificationId, deleted: true },
      userId?.toString?.() ?? userId
    );
  }
  return doc;
};

export const getNotificationStats = async (userId) => {
  const [unreadCount, totalCount] = await Promise.all([
    Notification.countDocuments({ userId, read: false }),
    Notification.countDocuments({ userId }),
  ]);

  const latest = await Notification.findOne({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return {
    unreadCount,
    totalCount,
    latest: normalizeNotificationDoc(latest),
  };
};

export const serializeNotification = normalizeNotificationDoc;
