import mongoose from 'mongoose';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { attachUsersToChatRoom, detachUserFromChatRoom, emitChatMessage, emitChatUpdated } from '../services/socketService.js';
import { createUserNotification } from '../services/notificationService.js';
import { DEFAULT_PROFILE_PICTURE_KEY, buildPublicUrl } from '../services/storageService.js';

const ensureObjectId = (value) => new mongoose.Types.ObjectId(value);

const normalizeAvatarKey = (user) => user?.avatar?.key || DEFAULT_PROFILE_PICTURE_KEY;

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

const mapMessage = (message) => {
  const plain = typeof message.toObject === 'function' ? message.toObject() : message;
  return {
    _id: plain._id,
    chat: plain.chat,
    content: plain.content,
    attachments: plain.attachments || [],
    createdAt: plain.createdAt,
    sender: mapUserLite(plain.sender),
  };
};

const PARTICIPANT_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
};

const ensureStringId = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value.toString === 'function') {
    return value.toString();
  }
  return null;
};

const isActiveParticipant = (participant) =>
  (participant?.status || PARTICIPANT_STATUS.ACTIVE) === PARTICIPANT_STATUS.ACTIVE;

const getParticipantUserId = (participant) =>
  ensureStringId(participant?.user?._id ?? participant?.user);

const getParticipantForUser = (chat, userId) =>
  (chat?.participants || []).find((participant) =>
    getParticipantUserId(participant) === ensureStringId(userId)
  );

const listActiveParticipantIds = (chat) =>
  (chat?.participants || [])
    .filter(isActiveParticipant)
    .map((participant) => getParticipantUserId(participant))
    .filter(Boolean);

const mapChat = (chat, currentUserId) => {
  const plain = typeof chat.toObject === 'function' ? chat.toObject() : chat;
  const isDirect = plain.type === 'direct';
  const participants = (plain.participants || []).map((participant) => ({
    _id: participant.user?._id || participant.user,
    role: participant.role,
    status: participant.status || PARTICIPANT_STATUS.ACTIVE,
    joinedAt: participant.joinedAt,
    invitedAt: participant.invitedAt,
    invitedBy: mapUserLite(participant.invitedBy),
    user: mapUserLite(participant.user),
  }));

  let displayName = plain.name;
  let displayAvatar = null;

  if (isDirect) {
    const other = participants.find((participant) => participant._id?.toString() !== currentUserId.toString());
    if (other?.user) {
      displayName = `${other.user.first_name} ${other.user.last_name}`.trim();
      displayAvatar = other.user.avatar;
    }
  }

  const membership = participants.find((participant) =>
    participant._id?.toString?.() === currentUserId?.toString?.()
  );

  return {
    _id: plain._id,
    type: plain.type,
    name: displayName,
    rawName: plain.name,
    description: plain.description,
    visibility: plain.visibility,
    inviteCode: plain.inviteCode || null,
    createdBy: plain.createdBy,
    participants,
    participantCount: participants.length,
    lastMessageAt: plain.lastMessageAt,
    lastMessagePreview: plain.lastMessagePreview,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    avatar: displayAvatar,
    membershipStatus: membership?.status || PARTICIPANT_STATUS.ACTIVE,
    membershipRole: membership?.role || 'member',
    membershipSince: membership?.joinedAt || plain.createdAt,
    membershipInvitedAt: membership?.invitedAt || null,
  };
};

const populateChatUsers = async (chat) =>
  chat.populate([
    { path: 'participants.user', select: 'first_name last_name avatar role' },
    { path: 'participants.invitedBy', select: 'first_name last_name avatar role' },
  ]);

const buildChatActionUrl = (chatId) => `/services/chat?chat=${chatId}`;

const formatUserDisplayName = (user) => {
  if (!user) {
    return 'Коллега';
  }
  const first = user.first_name || user.firstName || '';
  const last = user.last_name || user.lastName || '';
  const name = `${first} ${last}`.trim();
  return name || 'Коллега';
};

const broadcastChatSnapshots = async (chat, { skipPopulate } = {}) => {
  if (!chat) {
    return;
  }

  if (!skipPopulate) {
    await populateChatUsers(chat);
  }

  const recipients = chat.participants || [];
  recipients.forEach((participant) => {
    const userId = ensureStringId(participant.user);
    if (!userId) {
      return;
    }
    const snapshot = mapChat(chat, userId);
    emitChatUpdated(snapshot, userId);
  });
};

