import type { ChatMessage, ChatSummary, PaginatedMessages } from '../types/chat';
import { httpClient } from './http-client';

export const chatApi = {
  async getChats() {
    return httpClient.get<{ chats: ChatSummary[] }>('/chats');
  },

  async createDirectChat(targetUserId: string) {
    return httpClient.post<{ chat: ChatSummary }>('/chats/direct', { targetUserId });
  },

  async createGroupChat(payload: {
    name: string;
    description?: string;
    participantIds?: string[];
    visibility?: 'public' | 'private';
  }) {
    return httpClient.post<{ chat: ChatSummary }>('/chats/group', payload);
  },

  async joinByInvite(code: string) {
    return httpClient.post<{ chat: ChatSummary }>('/chats/join', { code });
  },

  async regenerateInvite(chatId: string) {
    return httpClient.post<{ inviteCode: string }>(`/chats/${chatId}/invite`);
  },

  async leaveChat(chatId: string) {
    return httpClient.post<{ message: string }>(`/chats/${chatId}/leave`);
  },

  async getChatMessages(chatId: string, params?: { limit?: number; before?: string }) {
    return httpClient.get<PaginatedMessages>(`/chats/${chatId}/messages`, { params });
  },

  async sendMessage(chatId: string, content: string) {
    return httpClient.post<{ message: ChatMessage }>(`/chats/${chatId}/messages`, { content });
  },
};
