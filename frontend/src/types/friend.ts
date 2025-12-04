import type { UserPreview } from './user';

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';
export type FriendshipDirection = 'incoming' | 'outgoing';

export interface Friendship {
  _id: string;
  status: FriendshipStatus;
  createdAt: string;
  acceptedAt?: string;
  direction: FriendshipDirection;
  user: UserPreview;
}

export interface FriendSearchResult extends UserPreview {
  friendshipStatus: FriendshipStatus | null;
}