const sendChatInviteNotification = async ({ chatDoc, inviteeId, inviter }) => {
  if (!chatDoc || !inviteeId) {
    return;
  }

  try {
    const normalizedInviteeId = ensureStringId(inviteeId);
    if (!normalizedInviteeId) {
      console.warn('sendChatInviteNotification: invitee id is invalid', inviteeId);
      return;
    }

    const chatId = chatDoc._id?.toString?.() ?? chatDoc._id;
    const inviterName = formatUserDisplayName(inviter);
    const chatTitle = chatDoc.type === 'direct'
      ? `${inviterName} приглашает вас в личный чат`
      : `${inviterName} приглашает в чат «${chatDoc.name || 'групповой чат'}»`;

    await createUserNotification({
      userId: normalizedInviteeId,
      title: chatTitle,
      body: 'Откройте чат, чтобы принять или отклонить приглашение.',
      category: 'chat',
      severity: 'info',
      type: 'chat_invite',
      icon: '💬',
      actionLabel: 'Перейти',
      actionUrl: buildChatActionUrl(chatId),
      metadata: {
        chatId,
      },
    });
  } catch (error) {
    console.error('sendChatInviteNotification error:', error);
  }
};

const notifyInviterAboutDecision = async ({ chatDoc, inviterId, actor, action }) => {
  if (!chatDoc || !inviterId || !actor) {
    return;
  }

  const actionText = action === 'accepted' ? 'принял приглашение' : 'отклонил приглашение';

  await createUserNotification({
    userId: inviterId,
    title: `${formatUserDisplayName(actor)} ${actionText}`,
    body: chatDoc.name
      ? `Чат «${chatDoc.name}» обновлён.`
      : 'Статус личного чата обновлён.',
    category: 'chat',
    severity: action === 'accepted' ? 'success' : 'warning',
    type: 'chat_invite_response',
    icon: '💬',
    actionLabel: 'Открыть чат',
    actionUrl: buildChatActionUrl(chatDoc._id?.toString?.() ?? chatDoc._id),
    metadata: {
      chatId: chatDoc._id?.toString?.() ?? chatDoc._id,
      decision: action,
    },
  });
};

const notifyChatParticipants = async (chatDoc, messageDoc) => {
  if (!chatDoc || !messageDoc) {
    return;
  }

  const senderId = messageDoc.sender?._id?.toString?.() ?? messageDoc.sender?.toString?.();
  if (!senderId) {
    return;
  }

  const chatId = chatDoc._id?.toString?.() ?? chatDoc.id;
  const recipients = (chatDoc.participants || [])
    .filter((participant) => (participant?.status || PARTICIPANT_STATUS.ACTIVE) === PARTICIPANT_STATUS.ACTIVE)
    .map((participant) => {
      const raw = participant?.user;
      if (!raw) {
        return null;
      }
      return raw._id?.toString?.() ?? raw.toString?.();
    })
    .filter((id) => id && id !== senderId);

  if (!recipients.length) {
    return;
  }

  const senderName = formatUserDisplayName(messageDoc.sender);
  const previewText = messageDoc.content?.trim() || (messageDoc.attachments?.length ? 'Вложение' : 'Новое сообщение');
  const chatTitle = chatDoc.type === 'group'
    ? `Новое сообщение в «${chatDoc.name || 'групповом чате'}»`
    : 'Новое личное сообщение';
  const actionUrl = buildChatActionUrl(chatId);

  await Promise.allSettled(
    recipients.map((userId) =>
      createUserNotification({
        userId,
        title: chatTitle,
        body: `${senderName}: ${previewText}`,
        category: 'chat',
        severity: 'info',
        type: 'chat_message',
        icon: '💬',
        actionLabel: 'Открыть чат',
        actionUrl,
        metadata: {
          chatId,
          messageId: messageDoc._id?.toString?.() ?? messageDoc._id,
        },
        sourceId: messageDoc._id?.toString?.() ?? messageDoc._id,
      })
    )
  );
};

const assertParticipant = (chat, userId) => {
  const participant = getParticipantForUser(chat, userId);
  if (!participant) {
    const err = new Error('Доступ к чату запрещен');
    err.statusCode = 403;
    throw err;
  }
  return participant;
};

const assertActiveParticipant = (chat, userId) => {
  const participant = assertParticipant(chat, userId);
  if (!isActiveParticipant(participant)) {
    const err = new Error('Приглашение ещё не подтверждено');
    err.statusCode = 403;
    throw err;
  }
  return participant;
};

