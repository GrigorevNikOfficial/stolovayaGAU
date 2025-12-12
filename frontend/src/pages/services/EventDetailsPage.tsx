import React, { useEffect, useMemo, useState } from 'react';
import { useUnit } from 'effector-react';
import {
  eventsApi,
  type Event,
  type UpdateEventPayload,
} from '../../api/events';
import { usersApi } from '../../api/users';
import type { User } from '../../types/user';
import Button from '../../components/layout/Button/Button';
import ServiceHeader from '../../components/layout/ServiceHeader/ServiceHeader';
import NotificationBell from '../../components/Notifications/NotificationBell';
import { $currentUser, logout } from '../../models/users';
import { showToast } from '../../components/layout/Toast/stores/toastStore';
import EventFormModal from '../../components/Events/EventFormModal';
import Input from '../../components/layout/Input/Input';
import Select from '../../components/layout/Select/Select';
import { formatBalance } from '../../utils/formatBalance';

const PAGE_CONTAINER = 'w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

const statusOptions = [
  { value: 'draft', label: 'Черновик' },
  { value: 'registration_open', label: 'Регистрация открыта' },
  { value: 'registration_closed', label: 'Регистрация закрыта' },
  { value: 'ongoing', label: 'Идет' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
];

type ViewMode = 'all' | 'my' | 'organized';

const EventDetailsPage: React.FC = () => {
  const currentUser = useUnit($currentUser);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [manualApprovalStatus] = useState<'approved'>('approved');
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  const eventId = useMemo(() => {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1];
  }, []);

  const isOrganizerOrAdmin = useMemo(() => {
    if (!event || !currentUser) return false;
    return (
      currentUser.role === 'admin' || event.organizer?._id === currentUser._id
    );
  }, [event, currentUser]);

  const isRegistered = useMemo(() => {
    if (!event || !currentUser) return false;
    if (typeof event.isRegistered === 'boolean') return event.isRegistered;
    return event.participants.some(p => p.user?._id === currentUser._id);
  }, [event, currentUser]);

  const userApprovalStatus = useMemo(() => {
    if (!event || !currentUser) return null;
    const participant = event.participants.find(
      p => p.user?._id === currentUser._id
    );
    return participant?.approvalStatus ?? event.userApprovalStatus ?? null;
  }, [event, currentUser]);

  const viewTabs = useMemo(() => {
    const tabs: { id: ViewMode; label: string; view: ViewMode }[] = [
      { id: 'all', label: 'Все события', view: 'all' },
      { id: 'my', label: 'Мои события', view: 'my' },
    ];
    if (currentUser?.role === 'admin') {
      tabs.push({
        id: 'organized',
        label: 'Организованные мной',
        view: 'organized',
      });
    }
    return tabs;
  }, [currentUser?.role]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingView = params.get('view');
    if (
      incomingView === 'all' ||
      incomingView === 'my' ||
      incomingView === 'organized'
    ) {
      if (incomingView !== 'organized' || currentUser?.role === 'admin') {
        setViewMode(incomingView as ViewMode);
      }
    }
  }, [currentUser?.role]);

  const navigateToList = (view: ViewMode) => {
    const params = new URLSearchParams();
    params.set('view', view);
    handleNavigate(`/services/events?${params.toString()}`);
  };

  const canRegister = useMemo(() => {
    if (!event || !currentUser) return false;
    return (
      event.status === 'registration_open' &&
      !isRegistered &&
      (event.requiresApproval || event.participantCount < event.capacity)
    );
  }, [event, currentUser, isRegistered]);

  const canUnregister = useMemo(() => {
    if (!event || !currentUser || !isRegistered) return false;
    if (!event.requiresApproval) return true;
    return userApprovalStatus !== 'approved';
  }, [event, currentUser, isRegistered, userApprovalStatus]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const { event: evt } = await eventsApi.getEventById(eventId);
      setEvent(evt);
    } catch (error) {
      console.error('Load event error', error);
      showToast({ message: 'Не удалось загрузить событие', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
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
            onClick={() => navigateToList(tab.view)}
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

  const handleRegister = async () => {
    if (!event) return;
    try {
      await eventsApi.registerForEvent(event._id);
      showToast({ message: 'Вы зарегистрировались', type: 'success' });
      loadEvent();
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.error || error?.response?.data?.message;
      showToast({
        message: apiMessage || 'Ошибка регистрации',
        type: 'error',
      });
    }
  };

  const handleUnregister = async () => {
    if (!event) return;
    try {
      await eventsApi.unregisterFromEvent(event._id);
      showToast({ message: 'Регистрация отменена', type: 'success' });
      loadEvent();
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.error || error?.response?.data?.message;
      showToast({
        message: apiMessage || 'Ошибка отмены регистрации',
        type: 'error',
      });
    }
  };

  const handleUpdateStatus = async (status: Event['status']) => {
    if (!event) return;
    try {
      setSaving(true);
      await eventsApi.updateEvent(event._id, { status });
      showToast({ message: 'Статус обновлен', type: 'success' });
      loadEvent();
    } catch (error: any) {
      showToast({
        message: error?.response?.data?.error || 'Не удалось обновить статус',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!event) return;
    try {
      await eventsApi.approveParticipant(event._id, userId);
      showToast({ message: 'Заявка подтверждена', type: 'success' });
      loadEvent();
    } catch (error: any) {
      showToast({
        message: error?.response?.data?.error || 'Не удалось подтвердить',
        type: 'error',
      });
    }
  };

  const handleReject = async (userId: string) => {
    if (!event) return;
    try {
      await eventsApi.rejectParticipant(event._id, userId);
      showToast({ message: 'Заявка отклонена', type: 'success' });
      loadEvent();
    } catch (error: any) {
      showToast({
        message: error?.response?.data?.error || 'Не удалось отклонить',
        type: 'error',
      });
    }
  };

  const handleRemove = async (userId: string) => {
    if (!event) return;
    try {
      await eventsApi.removeParticipant(event._id, userId);
      showToast({ message: 'Участник удален', type: 'success' });
      loadEvent();
    } catch (error: any) {
      showToast({
        message: error?.response?.data?.error || 'Не удалось удалить',
        type: 'error',
      });
    }
  };

  const handleManualAdd = async (targetUserId: string) => {
    if (!event || !targetUserId) return;
    try {
      await eventsApi.addParticipantManually(event._id, {
        userId: targetUserId,
        approvalStatus: manualApprovalStatus,
      });
      showToast({ message: 'Пользователь добавлен', type: 'success' });
      loadEvent();
    } catch (error: any) {
      showToast({
        message: error?.response?.data?.error || 'Не удалось добавить',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (userSearch.trim().length >= 2) {
      setSearchLoading(true);
      timeout = setTimeout(async () => {
        try {
          const { users } = await usersApi.searchUsers(userSearch.trim());
          setUserResults(users);
        } catch (error) {
          console.error('User search error', error);
        } finally {
          setSearchLoading(false);
        }
      }, 300);
    } else {
      setUserResults([]);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [userSearch]);

  const handleDeleteEvent = async () => {
    if (!event) return;
    const confirmed = window.confirm('Удалить событие?');
    if (!confirmed) return;
    try {
      await eventsApi.deleteEvent(event._id);
      showToast({ message: 'Событие удалено', type: 'success' });
      navigateToList(viewMode);
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.error || error?.response?.data?.message;
      showToast({
        message: apiMessage || 'Не удалось удалить',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-primary">
        <div className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm tracking-[0.35em] uppercase text-text-muted">
            Загрузка
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-primary">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">Событие не найдено</p>
          <Button onClick={() => navigateToList(viewMode)}>
            Вернуться к списку
          </Button>
        </div>
      </div>
    );
  }

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

      <main className={`${PAGE_CONTAINER} flex-1 py-10 pb-24 space-y-6`}>
        <div className="overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-brand-card">
          {event.image?.url && (
            <div className="relative w-full overflow-hidden bg-gradient-to-br from-emerald-50 to-white aspect-[16/9] sm:aspect-[21/9] lg:h-72 lg:aspect-auto">
              <img
                src={event.image.url}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-text-muted">
                  Афиша события
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary break-words">
                  {event.title}
                </h1>
                <p className="text-text-secondary">{event.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  {event.status === 'registration_open'
                    ? 'Регистрация открыта'
                    : event.status === 'registration_closed'
                      ? 'Регистрация закрыта'
                      : event.status === 'ongoing'
                        ? 'Идет'
                        : event.status === 'completed'
                          ? 'Завершено'
                          : event.status === 'draft'
                            ? 'Черновик'
                            : 'Отменено'}
                </span>
                {event.tags?.map(tag => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border-soft bg-surface-base p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-text-muted">
                  Начало
                </p>
                <p className="mt-2 text-lg font-semibold text-text-primary">
                  {formatDate(event.startDate)}
                </p>
              </div>
              <div className="rounded-2xl border border-border-soft bg-surface-base p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-text-muted">
                  Окончание
                </p>
                <p className="mt-2 text-lg font-semibold text-text-primary">
                  {formatDate(event.endDate)}
                </p>
              </div>
              <div className="rounded-2xl border border-border-soft bg-surface-base p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-text-muted">
                  Место
                </p>
                <p className="mt-2 text-lg font-semibold text-text-primary">
                  {event.location}
                </p>
              </div>
              <div className="rounded-2xl border border-border-soft bg-surface-base p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-text-muted">
                  Участники
                </p>
                <p className="mt-2 text-lg font-semibold text-text-primary">
                  {event.participantCount} / {event.capacity}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
              <div className="text-sm text-text-secondary">
                Организатор: {event.organizer.first_name}{' '}
                {event.organizer.last_name}
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                {event.chatId && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleNavigate(`/services/chat?chatId=${event.chatId}`)
                    }
                    className="w-full sm:w-auto"
                  >
                    Открыть чат
                  </Button>
                )}
                {isOrganizerOrAdmin && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowEditModal(true)}
                    className="w-full shadow-sm sm:w-auto"
                  >
                    Редактировать
                  </Button>
                )}
                {isOrganizerOrAdmin && (
                  <Button
                    variant="outline"
                    className="w-full border-rose-200 text-rose-700 sm:w-auto"
                    onClick={handleDeleteEvent}
                  >
                    Удалить
                  </Button>
                )}
                {canRegister && (
                  <Button onClick={handleRegister} className="w-full sm:w-auto">
                    Зарегистрироваться
                  </Button>
                )}
                {canUnregister && (
                  <Button
                    variant="outline"
                    onClick={handleUnregister}
                    className="w-full sm:w-auto"
                  >
                    Отменить регистрацию
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-border-subtle bg-white p-6 shadow-brand-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text-primary">
                Участники
              </h2>
              {isOrganizerOrAdmin && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Требуется подтверждение:{' '}
                  {event.requiresApproval ? 'да' : 'нет'}
                </span>
              )}
            </div>

            {event.participants.length === 0 ? (
              <p className="text-text-secondary">Пока нет участников</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 sm:max-h-[420px]">
                {[...event.participants]
                  .sort((a, b) => {
                    const aPending = a.approvalStatus === 'pending';
                    const bPending = b.approvalStatus === 'pending';
                    if (aPending !== bPending) return aPending ? -1 : 1;
                    const aTime = new Date(a.registeredAt).getTime();
                    const bTime = new Date(b.registeredAt).getTime();
                    return aTime - bTime;
                  })
                  .map(part => (
                    <div
                      key={part.user._id}
                      className="flex items-center justify-between rounded-xl border border-border-soft bg-surface-base px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        {part.user.avatar?.url && (
                          <img
                            src={part.user.avatar.url}
                            alt={part.user.first_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-text-primary">
                            {part.user.first_name} {part.user.last_name}
                          </p>
                          <p className="text-xs text-text-secondary">
                            Статус: {part.approvalStatus || 'approved'}
                          </p>
                        </div>
                      </div>
                      {isOrganizerOrAdmin && (
                        <div className="flex gap-2">
                          {part.approvalStatus === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleApprove(part.user._id)}
                              >
                                Подтвердить
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(part.user._id)}
                              >
                                Отклонить
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-200 text-rose-700"
                            onClick={() => handleRemove(part.user._id)}
                          >
                            Удалить
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {isOrganizerOrAdmin && (
              <div className="rounded-2xl border border-border-soft bg-surface-muted p-4 space-y-3">
                <p className="text-sm font-semibold text-text-primary">
                  Добавить участника вручную
                </p>
                <Input
                  placeholder="Имя, фамилия или телефон"
                  value={userSearch}
                  onChange={setUserSearch}
                />
                <div className="space-y-2">
                  {searchLoading && (
                    <p className="text-xs text-text-secondary">
                      Ищем пользователей…
                    </p>
                  )}
                  {!searchLoading &&
                    userResults.length === 0 &&
                    userSearch.trim().length >= 2 && (
                      <p className="text-sm text-text-secondary">
                        Ничего не найдено
                      </p>
                    )}
                  {!searchLoading &&
                    userResults.map(user => (
                      <div
                        key={user._id}
                        className="flex flex-col gap-2 rounded-xl border border-border-soft bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1 text-sm text-text-primary">
                          <p className="font-semibold">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-text-secondary">ID: {user._id}</p>
                          {user.phone && (
                            <p className="text-text-secondary">
                              Телефон: {user.phone}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleManualAdd(user._id)}
                        >
                          Добавить
                        </Button>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-text-secondary">
                  Добавление вручную игнорирует лимит мест, как требуется по
                  процессу.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {isOrganizerOrAdmin && (
              <div className="rounded-3xl border border-border-subtle bg-white p-6 shadow-brand-card space-y-3">
                <h3 className="text-lg font-semibold text-text-primary">
                  Управление статусом
                </h3>
                <Select
                  value={event.status}
                  onChange={value =>
                    handleUpdateStatus(value as Event['status'])
                  }
                  options={statusOptions}
                  disabled={saving}
                />
                <p className="text-xs text-text-secondary">
                  Можно вручную переводить события в любые стадии. Автостатусы
                  продолжат работать по времени.
                </p>
              </div>
            )}

            {event.reviews.length > 0 && (
              <div className="rounded-3xl border border-border-subtle bg-white p-6 shadow-brand-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Отзывы
                  </h3>
                  <span className="text-sm text-text-secondary">
                    {event.averageRating.toFixed(1)} · {event.reviewCount}{' '}
                    отзывов
                  </span>
                </div>
                <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 sm:max-h-80">
                  {event.reviews.map((review, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border-soft bg-surface-base p-3"
                    >
                      <p className="font-semibold text-text-primary">
                        {review.user.first_name} {review.user.last_name}
                      </p>
                      <p className="text-sm text-text-secondary">
                        Оценка: {review.rating}/5
                      </p>
                      {review.comment && (
                        <p className="text-text-secondary mt-1">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <EventFormModal
        event={event}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={async (data: UpdateEventPayload) => {
          if (!event) return;
          try {
            await eventsApi.updateEvent(event._id, data);
            showToast({ message: 'Событие обновлено', type: 'success' });
            setShowEditModal(false);
            loadEvent();
          } catch (error: any) {
            showToast({
              message: error?.response?.data?.error || 'Не удалось обновить',
              type: 'error',
            });
          }
        }}
      />
    </div>
  );
};

export default EventDetailsPage;
