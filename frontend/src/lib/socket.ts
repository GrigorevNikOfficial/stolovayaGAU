import { io, type Socket } from 'socket.io-client';
import { API_CONFIG } from '../api/config';

type EventHandler = (...args: any[]) => void;

type HandlerMap = Map<string, Set<EventHandler>>;

const handlerMap: HandlerMap = new Map();
let socket: Socket | null = null;

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

const fallbackSocketUrl = 'http://localhost:5001';
const envSocketUrl = (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim();
const derivedFromApi = API_CONFIG.BASE_URL.replace(/\/api$/i, '');
const resolvedSocketUrl = stripTrailingSlash(
  envSocketUrl || derivedFromApi || fallbackSocketUrl
);

const attachHandlers = (target: Socket) => {
  handlerMap.forEach((handlers, event) => {
    handlers.forEach(handler => {
      target.on(event, handler);
    });
  });
};

const detachHandlers = (target: Socket) => {
  handlerMap.forEach((handlers, event) => {
    handlers.forEach(handler => {
      target.off(event, handler);
    });
  });
};

export const connectSocket = (token: string | null | undefined) => {
  if (!token) {
    return null;
  }

  if (socket) {
    detachHandlers(socket);
    socket.disconnect();
    socket = null;
  }

  socket = io(resolvedSocketUrl, {
    transports: ['websocket'],
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('[socket.io] connected', socket?.id);
  });

  socket.on('disconnect', (reason: Socket.DisconnectReason) => {
    console.log('[socket.io] disconnected', reason);
  });

  socket.on('connect_error', (error: Error) => {
    console.error('[socket.io] connection error', error.message);
  });

  attachHandlers(socket);

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  detachHandlers(socket);
  socket.disconnect();
  socket = null;
};

export const getSocket = () => socket;

export const onSocketEvent = (event: string, handler: EventHandler) => {
  if (!handlerMap.has(event)) {
    handlerMap.set(event, new Set());
  }

  handlerMap.get(event)!.add(handler);

  if (socket) {
    socket.on(event, handler);
  }

  return () => {
    handlerMap.get(event)?.delete(handler);

    if (socket) {
      socket.off(event, handler);
    }

    if (handlerMap.get(event)?.size === 0) {
      handlerMap.delete(event);
    }
  };
};
