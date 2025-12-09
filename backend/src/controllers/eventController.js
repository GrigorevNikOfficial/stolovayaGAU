import mongoose from "mongoose";
import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { Chat } from "../models/Chat.js";
import { createUserNotification } from "../services/notificationService.js";
import { attachUsersToChatRoom } from "../services/socketService.js";
import {
  buildPublicUrl,
  DEFAULT_PROFILE_PICTURE_KEY,
} from "../services/storageService.js";

const ensureObjectId = (value) => new mongoose.Types.ObjectId(value);

const normalizeAvatarKey = (user) =>
  user?.avatar?.key || DEFAULT_PROFILE_PICTURE_KEY;

const mapUserLite = (userDoc) => {
  if (!userDoc) {
    return null;
  }

  const avatarKey = normalizeAvatarKey(userDoc);

  return {
    _id: userDoc._id,
    first_name: userDoc.first_name,
    last_name: userDoc.last_name,
    role: userDoc.role,
    avatar: {
      key: avatarKey,
      url: buildPublicUrl(avatarKey),
    },
  };
};

const mapEvent = (event, currentUserId = null) => {
  const plain = typeof event.toObject === "function" ? event.toObject() : event;
  const organizerIdString =
    plain.organizer?._id?.toString?.() ?? plain.organizer?.toString?.();

  const normalizeParticipantUser = (user, includePhone = false) => {
    if (!user) return null;
    const lite = mapUserLite(user);
    if (lite) {
      return includePhone && user?.phone
        ? { ...lite, phone: user.phone }
        : lite;
    }
    const id = user?._id?.toString?.() ?? user?.toString?.() ?? user;
    return id ? { _id: id } : null;
  };

  return {
    _id: plain._id,
    title: plain.title,
    description: plain.description,
    type: plain.type,
    startDate: plain.startDate,
    endDate: plain.endDate,
    location: plain.location,
    organizer: mapUserLite(plain.organizer),
    capacity: plain.capacity,
    participantCount:
      plain.participants?.filter?.((p) => p.approvalStatus !== "rejected")
        ?.length || 0,
    participants:
      plain.participants?.map((p) => {
        const isOrganizer =
          organizerIdString &&
          currentUserId &&
          organizerIdString === currentUserId.toString();
        const participantUser = normalizeParticipantUser(p.user, isOrganizer);

        return {
          user: participantUser,
          registeredAt: p.registeredAt,
          checkedIn: p.checkedIn,
          checkedInAt: p.checkedInAt,
          approvalStatus: p.approvalStatus || "approved",
          approvalAt: p.approvalAt,
          approvalBy: p.approvalBy,
        };
      }) || [],
    reviews:
      plain.reviews?.map((r) => ({
        user: mapUserLite(r.user),
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })) || [],
    averageRating: plain.averageRating || 0,
    reviewCount: plain.reviews?.length || 0,
    status: plain.status,
    chatId: plain.chatId,
    image: plain.image,
    tags: plain.tags || [],
    requiresApproval: plain.requiresApproval,
    userApprovalStatus:
      plain.participants?.find?.(
        (p) =>
          currentUserId &&
          (p.user?._id?.toString?.() ?? p.user?.toString?.()) ===
            currentUserId.toString()
      )?.approvalStatus || null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    isRegistered: currentUserId
      ? plain.participants?.some?.((p) => {
          const pid = p.user?._id?.toString?.() ?? p.user?.toString?.();
          return pid === currentUserId.toString();
        })
      : undefined,
  };
};

const isStatusTransitionAllowed = (currentStatus, nextStatus) => {
  if (!nextStatus || currentStatus === nextStatus) return true;

  const allowedMap = {
    draft: ["draft", "published", "cancelled"],
    published: ["published", "ongoing", "completed", "cancelled"],
    ongoing: ["ongoing", "completed", "cancelled"],
    completed: ["completed"],
    cancelled: ["cancelled"],
  };

  const allowed = allowedMap[currentStatus] || [];
  return allowed.includes(nextStatus);
};