export const listChats = async (req, res) => {
  try {
    const chats = await Chat.find({ 'participants.user': req.user._id })
      .sort({ updatedAt: -1 })
      .populate('participants.user', 'first_name last_name avatar role')
      .populate('participants.invitedBy', 'first_name last_name avatar role');

    res.json({ chats: chats.map((chat) => mapChat(chat, req.user._id)) });
  } catch (error) {
    console.error('listChats error:', error);
    res.status(500).json({ error: 'Не удалось получить чаты' });
  }
};

export const createDirectChat = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Не указан собеседник' });
    }

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Нельзя создать чат с самим собой' });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const directKey = Chat.buildDirectKey(req.user._id, targetUserId);

    let chat = await Chat.findOne({ directKey })
      .populate('participants.user', 'first_name last_name avatar role')
      .populate('participants.invitedBy', 'first_name last_name avatar role');
    let isNewChat = false;

    if (!chat) {
      const now = new Date();
      chat = await Chat.create({
        type: 'direct',
        createdBy: req.user._id,
        participants: [
          {
            user: req.user._id,
            role: 'member',
            status: PARTICIPANT_STATUS.ACTIVE,
            joinedAt: now,
          },
          {
            user: targetUserId,
            role: 'member',
            status: PARTICIPANT_STATUS.PENDING,
            invitedBy: req.user._id,
            invitedAt: now,
            joinedAt: null,
          },
        ],
        visibility: 'private',
        directKey,
      });

      await populateChatUsers(chat);
      isNewChat = true;

      await sendChatInviteNotification({
        chatDoc: chat,
        inviteeId: targetUserId,
        inviter: req.user,
      });
    }

    if (isNewChat) {
      attachUsersToChatRoom(chat._id.toString(), [req.user._id.toString()]);
      await broadcastChatSnapshots(chat, { skipPopulate: true });
    }

    res.status(isNewChat ? 201 : 200).json({ chat: mapChat(chat, req.user._id) });
  } catch (error) {
    console.error('createDirectChat error:', error);
    res.status(500).json({ error: 'Не удалось создать чат' });
  }
};

export const createGroupChat = async (req, res) => {
  try {
    const { name, description, participantIds = [], visibility = 'private' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Название чата обязательно' });
    }

    const uniqueIds = new Set([req.user._id.toString(), ...participantIds.map((id) => id.toString())]);
    const now = new Date();

    const participants = Array.from(uniqueIds).map((userId) => {
      const isOwner = userId === req.user._id.toString();
      return {
        user: ensureObjectId(userId),
        role: isOwner ? 'owner' : 'member',
        status: isOwner ? PARTICIPANT_STATUS.ACTIVE : PARTICIPANT_STATUS.PENDING,
        invitedBy: isOwner ? null : req.user._id,
        invitedAt: isOwner ? null : now,
        joinedAt: isOwner ? now : null,
      };
    });

    const chat = await Chat.create({
      type: 'group',
      name: name.trim(),
      description: description?.trim(),
      visibility,
      createdBy: req.user._id,
      participants,
      inviteCode: visibility === 'public' ? Chat.generateInviteCode() : undefined,
    });

    await populateChatUsers(chat);

    const chatResponse = mapChat(chat, req.user._id);

    attachUsersToChatRoom(
      chat._id.toString(),
      participants
        .filter((participant) => participant.status === PARTICIPANT_STATUS.ACTIVE)
        .map((participant) => getParticipantUserId(participant))
        .filter(Boolean)
    );

    const pendingInvitees = participants
      .filter((participant) => participant.status === PARTICIPANT_STATUS.PENDING)
      .map((participant) => getParticipantUserId(participant))
      .filter(Boolean);

    await Promise.allSettled(
      pendingInvitees.map((inviteeId) =>
        sendChatInviteNotification({ chatDoc: chat, inviteeId, inviter: req.user })
      )
    );

    await broadcastChatSnapshots(chat, { skipPopulate: true });

    res.status(201).json({ chat: chatResponse });
  } catch (error) {
    console.error('createGroupChat error:', error);
    res.status(500).json({ error: 'Не удалось создать групповой чат' });
  }
};

