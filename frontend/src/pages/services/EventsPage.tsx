import { useUnit } from 'effector-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  eventsApi,
  type Event,
  type EventFilters,
  type CreateEventPayload,
} from '../../api/events';
import Button from '../../components/layout/Button/Button';
import Footer from '../../components/layout/Footer/Footer';
import Input from '../../components/layout/Input/Input';
import Select from '../../components/layout/Select/Select';
import NotificationBell from '../../components/Notifications/NotificationBell';
import EventFormModal from '../../components/Events/EventFormModal';
import EventDetailsModal from '../../components/Events/EventDetailsModal';
import { showToast } from '../../components/layout/Toast/stores/toastStore';
import LogoSAU from '../../images/logo.jpg';
import { $currentUser, logout } from '../../models/users';
import { formatBalance } from '../../utils/formatBalance';

type ViewMode = 'all' | 'my' | 'organized';

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
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
        const response = await eventsApi.getMyEvents({ upcoming: true });
        setEvents(response.events);
      } else if (viewMode === 'organized') {
        const response = await eventsApi.getOrganizedEvents();
        setEvents(response.events);
      } else {
        const response = await eventsApi.getEvents(filters);
        setEvents(response.events);
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
    return event.participants.some(p => p.user._id === currentUser?._id);
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

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const renderHeaderTabs = (className = '') => (
    <div
      className={`flex w-full gap-2 overflow-x-auto px-1 py-1.5 sm:py-2 ${className}`}
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
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-white/95 shadow-sm backdrop-blur">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between gap-4 py-3 sm:py-4 min-h-[72px]">
            <button
              type="button"
              onClick={() => handleNavigate('/')}
              className="group flex items-center gap-3 rounded-2xl border border-transparent px-1 py-1 text-left transition-all duration-200 hover:border-emerald-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              aria-label="Перейти на главную"
            >
              <img
                src={LogoSAU}
                alt="Логотип сервиса"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-3xl border border-transparent transition-transform duration-200 group-hover:scale-105"
              />
              <div className="leading-tight">
                <h1 className="flex items-center text-2xl font-black uppercase tracking-tight text-text-primary sm:text-[1.85rem] lg:text-[2.1rem]">
                  <span className="tracking-[-0.04em]">STUD</span>
                  <span className="ml-1 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm tracking-[-0.04em]">
                    MI
                  </span>
                </h1>
                <p className="mt-1 text-xs uppercase tracking-[0.35em] text-text-muted">
                  афиша
                </p>
              </div>
            </button>
            <div className="hidden lg:flex flex-1 justify-center">
              <div className="max-w-3xl w-full">{renderHeaderTabs()}</div>
            </div>
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
          </div>
          <div className="lg:hidden pb-2">
            {renderHeaderTabs('justify-start')}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
                className="group relative overflow-hidden rounded-[28px] border border-border-subtle bg-white p-6 shadow-[0_35px_80px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_90px_rgba(16,185,129,0.22)]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {getEventTypeLabel(event.type)}
                    </p>
                  </div>
                  {getStatusBadge(event.status)}
                </div>

                <p className="text-text-secondary mb-4 line-clamp-3 leading-relaxed">
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

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowDetailsModal(true);
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-[0_18px_35px_rgba(16,185,129,0.35)] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    Подробнее
                  </button>
                  {canRegister(event) && (
                    <button
                      onClick={() => handleRegister(event._id)}
                      className="w-full px-4 py-2 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-[0_18px_35px_rgba(16,185,129,0.35)] transition-all duration-200 hover:-translate-y-0.5"
                    >
                      Регистрация
                    </button>
                  )}
                  {isUserRegistered(event) && (
                    <button
                      onClick={() => handleUnregister(event._id)}
                      className="w-full px-4 py-2 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl font-semibold shadow-[0_18px_35px_rgba(244,63,94,0.35)] transition-all duration-200 hover:-translate-y-0.5"
                    >
                      Отменить регистрацию
                    </button>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-x-6 bottom-6 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      <EventFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateEvent}
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
      />
    </div>
  );
};

export default EventsPage;
