import { useUnit } from 'effector-react';
import React, { useEffect, useState } from 'react';
import { eventsApi, type Event, type EventFilters, type CreateEventPayload } from '../../api/events';
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
      showToast({ message: 'Вы успешно зарегистрировались на событие', type: 'success' });
      loadEvents();
    } catch (error: any) {
      showToast({ message: error?.response?.data?.error || 'Ошибка при регистрации', type: 'error' });
    }
  };

  const handleUnregister = async (eventId: string) => {
    try {
      await eventsApi.unregisterFromEvent(eventId);
      showToast({ message: 'Регистрация отменена', type: 'success' });
      loadEvents();
    } catch (error: any) {
      showToast({ message: error?.response?.data?.error || 'Ошибка при отмене регистрации', type: 'error' });
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
      draft: { text: 'Черновик', color: 'bg-gray-500' },
      published: { text: 'Опубликовано', color: 'bg-green-500' },
      ongoing: { text: 'Идет', color: 'bg-blue-500' },
      completed: { text: 'Завершено', color: 'bg-gray-400' },
      cancelled: { text: 'Отменено', color: 'bg-red-500' },
    };
    const badge = badges[status] || { text: status, color: 'bg-gray-500' };
    return (
      <span className={`px-2 py-1 rounded text-white text-xs ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const isUserRegistered = (event: Event) => {
    return event.participants.some((p) => p.user._id === currentUser?._id);
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
      showToast({ message: error?.response?.data?.error || 'Ошибка при создании события', type: 'error' });
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
      showToast({ message: error?.response?.data?.error || 'Ошибка при добавлении отзыва', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src={LogoSAU} alt="SAU" className="h-12 w-12 rounded" />
            <h1 className="text-2xl font-bold text-gray-800">События</h1>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="text-sm text-gray-600">
              Баланс: {formatBalance(currentUser?.balance || 0)}
            </div>
            <button
              onClick={() => logout()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Mode Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded ${
              viewMode === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Все события
          </button>
          <button
            onClick={() => setViewMode('my')}
            className={`px-4 py-2 rounded ${
              viewMode === 'my'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Мои события
          </button>
          {isAdmin && (
            <button
              onClick={() => setViewMode('organized')}
              className={`px-4 py-2 rounded ${
                viewMode === 'organized'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Организованные мной
            </button>
          )}
        </div>

        {/* Filters */}
        {viewMode === 'all' && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
                <Input
                  value={filters.search || ''}
                  onChange={(value) => setFilters({ ...filters, search: value })}
                  placeholder="Название события..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тип</label>
                <Select
                  value={filters.type || ''}
                  onChange={(value) => setFilters({ ...filters, type: value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                <Select
                  value={filters.status || ''}
                  onChange={(value) => setFilters({ ...filters, status: value })}
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
            <Button onClick={() => setShowCreateModal(true)}>Создать событие</Button>
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Загрузка...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Нет доступных событий</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getEventTypeLabel(event.type)}
                    </p>
                  </div>
                  {getStatusBadge(event.status)}
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">📅</span>
                    {formatDate(event.startDate)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">📍</span>
                    {event.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">👥</span>
                    {event.participantCount} / {event.capacity}
                  </div>
                  {event.averageRating > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">⭐</span>
                      {event.averageRating.toFixed(1)} ({event.reviewCount} отзывов)
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowDetailsModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Подробнее
                  </button>
                  {canRegister(event) && (
                    <button
                      onClick={() => handleRegister(event._id)}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Регистрация
                    </button>
                  )}
                  {isUserRegistered(event) && (
                    <button
                      onClick={() => handleUnregister(event._id)}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Отменить
                    </button>
                  )}
                </div>
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
          selectedEvent && isUserRegistered(selectedEvent) ? handleAddReview : undefined
        }
        isRegistered={selectedEvent ? isUserRegistered(selectedEvent) : false}
        canRegister={selectedEvent ? canRegister(selectedEvent) : false}
      />
    </div>
  );
};

export default EventsPage;