export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants.user', 'first_name last_name avatar role')
      .populate('participants.invitedBy', 'first_name last_name avatar role');

    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    assertActiveParticipant(chat, req.user._id);

    res.json({ chat: mapChat(chat, req.user._id) });
  } catch (error) {
    console.error('getChatById error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Не удалось получить чат' });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    assertActiveParticipant(chat, req.user._id);

    const filters = { chat: chatId };

    if (before) {
      filters.createdAt = { $lt: new Date(before) };
    }

    const numericLimit = Math.min(Number(limit) || 50, 100);

    const messages = await Message.find(filters)
      .sort({ createdAt: -1 })
      .limit(numericLimit)
      .populate('sender', 'first_name last_name avatar role')
      .lean();

    res.json({
      messages: messages.reverse().map(mapMessage),
      hasMore: messages.length === numericLimit,
    });
  } catch (error) {
    console.error('getChatMessages error:', error);
    res.status(500).json({ error: 'Не удалось получить сообщения' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content = '', attachments = [] } = req.body;
    const text = content.trim();

    if (!text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    assertActiveParticipant(chat, req.user._id);

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content: text,
      attachments,
    });

    await message.populate('sender', 'first_name last_name avatar role');

    chat.lastMessageAt = new Date();
    chat.lastMessagePreview = text || '[вложение]';
    await chat.save();

    const participantIds = listActiveParticipantIds(chat);
    emitChatMessage(chat._id.toString(), mapMessage(message), participantIds);

    await notifyChatParticipants(chat, message);

    res.status(201).json({ message: mapMessage(message) });
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ error: 'Не удалось отправить сообщение' });
  }
};

export const regenerateInviteCode = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    assertActiveParticipant(chat, req.user._id);

    if (chat.type !== 'group') {
      return res.status(400).json({ error: 'Приглашение доступно только для групповых чатов' });
    }

    chat.inviteCode = Chat.generateInviteCode();
    await chat.save();

    res.json({ inviteCode: chat.inviteCode });
  } catch (error) {
    console.error('regenerateInviteCode error:', error);
    res.status(500).json({ error: 'Не удалось обновить ссылку приглашения' });
  }
};

export const joinByInviteCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Код приглашения обязателен' });
    }

    const chat = await Chat.findOne({ inviteCode: code });

    if (!chat) {
      return res.status(404).json({ error: 'Приглашение недействительно' });
    }

    let participant = getParticipantForUser(chat, req.user._id);
    let statusChanged = false;

    if (!participant) {
      chat.participants.push({
        user: req.user._id,
        role: 'member',
        status: PARTICIPANT_STATUS.ACTIVE,
        joinedAt: new Date(),
      });
      statusChanged = true;
    } else if (!isActiveParticipant(participant)) {
      participant.status = PARTICIPANT_STATUS.ACTIVE;
      participant.joinedAt = new Date();
      statusChanged = true;

      const inviterId = ensureStringId(participant.invitedBy) || ensureStringId(chat.createdBy);
      if (inviterId) {
        await notifyInviterAboutDecision({
          chatDoc: chat,
          inviterId,
          actor: req.user,
          action: 'accepted',
        });
      }
    }

    if (statusChanged) {
      await chat.save();
      attachUsersToChatRoom(chat._id.toString(), [req.user._id.toString()]);
    }

    await populateChatUsers(chat);
    await broadcastChatSnapshots(chat, { skipPopulate: true });

    res.json({ chat: mapChat(chat, req.user._id) });
  } catch (error) {
    console.error('joinByInviteCode error:', error);
    res.status(500).json({ error: 'Не удалось присоединиться по ссылке' });
  }
};

export const leaveChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    const participant = assertParticipant(chat, req.user._id);
    const wasActive = isActiveParticipant(participant);
    const initialLength = chat.participants.length;
    chat.participants = chat.participants.filter(
      (item) => getParticipantUserId(item) !== ensureStringId(req.user._id)
    );

    if (chat.participants.length === initialLength) {
      return res.status(400).json({ error: 'Вы уже покинули чат' });
    }

    if (chat.participants.length === 0) {
      await Chat.deleteOne({ _id: chat._id });
      await Message.deleteMany({ chat: chat._id });
      return res.json({ message: 'Чат удален, так как в нем не осталось участников' });
    }

    const hasOwner = chat.participants.some((participant) => participant.role === 'owner');

    if (!hasOwner && chat.participants.length) {
      chat.participants[0].role = 'owner';
    }

    await chat.save();

    if (wasActive) {
      detachUserFromChatRoom(chat._id.toString(), req.user._id.toString());
    }

    await populateChatUsers(chat);
    await broadcastChatSnapshots(chat, { skipPopulate: true });

    res.json({ message: 'Вы покинули чат' });
  } catch (error) {
    console.error('leaveChat error:', error);
    res.status(500).json({ error: 'Не удалось покинуть чат' });
  }
};

