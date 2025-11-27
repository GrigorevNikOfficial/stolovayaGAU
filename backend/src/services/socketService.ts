import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { User } from '../models/User.js';

const STAFF_ROLES = ['admin', 'storeManager', 'canteenManager', 'cateenManager'];

let io: Server | null = null;

type TokenPayload = {
  userId?: string;
};

type SocketUser = {
  _id: string;
  role: string;
};

const parseOrigins = (raw?: string | null): string[] => {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
};

const resolveCorsOrigins = (): string | string[] => {
  const configuredOrigins =
    process.env.SOCKET_ALLOWED_ORIGINS ||
    process.env.CLIENT_URLS ||
    process.env.CLIENT_URL;

  const parsed = parseOrigins(configuredOrigins);

  if (parsed.length === 0) {
    return '*';
  }

  return parsed;
};

const attachRooms = (socket: Socket, user: SocketUser) => {
  socket.join(`user:${user._id}`);

  if (STAFF_ROLES.includes(user.role)) {
    socket.join('orders:staff');
    socket.join('topups:staff');
    socket.join(`role:${user.role}`);
  }
};

const authenticateSocket = async (socket: Socket): Promise<SocketUser> => {
  const authToken =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
    '';

  if (!authToken) {
    throw new Error('Токен не передан');
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET не задан');
  }

  const decoded = jwt.verify(authToken, jwtSecret) as jwt.JwtPayload & TokenPayload;
  const rawUserId = decoded?.userId;

  if (!rawUserId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
    throw new Error('Некорректный токен');
  }

  const user = await User.findById(rawUserId).select('_id role');

  if (!user) {
    throw new Error('Пользователь не найден');
  }

  return { _id: user._id.toString(), role: user.role };
};

export const initSocketServer = (server: HTTPServer) => {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: resolveCorsOrigins(),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      socket.data.user = user;
      attachRooms(socket, user);
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', socket => {
    const user = socket.data.user as SocketUser | undefined;
    console.log('Socket connected:', user?._id, user?.role);

    socket.on('disconnect', reason => {
      console.log('Socket disconnected:', user?._id, reason);
    });
  });

  return io;
};

const emitToAudiences = (
  event: string,
  payload: unknown & { user_id?: string },
  options?: { staffRoom?: string }
) => {
  if (!io) {
    return;
  }

  const staffRoom = options?.staffRoom || 'orders:staff';
  io.to(staffRoom).emit(event, payload);

  if (payload?.user_id) {
    io.to(`user:${payload.user_id}`).emit(event, payload);
  }
};

export const emitOrderCreated = (order: unknown & { user_id?: string }) => {
  emitToAudiences('orders:created', order, { staffRoom: 'orders:staff' });
};

export const emitOrderUpdated = (order: unknown & { user_id?: string }) => {
  emitToAudiences('orders:updated', order, { staffRoom: 'orders:staff' });
};

export const emitTopUpRequestCreated = (request: unknown & { user_id?: string }) => {
  emitToAudiences('topups:created', request, { staffRoom: 'topups:staff' });
};

export const emitTopUpRequestUpdated = (request: unknown & { user_id?: string }) => {
  emitToAudiences('topups:updated', request, { staffRoom: 'topups:staff' });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io server is not initialized');
  }

  return io;
};