// Create event
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      capacity,
      requiresApproval,
      tags,
      status,
    } = req.body;

    const userId = req.user._id;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        error: "Дата окончания должна быть позже даты начала",
      });
    }

    // Create event
    const event = await Event.create({
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      capacity,
      organizer: userId,
      requiresApproval: requiresApproval || false,
      tags: tags || [],
      status: status || "draft",
      qrCode: Event.generateQRCode(),
    });

    // Create event chat
    const chat = await Chat.create({
      type: "group",
      name: `Чат: ${title}`,
      description: `Чат события "${title}"`,
      visibility: "public",
      createdBy: userId,
      participants: [
        {
          user: userId,
          role: "owner",
        },
      ],
    });

    event.chatId = chat._id;
    await event.save();

    // Populate event data
    await event.populate("organizer", "first_name last_name avatar role");

    res.status(201).json({
      message: "Событие создано успешно",
      event: mapEvent(event, userId),
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ error: "Ошибка при создании события" });
  }
};

// Get all events with filtering and search
export const getEvents = async (req, res) => {
  try {
    const {
      type,
      status,
      search,
      startDate,
      endDate,
      organizerId,
      tags,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (status) {
      query.status = status;
    } else {
      // By default, show only published, ongoing, and completed events
      query.status = { $in: ["published", "ongoing", "completed"] };
    }

    // Filter by organizer
    if (organizerId) {
      query.organizer = ensureObjectId(organizerId);
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) {
        query.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startDate.$lte = new Date(endDate);
      }
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate("organizer", "first_name last_name avatar role")
        .populate("participants.user", "first_name last_name avatar role phone")
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limitNum),
      Event.countDocuments(query),
    ]);

    res.json({
      events: events.map((evt) => mapEvent(evt, req.user?._id)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ error: "Ошибка при получении списка событий" });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate("organizer", "first_name last_name avatar role")
      .populate("participants.user", "first_name last_name avatar role phone")
      .populate("reviews.user", "first_name last_name avatar role");

    if (!event) {
      return res.status(404).json({ error: "Событие не найдено" });
    }

    res.json({ event: mapEvent(event, req.user?._id) });
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({ error: "Ошибка при получении события" });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Событие не найдено" });
    }

    // Check permissions: only organizer or admin can update
    if (event.organizer.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({
        error: "У вас нет прав для изменения этого события",
      });
    }

    const {
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      capacity,
      status,
      tags,
      requiresApproval,
    } = req.body;

    // Validate dates
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        error: "Дата окончания должна быть позже даты начала",
      });
    }

    // Update fields
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (type !== undefined) event.type = type;
    if (startDate !== undefined) event.startDate = startDate;
    if (endDate !== undefined) event.endDate = endDate;
    if (location !== undefined) event.location = location;
    if (capacity !== undefined) event.capacity = capacity;
    if (status !== undefined) {
      if (!isStatusTransitionAllowed(event.status, status)) {
        return res.status(400).json({
          error: "Недопустимый переход статуса события",
        });
      }
      event.status = status;
    }
    if (tags !== undefined) event.tags = tags;
    if (requiresApproval !== undefined)
      event.requiresApproval = requiresApproval;

    await event.save();
    await event.populate("organizer", "first_name last_name avatar role");

    // Notify participants about update
    if (event.participants.length > 0 && status !== "draft") {
      const participantIds = event.participants.map((p) => p.user);
      for (const participantId of participantIds) {
        await createUserNotification({
          userId: participantId,
          title: "Событие обновлено",
          body: `Событие "${event.title}" было обновлено`,
          category: "events",
          severity: "info",
          actionLabel: "Посмотреть",
          actionUrl: `/events/${event._id}`,
          sourceId: event._id,
        });
      }
    }

    res.json({
      message: "Событие обновлено успешно",
      event: mapEvent(event, userId),
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({ error: "Ошибка при обновлении события" });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Событие не найдено" });
    }

    // Check permissions
    if (event.organizer.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({
        error: "У вас нет прав для удаления этого события",
      });
    }

    await Event.findByIdAndDelete(eventId);

    res.json({ message: "Событие удалено успешно" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ error: "Ошибка при удалении события" });
  }
};

