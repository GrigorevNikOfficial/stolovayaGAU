import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Токен доступа отсутствует' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rawUserId = decoded?.userId;
    const normalizedUserId =
      typeof rawUserId === 'string'
        ? rawUserId
        : rawUserId?.toString?.();

    if (!normalizedUserId || !mongoose.Types.ObjectId.isValid(normalizedUserId)) {
      return res.status(401).json({ error: 'Неверный токен' });
    }

    const user = await User.findById(normalizedUserId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Неверный токен' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истек' });
    }

    return res.status(500).json({ error: 'Ошибка аутентификации' });
  }
};

export const generateToken = (userId) => {
  const normalizedUserId =
    typeof userId === 'string'
      ? userId
      : userId?.toString?.();

  return jwt.sign(
      { userId: normalizedUserId }, // Явно указываем поле userId
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется аутентификация' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
  }

  next();
};

export const requireAdminOrCanteenManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется аутентификация' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'canteenManager' && req.user.role !== 'cateenManager') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора или администратора столовой' });
  }

  next();
};

export const requireAdminOrStoreManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется аутентификация' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'storeManager') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора или администратора буфета' });
  }

  next();
};