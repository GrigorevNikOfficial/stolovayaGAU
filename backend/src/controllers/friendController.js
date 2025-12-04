import mongoose from 'mongoose';
import { Friendship } from '../models/Friendship.js';
import { User } from '../models/User.js';
import { DEFAULT_PROFILE_PICTURE_KEY, buildPublicUrl } from '../services/storageService.js';

const normalizeId = (value) => new mongoose.Types.ObjectId(value);

const mapUserLite = (userDoc) => {
  if (!userDoc) {
    return null;
  }

  const avatarKey = userDoc?.avatar?.key || DEFAULT_PROFILE_PICTURE_KEY;

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

const mapFriendship = (friendship, currentUserId) => {
  const initiator = friendship.requester;
  const addressee = friendship.addressee;
  const meIsRequester = initiator._id.toString() === currentUserId.toString();
  const counterpart = meIsRequester ? addressee : initiator;

  return {
    _id: friendship._id,
    status: friendship.status,
    createdAt: friendship.createdAt,
    acceptedAt: friendship.acceptedAt,
    user: mapUserLite(counterpart),
    direction: meIsRequester ? 'outgoing' : 'incoming',
  };
};

const fetchFriendshipBetween = async (userA, userB) =>
  Friendship.findOne({
    $or: [
      { requester: userA, addressee: userB },
      { requester: userB, addressee: userA },
    ],
  });

export const searchPeople = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || String(query).trim().length < 2) {
      return res.json({ users: [] });
    }

    const normalized = String(query).trim();
    const regex = new RegExp(normalized, 'i');

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ first_name: regex }, { last_name: regex }],
    })
      .limit(20)
      .select('first_name last_name avatar role');

    const userIds = users.map((user) => user._id);

    const friendships = await Friendship.find({
      $or: [
        { requester: req.user._id, addressee: { $in: userIds } },
        { addressee: req.user._id, requester: { $in: userIds } },
      ],
    });

    const statusMap = new Map();
    friendships.forEach((friendship) => {
      const otherId = friendship.requester.toString() === req.user._id.toString()
        ? friendship.addressee.toString()
        : friendship.requester.toString();
      statusMap.set(otherId, friendship.status);
    });

    res.json({
      users: users.map((user) => ({
        ...mapUserLite(user),
        friendshipStatus: statusMap.get(user._id.toString()) || null,
      })),
    });
  } catch (error) {
    console.error('searchPeople error:', error);
    res.status(500).json({ error: 'Не удалось выполнить поиск' });
  }
};

export const listFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      status: 'accepted',
      $or: [
        { requester: req.user._id },
        { addressee: req.user._id },
      ],
    }).populate('requester addressee', 'first_name last_name avatar role');

    res.json({ friends: friendships.map((item) => mapFriendship(item, req.user._id)) });
  } catch (error) {
    console.error('listFriends error:', error);
    res.status(500).json({ error: 'Не удалось получить список друзей' });
  }
};

export const listFriendRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({
      status: 'pending',
      $or: [
        { requester: req.user._id },
        { addressee: req.user._id },
      ],
    }).populate('requester addressee', 'first_name last_name avatar role');

    const incoming = requests
      .filter((request) => request.addressee._id.toString() === req.user._id.toString())
      .map((item) => mapFriendship(item, req.user._id));

    const outgoing = requests
      .filter((request) => request.requester._id.toString() === req.user._id.toString())
      .map((item) => mapFriendship(item, req.user._id));

    res.json({ incoming, outgoing });
  } catch (error) {
    console.error('listFriendRequests error:', error);
    res.status(500).json({ error: 'Не удалось получить запросы' });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Не указан пользователь' });
    }

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Нельзя добавить себя в друзья' });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    let friendship = await fetchFriendshipBetween(req.user._id, targetUserId);

    if (friendship) {
      if (friendship.status === 'accepted') {
        return res.status(200).json({ friendship: mapFriendship(friendship, req.user._id) });
      }

      if (friendship.status === 'pending' && friendship.requester.toString() === targetUserId) {
        friendship.status = 'accepted';
        friendship.acceptedAt = new Date();
        await friendship.save();
        await friendship.populate('requester addressee', 'first_name last_name avatar role');
        return res.status(200).json({ friendship: mapFriendship(friendship, req.user._id) });
      }

      return res.status(200).json({ friendship: mapFriendship(friendship, req.user._id) });
    }

    friendship = await Friendship.create({
      requester: req.user._id,
      addressee: normalizeId(targetUserId),
    });

    await friendship.populate('requester addressee', 'first_name last_name avatar role');

    res.status(201).json({ friendship: mapFriendship(friendship, req.user._id) });
  } catch (error) {
    console.error('sendFriendRequest error:', error);
    res.status(500).json({ error: 'Не удалось отправить запрос' });
  }
};

export const respondToFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;

    const friendship = await Friendship.findById(requestId).populate('requester addressee', 'first_name last_name avatar role');

    if (!friendship) {
      return res.status(404).json({ error: 'Запрос не найден' });
    }

    if (friendship.addressee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Нельзя управлять чужими запросами' });
    }

    if (friendship.status !== 'pending') {
      return res.status(400).json({ error: 'Запрос уже обработан' });
    }

    if (action === 'accept') {
      friendship.status = 'accepted';
      friendship.acceptedAt = new Date();
      await friendship.save();
      return res.json({ friendship: mapFriendship(friendship, req.user._id) });
    }

    if (action === 'decline') {
      friendship.status = 'declined';
      await friendship.save();
      return res.json({ friendship: mapFriendship(friendship, req.user._id) });
    }

    return res.status(400).json({ error: 'Неизвестное действие' });
  } catch (error) {
    console.error('respondToFriendRequest error:', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
};

export const removeFriendship = async (req, res) => {
  try {
    const { friendId } = req.params;

    const friendship = await Friendship.findOneAndDelete({
      _id: friendId,
      $or: [
        { requester: req.user._id },
        { addressee: req.user._id },
      ],
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Связь не найдена' });
    }

    res.json({ message: 'Пользователь удален из друзей' });
  } catch (error) {
    console.error('removeFriendship error:', error);
    res.status(500).json({ error: 'Не удалось удалить из друзей' });
  }
};