// Register for event
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId).populate(
      "organizer",
      "first_name last_name"
    );

    if (!event) {
      return res.status(404).json({ error: "Событие не найдено" });
    }

    // Check if event is published
    if (event.status !== "published" && event.status !== "ongoing") {
      return res.status(400).json({
        error: "Регистрация на это событие недоступна",
      });
    }

    // Check if already registered
    if (event.isUserRegistered(userId)) {
      return res.status(400).json({
        error: "Вы уже зарегистрированы на это событие",
      });
    }

    // Check capacity
    if (!event.hasCapacity()) {
      return res.status(400).json({
        error: "Достигнут лимит участников",
      });
    }

    const requiresApproval = Boolean(event.requiresApproval);

    // Register user
    event.participants.push({
      user: userId,
      registeredAt: new Date(),
      approvalStatus: requiresApproval ? "pending" : "approved",
    });

    await event.save();

    // Add user to event chat
    if (event.chatId) {
      const chat = await Chat.findById(event.chatId);
      if (chat) {
        const isAlreadyInChat = chat.participants.some(
          (p) => p.user.toString() === userId.toString()
        );
        if (!isAlreadyInChat) {
          chat.participants.push({
            user: userId,
            role: "member",
          });
          await chat.save();
          attachUsersToChatRoom(event.chatId.toString(), [userId.toString()]);
        }
      }
    }

    // Send confirmation / pending notification
    await createUserNotification({
      userId,
      title: requiresApproval
        ? "Заявка на событие отправлена"
        : "Регистрация подтверждена",
      body: requiresApproval
        ? `Ваша заявка на событие "${event.title}" ожидает подтверждения организатора`
        : `Вы зарегистрированы на событие "${event.title}"`,
      category: "events",
      severity: requiresApproval ? "info" : "success",
      actionLabel: "Посмотреть",
      actionUrl: `/events/${event._id}`,
      sourceId: event._id,
    });

    res.json({
      message: requiresApproval
        ? "Заявка отправлена и ожидает подтверждения"
        : "Регистрация прошла успешно",
      event: mapEvent(event, userId),
    });
  } catch (error) {
    console.error("Register for event error:", error);
    res.status(500).json({ error: "Ошибка при регистрации на событие" });
  }
};

// Unregister from event
export const unregisterFromEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Событие не найдено" });
    }

    // Check if registered
    if (!event.isUserRegistered(userId)) {
      return res.status(400).json({
        error: "Вы не зарегистрированы на это событие",
      });
    }

    // Remove user from participants
    event.participants = event.participants.filter(
      (p) => p.user.toString() !== userId.toString()
    );

    await event.save();

    res.json({
      message: "Регистрация отменена успешно",
      event: mapEvent(event, userId),
    });
  } catch (error) {
    console.error("Unregister from event error:", error);
    res.status(500).json({ error: "Ошибка при отмене регистрации" });
  }
};

const ensureOrganizerAccess = (event, userId, isAdmin) => {
  if (event.organizer.toString() !== userId.toString() && !isAdmin) {
    return false;
  }
  return true;
};

const approveParticipantInternal = async (event, participant, approverId) => {
  participant.approvalStatus = "approved";
  participant.approvalAt = new Date();
  participant.approvalBy = approverId;
};

export const approveParticipant = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Событие не найдено" });
    }

    if (!ensureOrganizerAccess(event, userId, isAdmin)) {
      return res.status(403).json({ error: "Нет прав для подтверждения" });
    }

    const participant = event.participants.find(
      (p) => p.user.toString() === participantId
    );

    if (!participant) {
      return res.status(404).json({ error: "Участник не найден" });
    }

    await approveParticipantInternal(event, participant, userId);
    await event.save();

    await createUserNotification({
      userId: participant.user,
      title: "Регистрация одобрена",
      body: `Организатор подтвердил ваше участие в событии "${event.title}"`,
      category: "events",
      severity: "success",
      actionLabel: "Открыть",
      actionUrl: `/events/${event._id}`,
      sourceId: event._id,
    });

    res.json({
      message: "Участник подтвержден",
      event: mapEvent(event, userId),
    });
  } catch (error) {
    console.error("Approve participant error:", error);
    res.status(500).json({ error: "Ошибка при подтверждении участника" });
  }
};

