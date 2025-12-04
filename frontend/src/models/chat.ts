import { createEffect, createEvent, createStore, sample } from 'effector';
import { chatApi } from '../api/chat';
import { friendsApi } from '../api/friends';
import { showToast } from '../components/layout/Toast/stores/toastStore.ts';
import { onSocketEvent } from '../lib/socket';
import type { ChatMessage, ChatSummary } from '../types/chat';
import type { FriendSearchResult, Friendship } from '../types/friend';

const upsertChat = (chats: ChatSummary[], chat: ChatSummary) => {
  const index = chats.findIndex(item => item._id === chat._id);
  if (index === -1) {
    return [chat, ...chats];
  }
  const updated = [...chats];
  updated[index] = chat;
  return updated;
};

const updateChatPreview = (chats: ChatSummary[], message: ChatMessage) => {
  return chats.map(chat =>
    chat._id === message.chat
      ? {
          ...chat,
          lastMessageAt: message.createdAt,
          lastMessagePreview: message.content || 'Вложение',
        }
      : chat
  );
};

const appendMessage = (
  map: Record<string, ChatMessage[]>,
  chatId: string,
  message: ChatMessage,
) => {
  const current = map[chatId] || [];
  if (current.some(item => item._id === message._id)) {
    return map;
  }
  return {
    ...map,
    [chatId]: [...current, message],
  };
};

const setMessages = (
  map: Record<string, ChatMessage[]>,
  chatId: string,
  messages: ChatMessage[],
) => ({
  ...map,
  [chatId]: messages,
});

export const loadChats = createEvent();
export const selectChat = createEvent<string | null>();
export const requestDirectChat = createEvent<string>();
export const requestGroupChat = createEvent<{
  name: string;
  description?: string;
  participantIds?: string[];
  visibility?: 'public' | 'private';
}>();
export const requestMessages = createEvent<string>();
export const postMessage = createEvent<{ chatId: string; content: string }>();
export const joinChatByCode = createEvent<string>();
export const loadFriends = createEvent();
export const loadFriendRequests = createEvent();
export const searchFriends = createEvent<string>();
export const sendFriendRequest = createEvent<string>();
export const respondToRequest = createEvent<{ requestId: string; action: 'accept' | 'decline' }>();
export const removeFriend = createEvent<string>();
export const leaveChat = createEvent<string>();

export const incomingSocketMessage = createEvent<ChatMessage>();

onSocketEvent('chat:message', payload => {
  if (payload && typeof payload === 'object') {
    incomingSocketMessage(payload as ChatMessage);
  }
});

export const loadChatsFx = createEffect(async () => {
  const response = await chatApi.getChats();
  return response.chats;
});

export const createDirectChatFx = createEffect(async (targetUserId: string) => {
  const response = await chatApi.createDirectChat(targetUserId);
  return response.chat;
});

export const createGroupChatFx = createEffect(
  async (payload: { name: string; description?: string; participantIds?: string[]; visibility?: 'public' | 'private' }) => {
    const response = await chatApi.createGroupChat(payload);
    return response.chat;
  }
);

export const joinByCodeFx = createEffect(async (code: string) => {
  const response = await chatApi.joinByInvite(code);
  return response.chat;
});

export const loadMessagesFx = createEffect(async (chatId: string) => {
  const response = await chatApi.getChatMessages(chatId);
  return { chatId, ...response };
});

export const sendMessageFx = createEffect(async ({ chatId, content }: { chatId: string; content: string }) => {
  const response = await chatApi.sendMessage(chatId, content);
  return response.message;
});

export const leaveChatFx = createEffect(async (chatId: string) => {
  await chatApi.leaveChat(chatId);
  return chatId;
});

export const loadFriendsFx = createEffect(async () => {
  const response = await friendsApi.getFriends();
  return response.friends;
});

export const loadFriendRequestsFx = createEffect(async () => {
  return friendsApi.getRequests();
});

export const searchFriendsFx = createEffect(async (query: string) => {
  if (!query || query.trim().length < 2) {
    return [] as FriendSearchResult[];
  }
  const response = await friendsApi.search(query.trim());
  return response.users;
});

export const sendFriendRequestFx = createEffect(async (targetUserId: string) => {
  const response = await friendsApi.sendRequest(targetUserId);
  return response.friendship;
});

export const respondFriendRequestFx = createEffect(async ({ requestId, action }: { requestId: string; action: 'accept' | 'decline' }) => {
  const response = await friendsApi.respond(requestId, action);
  return response.friendship;
});

export const removeFriendFx = createEffect(async (friendId: string) => {
  await friendsApi.remove(friendId);
  return friendId;
});

