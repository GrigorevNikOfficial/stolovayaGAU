import mongoose from 'mongoose';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { attachUsersToChatRoom, detachUserFromChatRoom, emitChatMessage } from '../services/socketService.js';
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

const mapChat = (chat, currentUserId) => {
  const plain = typeof chat.toObject === 'function' ? chat.toObject() : chat;
  const isDirect = plain.type === 'direct';
  const participants = (plain.participants || []).map((participant) => ({
    _id: participant.user?._id || participant.user,
    role: participant.role,
    joinedAt: participant.joinedAt,
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
  };
};

const populateChatUsers = async (chat) =>
  chat.populate({ path: 'participants.user', select: 'first_name last_name avatar role' });

const assertParticipant = (chat, userId) => {
  const isMember = chat.participants.some((participant) => participant.user.toString() === userId.toString());
  if (!isMember) {
    const err = new Error('Доступ к чату запрещен');
    err.statusCode = 403;
    throw err;
  }
};

export const listChats = async (req, res) => {
  try {
    const chats = await Chat.find({ 'participants.user': req.user._id })
      .sort({ updatedAt: -1 })
      .populate('participants.user', 'first_name last_name avatar role');

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

    let chat = await Chat.findOne({ directKey }).populate('participants.user', 'first_name last_name avatar role');
    let isNewChat = false;

    if (!chat) {
      chat = await Chat.create({
        type: 'direct',
        createdBy: req.user._id,
        participants: [
          { user: req.user._id, role: 'member' },
          { user: targetUserId, role: 'member' },
        ],
        visibility: 'private',
        directKey,
      });

      await populateChatUsers(chat);
      isNewChat = true;
    }

    if (isNewChat) {
      attachUsersToChatRoom(chat._id.toString(), [req.user._id.toString(), targetUserId.toString()]);
    }

    res.status(201).json({ chat: mapChat(chat, req.user._id) });
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

    const participants = Array.from(uniqueIds).map((userId) => ({
      user: ensureObjectId(userId),
      role: userId === req.user._id.toString() ? 'owner' : 'member',
    }));

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
      participants.map((participant) => participant.user.toString())
    );

    res.status(201).json({ chat: chatResponse });
  } catch (error) {
    console.error('createGroupChat error:', error);
    res.status(500).json({ error: 'Не удалось создать групповой чат' });
  }
};

export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('participants.user', 'first_name last_name avatar role');

    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    assertParticipant(chat, req.user._id);

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

    assertParticipant(chat, req.user._id);

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

    assertParticipant(chat, req.user._id);

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

    const participantIds = chat.participants.map((participant) => participant.user.toString());
    emitChatMessage(chat._id.toString(), mapMessage(message), participantIds);

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

    assertParticipant(chat, req.user._id);

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

    const alreadyMember = chat.participants.some((participant) => participant.user.toString() === req.user._id.toString());

    if (!alreadyMember) {
      chat.participants.push({ user: req.user._id, role: 'member' });
      await chat.save();
      attachUsersToChatRoom(chat._id.toString(), [req.user._id.toString()]);
    }

    await populateChatUsers(chat);

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

    const initialLength = chat.participants.length;
    chat.participants = chat.participants.filter((participant) => participant.user.toString() !== req.user._id.toString());

    if (chat.participants.length === initialLength) {
      return res.status(400).json({ error: 'Вы уже покинули чат' });
    }

    if (chat.participants.length === 0) {
      await Chat.deleteOne({ _id: chat._id });
      await Message.deleteMany({ chat: chat._id });
      return res.json({ message: 'Чат удален, так как в нем не осталось участников' });
    }

    const hasOwner = chat.participants.some((participant) => participant.role === 'owner');

    if (!hasOwner) {
      chat.participants[0].role = 'owner';
    }

    await chat.save();

    await chat.save();

    detachUserFromChatRoom(chat._id.toString(), req.user._id.toString());

    res.json({ message: 'Вы покинули чат' });
  } catch (error) {
    console.error('leaveChat error:', error);
    res.status(500).json({ error: 'Не удалось покинуть чат' });
  }
};