export const rejectParticipant = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Событие не найдено" });
    }

    if (!ensureOrganizerAccess(event, userId, isAdmin)) {
      return res.status(403).json({ error: "Нет прав для отклонения" });
    }

    const participant = event.participants.find(
      (p) => p.user.toString() === participantId
    );

    if (!participant) {
      return res.status(404).json({ error: "Участник не найден" });
    }

    participant.approvalStatus = "rejected";
    participant.approvalAt = new Date();
    participant.approvalBy = userId;
    await event.save();

    await createUserNotification({
      userId: participant.user,
      title: "Регистрация отклонена",
      body: `Ваша заявка на событие "${event.title}" отклонена`,
      category: "events",
      severity: "warning",
      actionLabel: "Открыть",
      actionUrl: `/events/${event._id}`,
      sourceId: event._id,
    });

    res.json({
      message: "Участник отклонен",
      event: mapEvent(event, userId),
    });
  } catch (error) {
    console.error("Reject participant error:", error);
    res.status(500).json({ error: "Ошибка при отклонении участника" });
  }
};

// QR Check-in
export const checkInToEvent = async (req, res) => {
  try {
    const { qrCode } = req.body;
    const userId = req.user._id;

    const event = await Event.findOne({ qrCode });

    if (!event) {
      return res.status(404).json({ error: "Событие не найдено по QR коду" });
    }

    // Find participant
    const participant = event.participants.find(
      (p) => p.user.toString() === userId.toString()
    );

    if (!participant) {
      return res.status(400).json({
        error: "Вы не зарегистрированы на это событие",
      });
    }

    if (
      participant.approvalStatus &&
      participant.approvalStatus !== "approved"
    ) {
      return res.status(400).json({
        error: "Ваша регистрация еще не одобрена",
      });
    }

    // Check if already checked in
    if (participant.checkedIn) {
      return res.status(400).json({
        error: "Вы уже отметились на этом событии",
      });
    }

    // Check in
    participant.checkedIn = true;
    participant.checkedInAt = new Date();

    await event.save();

    res.json({
      message: "Отметка о посещении прошла успешно",
      event: mapEvent(event, userId),
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ error: "Ошибка при отметке посещения" });
  }
};

// Add review/rating
export const addEventReview = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "Рейтинг должен быть от 1 до 5",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Событие не найдено" });
    }

    // Check if user participated
    if (!event.isUserRegistered(userId)) {
      return res.status(400).json({
        error: "Вы можете оценить только события, на которые зарегистрированы",
      });
    }

    // Check if already reviewed
    const existingReview = event.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment || "";
      existingReview.createdAt = new Date();
    } else {
      // Add new review
      event.reviews.push({
        user: userId,
        rating,
        comment: comment || "",
        createdAt: new Date(),
      });
    }

    // Update average rating
    event.updateAverageRating();

    await event.save();
    await event.populate("reviews.user", "first_name last_name avatar role");

    res.json({
      message: "Отзыв добавлен успешно",
      event: mapEvent(event, userId),
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({ error: "Ошибка при добавлении отзыва" });
  }
};

// Get user's registered events
export const getMyEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, upcoming } = req.query;

    const query = {
      "participants.user": userId,
    };

    if (status) {
      query.status = status;
    }

    if (upcoming === "true") {
      query.startDate = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .populate("organizer", "first_name last_name avatar role")
      .populate("participants.user", "first_name last_name avatar role phone")
      .sort({ startDate: 1 });

    const now = new Date();
    const sorted = [...events].sort((a, b) => {
      const aUpcoming = new Date(a.startDate) >= now;
      const bUpcoming = new Date(b.startDate) >= now;
      if (aUpcoming !== bUpcoming) {
        return aUpcoming ? -1 : 1;
      }
      return aUpcoming
        ? new Date(a.startDate) - new Date(b.startDate)
        : new Date(b.startDate) - new Date(a.startDate);
    });

    res.json({
      events: sorted.map((evt) => mapEvent(evt, userId)),
    });
  } catch (error) {
    console.error("Get my events error:", error);
    res.status(500).json({ error: "Ошибка при получении ваших событий" });
  }
};

// Get events organized by user
export const getOrganizedEvents = async (req, res) => {
  try {
    const userId = req.user._id;

    const events = await Event.find({ organizer: userId })
      .populate("organizer", "first_name last_name avatar role")
      .populate("participants.user", "first_name last_name avatar role phone")
      .sort({ startDate: -1 });

    res.json({
      events: events.map((evt) => mapEvent(evt, userId)),
    });
  } catch (error) {
    console.error("Get organized events error:", error);
    res
      .status(500)
      .json({ error: "Ошибка при получении организованных событий" });
  }
};
