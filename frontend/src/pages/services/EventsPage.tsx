import { useUnit } from 'effector-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  eventsApi,
  type Event,
  type EventFilters,
  type CreateEventPayload,
  type UpdateEventPayload,
} from '../../api/events';
import Button from '../../components/layout/Button/Button';
import Input from '../../components/layout/Input/Input';
import Select from '../../components/layout/Select/Select';
import ServiceHeader from '../../components/layout/ServiceHeader/ServiceHeader.tsx';
import NotificationBell from '../../components/Notifications/NotificationBell';
import EventFormModal from '../../components/Events/EventFormModal';
import EventDetailsModal from '../../components/Events/EventDetailsModal';
import { showToast } from '../../components/layout/Toast/stores/toastStore';
import { $currentUser, logout } from '../../models/users';
import { formatBalance } from '../../utils/formatBalance';

type ViewMode = 'all' | 'my' | 'organized';

const PAGE_CONTAINER = 'w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

const EventsPage: React.FC = () => {
  const currentUser = useUnit($currentUser);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    type: '',
    status: '',
    search: '',
    page: 1,
    limit: 20,
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const sortEventsByPhase = (list: Event[]) => {
    const now = new Date().getTime();
    const phase = (event: Event) => {
      const start = new Date(event.startDate).getTime();
      const end = new Date(event.endDate).getTime();
      if (start <= now && end >= now) return 0; // ongoing
      if (start > now) return 1; // upcoming
      return 2; // past
    };

    return [...list].sort((a, b) => {
      const pa = phase(a);
      const pb = phase(b);
      if (pa !== pb) return pa - pb;

      const aStart = new Date(a.startDate).getTime();
      const bStart = new Date(b.startDate).getTime();

      if (pa === 0 || pa === 1) {
        return aStart - bStart; // earlier first
      }
      return bStart - aStart; // past: recent first
    });
  };
  const viewTabs = useMemo(() => {
    const tabs: { id: ViewMode; label: string }[] = [
      { id: 'all', label: 'Все события' },
      { id: 'my', label: 'Мои события' },
    ];
    if (isAdmin) {
      tabs.push({ id: 'organized', label: 'Организованные мной' });
    }
    return tabs;
  }, [isAdmin]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      if (viewMode === 'my') {
        const response = await eventsApi.getMyEvents();
        setEvents(sortEventsByPhase(response.events));
      } else if (viewMode === 'organized') {
        const response = await eventsApi.getOrganizedEvents();
        setEvents(sortEventsByPhase(response.events));
      } else {
        const response = await eventsApi.getEvents(filters);
        setEvents(sortEventsByPhase(response.events));
      }
    } catch (error) {
      showToast({ message: 'Ошибка при загрузке событий', type: 'error' });
      console.error('Load events error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [viewMode, filters]);

  const handleRegister = async (eventId: string) => {
    try {
      await eventsApi.registerForEvent(eventId);
      showToast({
        message: 'Вы успешно зарегистрировались на событие',
        type: 'success',
      });
      loadEvents();
    } catch (error: any) {
      showToast({
        message: error?.response?.data?.error || 'Ошибка при регистрации',
        type: 'error',
      });
    }
  };

  const handleUnregister = async (eventId: string) => {
    try {
      await eventsApi.unregisterFromEvent(eventId);
      showToast({ message: 'Регистрация отменена', type: 'success' });
      loadEvents();
    } catch (error: any) {
      showToast({
        message:
          error?.response?.data?.error || 'Ошибка при отмене регистрации',
        type: 'error',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      seminar: 'Семинар',
      hackathon: 'Хакатон',
      party: 'Вечеринка',
      workshop: 'Мастер-класс',
      conference: 'Конференция',
      other: 'Другое',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      draft: {
        text: 'Черновик',
        color: 'border border-slate-200 bg-slate-50 text-slate-600',
      },
      published: {
        text: 'Опубликовано',
        color: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
      },
      ongoing: {
        text: 'Идет',
        color: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
      },
      completed: {
        text: 'Завершено',
        color: 'border border-slate-200 bg-slate-50 text-slate-500',
      },
      cancelled: {
        text: 'Отменено',
        color: 'border border-rose-200 bg-rose-50 text-rose-700',
      },
    };
    const badge = badges[status] || {
      text: status,
      color: 'border border-slate-200 bg-slate-50 text-slate-600',
    };
    return (
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold tracking-widest uppercase ${badge.color}`}
      >
        {badge.text}
      </span>
    );
  };

  const isUserRegistered = (event: Event) => {
    if (typeof event.isRegistered === 'boolean') {
      return event.isRegistered;
    }
    return event.participants.some(p => p.user?._id === currentUser?._id);
  };

  const canRegister = (event: Event) => {
    return (
      (event.status === 'published' || event.status === 'ongoing') &&
      !isUserRegistered(event) &&
      event.participantCount < event.capacity
    );
  };

  const handleCreateEvent = async (data: CreateEventPayload) => {
    try {
      await eventsApi.createEvent(data);
      showToast({ message: 'Событие создано успешно', type: 'success' });
      setShowCreateModal(false);
      loadEvents();
    } catch (error: any) {
      showToast({
        message: error?.response?.data?.error || 'Ошибка при создании события',
        type: 'error',
      });
    }
  };

  const canEditEvent = (event: Event) => {
    if (!currentUser) return false;
    return isAdmin || event.organizer?._id === currentUser._id;
  };

  const handleOpenEdit = (event: Event) => {
    // Close details modal if it is open to avoid stacked overlays
    setShowDetailsModal(false);
    setSelectedEvent(event);
    setEditingEvent(event);
    setShowEditModal(true);
  };

  const handleUpdateEvent = async (data: UpdateEventPayload) => {
    if (!editingEvent) return;
    try {
      await eventsApi.updateEvent(editingEvent._id, data);
      showToast({ message: 'Событие обновлено', type: 'success' });
      setShowEditModal(false);
      setEditingEvent(null);
      loadEvents();
    } catch (error: any) {
      showToast({
        message:
          error?.response?.data?.error || 'Ошибка при обновлении события',
        type: 'error',
      });
    }
  };

  const handleAddReview = async (rating: number, comment: string) => {
    if (!selectedEvent) return;
    try {
      await eventsApi.addEventReview(selectedEvent._id, rating, comment);
      showToast({ message: 'Отзыв добавлен успешно', type: 'success' });
      // Reload event details
      const response = await eventsApi.getEventById(selectedEvent._id);
      setSelectedEvent(response.event);
    } catch (error: any) {
      showToast({
        message: error?.response?.data?.error || 'Ошибка при добавлении отзыва',
        type: 'error',
      });
    }
  };

  const handleApproveParticipant = async (participantId: string) => {
    if (!selectedEvent) return;
    try {
      await eventsApi.approveParticipant(selectedEvent._id, participantId);
      showToast({ message: 'Участник подтвержден', type: 'success' });
      const response = await eventsApi.getEventById(selectedEvent._id);
      setSelectedEvent(response.event);
      loadEvents();
    } catch (error: any) {
      showToast({
        message:
          error?.response?.data?.error || 'Ошибка при подтверждении участника',
        type: 'error',
      });
    }
  };

  const handleRejectParticipant = async (participantId: string) => {
    if (!selectedEvent) return;
    try {
      await eventsApi.rejectParticipant(selectedEvent._id, participantId);
      showToast({ message: 'Участник отклонен', type: 'success' });
      const response = await eventsApi.getEventById(selectedEvent._id);
      setSelectedEvent(response.event);
      loadEvents();
    } catch (error: any) {
      showToast({
        message:
          error?.response?.data?.error || 'Ошибка при отклонении участника',
        type: 'error',
      });
    }
  };

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleDeleteEvent = async (eventId: string) => {
    const confirmed = window.confirm(
      'Удалить событие? Это действие нельзя отменить.'
    );
    if (!confirmed) return;
    try {
      await eventsApi.deleteEvent(eventId);
      showToast({ message: 'Событие удалено', type: 'success' });
      setShowDetailsModal(false);
      setSelectedEvent(null);
      setShowEditModal(false);
      setEditingEvent(null);
      loadEvents();
    } catch (error: any) {
      showToast({
        message: error?.response?.data?.error || 'Ошибка при удалении события',
        type: 'error',
      });
    }
  };

  const renderHeaderTabs = (className = '') => (
    <div
      className={`flex w-full justify-center gap-2 overflow-x-auto px-1 py-1.5 sm:py-2 ${className}`}
      role="tablist"
    >
      {viewTabs.map(tab => {
        const isActive = viewMode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setViewMode(tab.id)}
            className={`group relative flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-all duration-300 ${
              isActive
                ? 'border-emerald-400/70 bg-emerald-50 text-emerald-800 shadow-[0_18px_45px_rgba(16,185,129,0.25)]'
                : 'border-transparent bg-transparent text-text-secondary hover:text-emerald-600'
            } cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300`}
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              {tab.label}
            </span>
            <span
              className={`pointer-events-none absolute inset-x-6 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all duration-300 ${
                isActive
                  ? 'scale-x-100 opacity-100'
                  : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-70'
              }`}
            />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_55%)] text-text-primary">
      <ServiceHeader
        subtitle="афиша"
        onLogoClick={() => handleNavigate('/')}
        centerSlot={(
          <div className="w-full max-w-4xl">{renderHeaderTabs()}</div>
        )}
        mobileDockSlot={renderHeaderTabs('justify-center')}
        rightSlot={
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleNavigate('/profile')}
              className="flex min-w-0 items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-inner transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
            >
              <span
                className="max-w-[90px] truncate text-sm font-semibold text-emerald-800 sm:max-w-[140px] sm:text-base"
                title={formatBalance(currentUser?.balance || 0)}
              >
                {formatBalance(currentUser?.balance || 0)}
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-6 sm:w-6">
                +
              </span>
            </button>
            <NotificationBell />
            <button
              type="button"
              onClick={() => logout()}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-colors hover:border-emerald-300 hover:text-emerald-600"
              aria-label="Выйти"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </button>
          </div>
        }
      />

      <main className={`${PAGE_CONTAINER} flex-1 py-10 pb-28 lg:pb-10`}>
        {/* Filters */}
        {viewMode === 'all' && (
          <div className="overflow-hidden rounded-3xl border border-border-subtle bg-white p-6 sm:p-8 shadow-brand-card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Поиск
                </label>
                <Input
                  value={filters.search || ''}
                  onChange={value => setFilters({ ...filters, search: value })}
                  placeholder="Название события..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Тип
                </label>
                <Select
                  value={filters.type || ''}
                  onChange={value => setFilters({ ...filters, type: value })}
                  options={[
                    { value: '', label: 'Все типы' },
                    { value: 'seminar', label: 'Семинар' },
                    { value: 'hackathon', label: 'Хакатон' },
                    { value: 'party', label: 'Вечеринка' },
                    { value: 'workshop', label: 'Мастер-класс' },
                    { value: 'conference', label: 'Конференция' },
                    { value: 'other', label: 'Другое' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Статус
                </label>
                <Select
                  value={filters.status || ''}
                  onChange={value => setFilters({ ...filters, status: value })}
                  options={[
                    { value: '', label: 'Все статусы' },
                    { value: 'published', label: 'Опубликовано' },
                    { value: 'ongoing', label: 'Идет' },
                    { value: 'completed', label: 'Завершено' },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {/* Create Button */}
        {isAdmin && (
          <div className="mb-6">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-brand-card hover:-translate-y-0.5 transition-all duration-200"
            >
              Создать событие
            </Button>
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600"></div>
            <p className="mt-4 text-sm tracking-[0.35em] uppercase text-text-muted">
              Загрузка...
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="overflow-hidden rounded-3xl border border-border-subtle bg-white p-12 text-center shadow-brand-card">
            <p className="text-text-secondary">Нет доступных событий</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div
                key={event._id}
                className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-border-subtle bg-white p-6 shadow-[0_35px_80px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_90px_rgba(16,185,129,0.22)]"
              >
                <div className="flex justify-between items-start mb-4 gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2 break-words">
                      {event.title}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {getEventTypeLabel(event.type)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    {getStatusBadge(event.status)}
                    {canEditEvent(event) && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(event)}
                        className="self-end rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        Редактировать
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-text-secondary mb-4 line-clamp-3 leading-relaxed break-words">
                  {event.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-text-secondary">
                    <span className="font-medium mr-2">📅</span>
                    {formatDate(event.startDate)}
                  </div>
                  <div className="flex items-center text-sm text-text-secondary">
                    <span className="font-medium mr-2">📍</span>
                    {event.location}
                  </div>
                  <div className="flex items-center text-sm text-text-secondary">
                    <span className="font-medium mr-2">👥</span>
                    {event.participantCount} / {event.capacity}
                  </div>
                  {event.averageRating > 0 && (
                    <div className="flex items-center text-sm text-text-secondary">
                      <span className="font-medium mr-2">⭐</span>
                      {event.averageRating.toFixed(1)} ({event.reviewCount}{' '}
                      отзывов)
                    </div>
                  )}
                </div>

                <div className="mt-auto flex flex-col space-y-2">
                  <Button
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowDetailsModal(true);
                    }}
                    className="w-full justify-center shadow-brand-card hover:-translate-y-0.5"
                    size="md"
                  >
                    Подробнее
                  </Button>
                  {canRegister(event) && (
                    <Button
                      onClick={() => handleRegister(event._id)}
                      className="w-full justify-center shadow-brand-card hover:-translate-y-0.5"
                      size="md"
                    >
                      Регистрация
                    </Button>
                  )}
                  {isUserRegistered(event) && (
                    <Button
                      onClick={() => handleUnregister(event._id)}
                      variant="secondary"
                      className="w-full justify-center hover:-translate-y-0.5"
                      size="md"
                    >
                      Отменить регистрацию
                    </Button>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-x-6 bottom-6 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        )}
      </main>
      {viewTabs.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border-subtle bg-white/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur z-40">
          <div className="flex items-center justify-around">
            {viewTabs.map(tab => {
              const isActive = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setViewMode(tab.id)}
                  className={`relative flex min-w-[80px] flex-col items-center gap-1 rounded-2xl border px-3 py-2 text-center text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-brand-indigo bg-brand-seashell border-brand-almond shadow-brand-card'
                      : 'border-transparent text-text-secondary hover:text-brand-indigo hover:bg-surface-muted'
                  }`}
                >
                  <span className="whitespace-normal leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* Modals */}
      <EventFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={data => handleCreateEvent(data as CreateEventPayload)}
      />

      <EventFormModal
        event={editingEvent}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEvent(null);
        }}
        onSave={data => handleUpdateEvent(data as UpdateEventPayload)}
      />

      <EventDetailsModal
        event={selectedEvent}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEvent(null);
        }}
        onRegister={
          selectedEvent && canRegister(selectedEvent)
            ? () => handleRegister(selectedEvent._id)
            : undefined
        }
        onUnregister={
          selectedEvent && isUserRegistered(selectedEvent)
            ? () => handleUnregister(selectedEvent._id)
            : undefined
        }
        onAddReview={
          selectedEvent && isUserRegistered(selectedEvent)
            ? handleAddReview
            : undefined
        }
        isRegistered={selectedEvent ? isUserRegistered(selectedEvent) : false}
        canRegister={selectedEvent ? canRegister(selectedEvent) : false}
        canEdit={selectedEvent ? canEditEvent(selectedEvent) : false}
        onEdit={
          selectedEvent && canEditEvent(selectedEvent)
            ? () => handleOpenEdit(selectedEvent)
            : undefined
        }
        onDelete={
          selectedEvent && canEditEvent(selectedEvent)
            ? () => handleDeleteEvent(selectedEvent._id)
            : undefined
        }
        onApproveParticipant={
          selectedEvent && canEditEvent(selectedEvent)
            ? participantId => handleApproveParticipant(participantId)
            : undefined
        }
        onRejectParticipant={
          selectedEvent && canEditEvent(selectedEvent)
            ? participantId => handleRejectParticipant(participantId)
            : undefined
        }
      />
    </div>
  );
};

export default EventsPage;

