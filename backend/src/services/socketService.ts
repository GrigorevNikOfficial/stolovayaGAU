import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { Chat } from '../models/Chat.js';
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

const joinUserChatRooms = async (socket: Socket, userId: string) => {
  try {
    const chats = await Chat.find({ 'participants.user': userId }).select('_id');
    chats.forEach(chat => {
      socket.join(`chat:${chat._id.toString()}`);
    });
  } catch (error) {
    console.error('Failed to join chat rooms:', error);
  }
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

     if (user?._id) {
       void joinUserChatRooms(socket, user._id);
     }

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

type AnyPayload = Record<string, unknown>;

const ensureString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return undefined;
};

const extractOwnerId = (payload: AnyPayload): string | undefined => {
  const owner = payload['owner'] as AnyPayload | undefined;
  return (
    ensureString(owner?.id) ||
    ensureString(payload['ownerId']) ||
    ensureString(payload['user_id']) ||
    ensureString(payload['userId'])
  );
};

const extractParticipantIds = (payload: AnyPayload): string[] => {
  const participants = new Set<string>();

  const customer = payload['customer'] as AnyPayload | undefined;
  const provider = payload['provider'] as AnyPayload | undefined;

  const candidateValues = [
    ensureString(customer?.id),
    ensureString(provider?.id),
    ensureString(payload['customerId']),
    ensureString(payload['providerId']),
    ensureString(payload['customer_id']),
    ensureString(payload['provider_id']),
  ];

  candidateValues.forEach(id => {
    if (id) {
      participants.add(id);
    }
  });

  return Array.from(participants);
};

const emitToUsers = (event: string, payload: AnyPayload, userIds: string[]) => {
  if (!io || userIds.length === 0) {
    return;
  }

  userIds.forEach(userId => {
    io!.to(`user:${userId}`).emit(event, payload);
  });
};

const broadcastListing = (event: string, payload: AnyPayload) => {
  if (!io) {
    return;
  }

  io.emit(event, payload);
};

export const emitMarketplaceListingCreated = (listing: AnyPayload) => {
  broadcastListing('marketplace:listings:created', listing);
};

export const emitMarketplaceListingUpdated = (listing: AnyPayload) => {
  broadcastListing('marketplace:listings:updated', listing);
};

export const emitMarketplaceListingDeleted = (payload: AnyPayload) => {
  const enrichedPayload = {
    ...payload,
    ownerId: extractOwnerId(payload) || ensureString(payload['ownerId']),
  };
  broadcastListing('marketplace:listings:deleted', enrichedPayload);
};

const emitRequestEvent = (event: string, payload: AnyPayload) => {
  const participantIds = extractParticipantIds(payload);
  emitToUsers(event, payload, participantIds);
};

export const emitMarketplaceRequestCreated = (request: AnyPayload) => {
  emitRequestEvent('marketplace:requests:created', request);
};

export const emitMarketplaceRequestUpdated = (request: AnyPayload) => {
  emitRequestEvent('marketplace:requests:updated', request);
};

export const emitMarketplaceRequestDeleted = (request: AnyPayload & { id?: string }) => {
  emitRequestEvent('marketplace:requests:deleted', request);
};

export const emitMarketplaceSettingsUpdated = (settings: AnyPayload) => {
  broadcastListing('marketplace:settings:updated', settings);
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

export const emitChatMessage = (
  chatId: string,
  message: unknown,
  participantIds: string[] = []
) => {
  if (!io) {
    return;
  }

  io.to(`chat:${chatId}`).emit('chat:message', message);

  participantIds.forEach(userId => {
    io?.to(`user:${userId}`).emit('chat:message', message);
  });
};

export const attachUsersToChatRoom = (chatId: string, userIds: string[]) => {
  if (!io) {
    return;
  }

  userIds.forEach(userId => {
    io!.in(`user:${userId}`).socketsJoin(`chat:${chatId}`);
  });
};

export const detachUserFromChatRoom = (chatId: string, userId: string) => {
  if (!io) {
    return;
  }

  io.in(`user:${userId}`).socketsLeave(`chat:${chatId}`);
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io server is not initialized');
  }

  return io;
};
