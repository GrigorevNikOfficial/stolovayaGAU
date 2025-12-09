import { httpClient } from './http-client';

export interface EventParticipant {
  user: {
    _id: string;
    first_name: string;
    last_name: string;
    role: string;
    avatar: {
      key: string;
      url: string;
    };
    phone?: string;
  };
  registeredAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalAt?: string | null;
  approvalBy?: string | null;
}

export interface EventReview {
  user: {
    _id: string;
    first_name: string;
    last_name: string;
    role: string;
    avatar: {
      key: string;
      url: string;
    };
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  type: 'seminar' | 'hackathon' | 'party' | 'workshop' | 'conference' | 'other';
  startDate: string;
  endDate: string;
  location: string;
  organizer: {
    _id: string;
    first_name: string;
    last_name: string;
    role: string;
    avatar: {
      key: string;
      url: string;
    };
  };
  capacity: number;
  participantCount: number;
  participants: EventParticipant[];
  reviews: EventReview[];
  averageRating: number;
  reviewCount: number;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  userApprovalStatus?: 'pending' | 'approved' | 'rejected' | null;
  chatId: string | null;
  image?: {
    key: string;
  };
  tags: string[];
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
  isRegistered?: boolean;
}

export interface EventsResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateEventPayload {
  title: string;
  description: string;
  type: 'seminar' | 'hackathon' | 'party' | 'workshop' | 'conference' | 'other';
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  requiresApproval?: boolean;
  tags?: string[];
  status?: 'draft' | 'published';
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  type?:
    | 'seminar'
    | 'hackathon'
    | 'party'
    | 'workshop'
    | 'conference'
    | 'other';
  startDate?: string;
  endDate?: string;
  location?: string;
  capacity?: number;
  status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  tags?: string[];
  requiresApproval?: boolean;
}

export interface EventFilters {
  type?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  organizerId?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export const eventsApi = {
  async createEvent(payload: CreateEventPayload) {
    return httpClient.post<{ message: string; event: Event }>(
      '/events',
      payload
    );
  },

  async getEvents(filters?: EventFilters) {
    return httpClient.get<EventsResponse>('/events', {
      params: filters as any,
    });
  },

  async getEventById(eventId: string) {
    return httpClient.get<{ event: Event }>(`/events/${eventId}`);
  },

  async updateEvent(eventId: string, payload: UpdateEventPayload) {
    return httpClient.put<{ message: string; event: Event }>(
      `/events/${eventId}`,
      payload
    );
  },

  async deleteEvent(eventId: string) {
    return httpClient.delete<{ message: string }>(`/events/${eventId}`);
  },

  async registerForEvent(eventId: string) {
    return httpClient.post<{ message: string; event: Event }>(
      `/events/${eventId}/register`
    );
  },

  async unregisterFromEvent(eventId: string) {
    return httpClient.post<{ message: string; event: Event }>(
      `/events/${eventId}/unregister`
    );
  },

  async approveParticipant(eventId: string, participantId: string) {
    return httpClient.post<{ message: string; event: Event }>(
      `/events/${eventId}/participants/${participantId}/approve`
    );
  },

  async rejectParticipant(eventId: string, participantId: string) {
    return httpClient.post<{ message: string; event: Event }>(
      `/events/${eventId}/participants/${participantId}/reject`
    );
  },

  async checkInToEvent(qrCode: string) {
    return httpClient.post<{ message: string; event: Event }>(
      '/events/checkin',
      { qrCode }
    );
  },

  async addEventReview(eventId: string, rating: number, comment?: string) {
    return httpClient.post<{ message: string; event: Event }>(
      `/events/${eventId}/review`,
      {
        rating,
        comment,
      }
    );
  },

  async getMyEvents(params?: { status?: string; upcoming?: boolean }) {
    return httpClient.get<{ events: Event[] }>('/events/my', { params });
  },

  async getOrganizedEvents() {
    return httpClient.get<{ events: Event[] }>('/events/organized');
  },
};
