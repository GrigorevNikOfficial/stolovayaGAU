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
import { showToast } from '../../components/layout/Toast/stores/toastStore';
import { $currentUser } from '../../models/users';
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
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

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

  const applyFilters = (list: Event[]) => {
    return list.filter(event => {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const titleMatch = event.title.toLowerCase().includes(query);
        const descriptionMatch = event.description
          .toLowerCase()
          .includes(query);
        if (!titleMatch && !descriptionMatch) return false;
      }

      if (filters.type && event.type !== filters.type) return false;
      if (filters.status && event.status !== filters.status) return false;

      return true;
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingView = params.get('view');
    if (
      incomingView === 'my' ||
      incomingView === 'organized' ||
      incomingView === 'all'
    ) {
      if (incomingView !== 'organized' || isAdmin) {
        setViewMode(incomingView as ViewMode);
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const syncFiltersState = () => setFiltersOpen(mq.matches);
    syncFiltersState();
    mq.addEventListener('change', syncFiltersState);
    return () => mq.removeEventListener('change', syncFiltersState);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('view', viewMode);
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', next);
  }, [viewMode]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      if (viewMode === 'my') {
        const response = await eventsApi.getMyEvents();
        setEvents(sortEventsByPhase(applyFilters(response.events)));
      } else if (viewMode === 'organized') {
        const response = await eventsApi.getOrganizedEvents();
        setEvents(sortEventsByPhase(applyFilters(response.events)));
      } else {
        const response = await eventsApi.getEvents(filters);
        setEvents(sortEventsByPhase(applyFilters(response.events)));
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
      const apiMessage =
        error?.response?.data?.error || error?.response?.data?.message;
      showToast({
        message: apiMessage || 'Ошибка при регистрации',
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
      const apiMessage =
        error?.response?.data?.error || error?.response?.data?.message;
      showToast({
        message: apiMessage || 'Ошибка при отмене регистрации',
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
      registration_open: {
        text: 'Регистрация открыта',
        color: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
      },
      registration_closed: {
        text: 'Регистрация закрыта',
        color: 'border border-amber-200 bg-amber-50 text-amber-700',
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
      event.status === 'registration_open' &&
      !isUserRegistered(event) &&
      (event.requiresApproval || event.participantCount < event.capacity)
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

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const renderCreateCard = () => {
    if (!isAdmin) return null;
    return (
      <button
        type="button"
        onClick={() => setShowCreateModal(true)}
        className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-subtle bg-white p-6 text-text-secondary shadow-brand-card transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:text-emerald-700 hover:shadow-[0_30px_70px_rgba(16,185,129,0.2)]"
      >
        <span className="text-4xl leading-none">+</span>
        <span className="text-sm font-semibold">Создать событие</span>
        <span className="text-xs text-text-muted">Добавьте новую афишу</span>
      </button>
    );
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
        centerSlot={
          <div className="w-full max-w-4xl">{renderHeaderTabs()}</div>
        }
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
          </div>
        }
      />

      <main className={`${PAGE_CONTAINER} flex-1 py-10 pb-28 lg:pb-10`}>
        {/* Filters */}
        <div className="overflow-hidden rounded-3xl border border-border-subtle bg-white p-5 sm:p-8 shadow-brand-card mb-6">
          <div className="flex items-start justify-between gap-3 sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-text-muted">
                фильтры
              </p>
              <p className="text-sm text-text-secondary">
                Подберите события по типу, статусу или названию
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-emerald-300 hover:text-emerald-700 md:hidden"
              onClick={() => setFiltersOpen(prev => !prev)}
              aria-expanded={filtersOpen}
            >
              <span>{filtersOpen ? 'Скрыть' : 'Показать'}</span>
              <span
                className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
              >
                ▼
              </span>
            </button>
          </div>

          <div
            className={`${filtersOpen ? 'grid' : 'hidden md:grid'} grid-cols-1 gap-4 pt-4 md:grid-cols-3`}
          >
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
                  {
                    value: 'registration_open',
                    label: 'Регистрация открыта',
                  },
                  {
                    value: 'registration_closed',
                    label: 'Регистрация закрыта',
                  },
                  { value: 'ongoing', label: 'Идет' },
                  { value: 'completed', label: 'Завершено' },
                  { value: 'cancelled', label: 'Отменено' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600"></div>
            <p className="mt-4 text-sm tracking-[0.35em] uppercase text-text-muted">
              Загрузка...
            </p>
          </div>
        ) : events.length === 0 ? (
          isAdmin ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderCreateCard()}
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border-subtle bg-white p-12 text-center shadow-brand-card">
              <p className="text-text-secondary">Нет доступных событий</p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
            {renderCreateCard()}
            {events.map(event => (
              <div
                key={event._id}
                className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-border-subtle bg-white p-5 sm:p-6 shadow-[0_35px_80px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_90px_rgba(16,185,129,0.22)]"
              >
                {event.image?.url && (
                  <div className="-mx-5 -mt-5 mb-4 aspect-[4/3] overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-50 to-white sm:-mx-6 sm:-mt-6">
                    <img
                      src={event.image.url}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
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
                    onClick={() =>
                      handleNavigate(
                        `/services/events/${event._id}${window.location.search}`
                      )
                    }
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
                  <span className="whitespace-normal leading-tight">
                    {tab.label}
                  </span>
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
    </div>
  );
};

export default EventsPage;
