import { httpClient } from './http-client';
import type { FriendSearchResult, Friendship } from '../types/friend';

export const friendsApi = {
  search(query: string) {
    return httpClient.get<{ users: FriendSearchResult[] }>('/friends/search', {
      params: { query },
    });
  },

  getFriends() {
    return httpClient.get<{ friends: Friendship[] }>('/friends');
  },

  getRequests() {
    return httpClient.get<{ incoming: Friendship[]; outgoing: Friendship[] }>('/friends/requests');
  },

  sendRequest(targetUserId: string) {
    return httpClient.post<{ friendship: Friendship }>('/friends/requests', { targetUserId });
  },

  respond(requestId: string, action: 'accept' | 'decline') {
    return httpClient.patch<{ friendship: Friendship }>(`/friends/requests/${requestId}`, { action });
  },

  remove(friendId: string) {
    return httpClient.delete<{ message: string }>(`/friends/${friendId}`);
  },
};
