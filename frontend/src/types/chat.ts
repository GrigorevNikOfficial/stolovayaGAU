import type { UserPreview } from './user';

export type ChatVisibility = 'public' | 'private';
export type ChatType = 'direct' | 'group';
export type ParticipantRole = 'owner' | 'admin' | 'member';
export type ParticipantStatus = 'active' | 'pending';

export interface ChatParticipant {
  _id: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt?: string;
  invitedAt?: string | null;
  invitedBy?: UserPreview | null;
  user: UserPreview;
}

export interface ChatSummary {
  _id: string;
  type: ChatType;
  name: string;
  rawName?: string;
  description?: string;
  visibility: ChatVisibility;
  inviteCode: string | null;
  participants: ChatParticipant[];
  participantCount: number;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
  avatar?: {
    key: string;
    url: string;
  } | null;
  membershipStatus: ParticipantStatus;
  membershipRole: ParticipantRole;
  membershipSince?: string;
  membershipInvitedAt?: string | null;
}

export interface ChatMessage {
  _id: string;
  chat: string;
  content: string;
  attachments: Array<{
    url: string;
    name?: string;
    type?: string;
    size?: number;
  }>;
  createdAt: string;
  sender: UserPreview;
}

export interface PaginatedMessages {
  messages: ChatMessage[];
  hasMore: boolean;
}