export const acceptChatInvite = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId)
      .populate('participants.user', 'first_name last_name avatar role')
      .populate('participants.invitedBy', 'first_name last_name avatar role');

    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    const participant = assertParticipant(chat, req.user._id);

    if (isActiveParticipant(participant)) {
      await populateChatUsers(chat);
      return res.json({ chat: mapChat(chat, req.user._id) });
    }

    participant.status = PARTICIPANT_STATUS.ACTIVE;
    participant.joinedAt = new Date();

    await chat.save();
    await populateChatUsers(chat);

    attachUsersToChatRoom(chat._id.toString(), [req.user._id.toString()]);

    const inviterId = ensureStringId(participant.invitedBy) || ensureStringId(chat.createdBy);
    if (inviterId && inviterId !== req.user._id.toString()) {
      await notifyInviterAboutDecision({
        chatDoc: chat,
        inviterId,
        actor: req.user,
        action: 'accepted',
      });
    }

    await broadcastChatSnapshots(chat, { skipPopulate: true });

    return res.json({ chat: mapChat(chat, req.user._id) });
  } catch (error) {
    console.error('acceptChatInvite error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Не удалось подтвердить приглашение' });
  }
};

export const declineChatInvite = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId)
      .populate('participants.user', 'first_name last_name avatar role')
      .populate('participants.invitedBy', 'first_name last_name avatar role');

    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    const participant = assertParticipant(chat, req.user._id);
    const wasActive = isActiveParticipant(participant);

    chat.participants = chat.participants.filter(
      (item) => getParticipantUserId(item) !== ensureStringId(req.user._id)
    );

    if (!chat.participants.length) {
      await Chat.deleteOne({ _id: chat._id });
      await Message.deleteMany({ chat: chat._id });
      if (wasActive) {
        detachUserFromChatRoom(chat._id.toString(), req.user._id.toString());
      }
      return res.json({ removed: true, chatId });
    }

    const hasOwner = chat.participants.some((item) => item.role === 'owner');
    if (!hasOwner) {
      chat.participants[0].role = 'owner';
    }

    await chat.save();

    if (wasActive) {
      detachUserFromChatRoom(chat._id.toString(), req.user._id.toString());
    }

    if (!wasActive) {
      const inviterId = ensureStringId(participant.invitedBy) || ensureStringId(chat.createdBy);
      if (inviterId && inviterId !== req.user._id.toString()) {
        await notifyInviterAboutDecision({
          chatDoc: chat,
          inviterId,
          actor: req.user,
          action: 'declined',
        });
      }
    }

    await populateChatUsers(chat);
    await broadcastChatSnapshots(chat, { skipPopulate: true });

    res.json({ removed: true, chatId });
  } catch (error) {
    console.error('declineChatInvite error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Не удалось отклонить приглашение' });
  }
};

export const addParticipantsToChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { participantIds } = req.body || {};

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: 'Укажите хотя бы одного участника' });
    }

    const chat = await Chat.findById(chatId)
      .populate('participants.user', 'first_name last_name avatar role')
      .populate('participants.invitedBy', 'first_name last_name avatar role');

    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    assertParticipant(chat, req.user._id);

    if (chat.type !== 'group') {
      return res.status(400).json({ error: 'Добавлять участников можно только в групповые чаты' });
    }

    const normalizedIds = Array.from(
      new Set(
        participantIds
          .filter(id => typeof id === 'string' && id.trim())
          .map(id => id.trim())
      )
    );

    if (!normalizedIds.length) {
      return res.status(400).json({ error: 'Не удалось распознать участников' });
    }

    const existingIds = new Set(
      chat.participants.map(participant => getParticipantUserId(participant)).filter(Boolean)
    );
    const idsToAdd = normalizedIds.filter(id => !existingIds.has(id));

    if (!idsToAdd.length) {
      return res.json({ chat: mapChat(chat, req.user._id) });
    }

    const usersToAdd = await User.find({ _id: { $in: idsToAdd } });

    if (!usersToAdd.length) {
      return res.status(404).json({ error: 'Указанные пользователи не найдены' });
    }

    const addedIds = [];
    const now = new Date();
    usersToAdd.forEach(user => {
      chat.participants.push({
        user: user._id,
        role: 'member',
        status: PARTICIPANT_STATUS.PENDING,
        invitedBy: req.user._id,
        invitedAt: now,
        joinedAt: null,
      });
      addedIds.push(user._id.toString());
    });

    await chat.save();
    await populateChatUsers(chat);

    await Promise.allSettled(
      addedIds.map((inviteeId) =>
        sendChatInviteNotification({ chatDoc: chat, inviteeId, inviter: req.user })
      )
    );

    await broadcastChatSnapshots(chat, { skipPopulate: true });

    res.json({ chat: mapChat(chat, req.user._id) });
  } catch (error) {
    console.error('addParticipantsToChat error:', error);
    res.status(500).json({ error: 'Не удалось добавить участников' });
  }
};