export const $chats = createStore<ChatSummary[]>([])
  .on(loadChatsFx.doneData, (_, chats) => chats)
  .on(createDirectChatFx.doneData, (state, chat) => upsertChat(state, chat))
  .on(createGroupChatFx.doneData, (state, chat) => upsertChat(state, chat))
  .on(joinByCodeFx.doneData, (state, chat) => upsertChat(state, chat))
  .on(sendMessageFx.doneData, (state, message) => updateChatPreview(state, message))
  .on(incomingSocketMessage, (state, message) => updateChatPreview(state, message))
  .on(leaveChatFx.doneData, (state, chatId) => state.filter(chat => chat._id !== chatId));

export const $activeChatId = createStore<string | null>(null)
  .on(selectChat, (_, chatId) => chatId)
  .on(loadChatsFx.doneData, (state, chats) => (state ?? chats[0]?._id ?? null))
  .on(createDirectChatFx.doneData, (_, chat) => chat._id)
  .on(createGroupChatFx.doneData, (_, chat) => chat._id)
  .on(joinByCodeFx.doneData, (_, chat) => chat._id)
  .on(leaveChatFx.doneData, (state, chatId) => (state === chatId ? null : state));

export const $messagesByChat = createStore<Record<string, ChatMessage[]>>({})
  .on(loadMessagesFx.doneData, (state, { chatId, messages }) => setMessages(state, chatId, messages))
  .on(sendMessageFx.doneData, (state, message) => appendMessage(state, message.chat, message))
  .on(incomingSocketMessage, (state, message) => appendMessage(state, message.chat, message))
  .on(leaveChatFx.doneData, (state, chatId) => {
    const next = { ...state };
    delete next[chatId];
    return next;
  });

export const $friends = createStore<Friendship[]>([])
  .on(loadFriendsFx.doneData, (_, friends) => friends)
  .on(sendFriendRequestFx.doneData, (state, friendship) =>
    friendship.status === 'accepted' ? [...state, friendship] : state
  )
  .on(respondFriendRequestFx.doneData, (state, friendship) =>
    friendship.status === 'accepted'
      ? [...state, friendship]
      : state.filter(item => item._id !== friendship._id)
  )
  .on(removeFriendFx.doneData, (state, friendId) => state.filter(friend => friend._id !== friendId));

export const $friendRequests = createStore<{ incoming: Friendship[]; outgoing: Friendship[] }>({ incoming: [], outgoing: [] })
  .on(loadFriendRequestsFx.doneData, (_, requests) => requests)
  .on(sendFriendRequestFx.doneData, (state, friendship) => ({
    ...state,
    outgoing: [...state.outgoing.filter(item => item._id !== friendship._id), friendship],
  }))
  .on(respondFriendRequestFx.doneData, (state, friendship) => ({
    incoming: state.incoming.filter(item => item._id !== friendship._id),
    outgoing: state.outgoing.filter(item => item._id !== friendship._id),
  }));

export const $friendSearchResults = createStore<FriendSearchResult[]>([])
  .on(searchFriendsFx.doneData, (_, results) => results)
  .reset(searchFriendsFx.fail);

sample({
  clock: loadChats,
  target: loadChatsFx,
});

sample({
  clock: requestDirectChat,
  target: createDirectChatFx,
});

sample({
  clock: requestGroupChat,
  target: createGroupChatFx,
});

sample({
  clock: joinChatByCode,
  target: joinByCodeFx,
});

sample({
  clock: requestMessages,
  target: loadMessagesFx,
});

sample({
  clock: postMessage,
  target: sendMessageFx,
});

sample({
  clock: loadFriends,
  target: loadFriendsFx,
});

sample({
  clock: loadFriendRequests,
  target: loadFriendRequestsFx,
});

sample({
  clock: searchFriends,
  target: searchFriendsFx,
});

sample({
  clock: sendFriendRequest,
  target: sendFriendRequestFx,
});

sample({
  clock: respondToRequest,
  target: respondFriendRequestFx,
});

sample({
  clock: removeFriend,
  target: removeFriendFx,
});

sample({
  clock: leaveChat,
  target: leaveChatFx,
});

sample({
  clock: sendMessageFx.fail,
  fn: () => ({ message: 'Не удалось отправить сообщение', type: 'error' as const }),
  target: showToast,
});

sample({
  clock: createGroupChatFx.done,
  fn: () => ({ message: 'Группа создана', type: 'success' as const }),
  target: showToast,
});

sample({
  clock: joinByCodeFx.fail,
  fn: ({ error }) => ({ message: error.message || 'Не удалось присоединиться', type: 'error' as const }),
  target: showToast,
});

sample({
  clock: sendFriendRequestFx.done,
  fn: () => ({ message: 'Запрос отправлен', type: 'success' as const }),
  target: showToast,
});

sample({
  clock: leaveChatFx.doneData,
  fn: () => ({ message: 'Вы покинули чат', type: 'success' as const }),
  target: showToast,
});

sample({
  clock: respondFriendRequestFx.doneData,
  fn: friendship => ({
    message: friendship.status === 'accepted' ? 'Заявка принята' : 'Заявка отклонена',
    type: 'success' as const,
  }),
  target: showToast,
});
