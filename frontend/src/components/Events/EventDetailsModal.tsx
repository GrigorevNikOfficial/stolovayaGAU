import React, { useState } from 'react';
import type { Event } from '../../api/events';
import Button from '../layout/Button/Button';

interface EventDetailsModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onRegister?: () => void;
  onUnregister?: () => void;
  onAddReview?: (rating: number, comment: string) => void;
  isRegistered?: boolean;
  canRegister?: boolean;
  onEdit?: () => void;
  canEdit?: boolean;
  onDelete?: () => void;
  onApproveParticipant?: (participantUserId: string) => void;
  onRejectParticipant?: (participantUserId: string) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  onRegister,
  onUnregister,
  onAddReview,
  isRegistered,
  canRegister,
  onEdit,
  canEdit,
  onDelete,
  onApproveParticipant,
  onRejectParticipant,
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!isOpen || !event) return null;

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

  const handleSubmitReview = () => {
    if (onAddReview && rating >= 1 && rating <= 5) {
      onAddReview(rating, comment);
      setShowReviewForm(false);
      setRating(5);
      setComment('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-100 bg-white shadow-2xl">
        <div className="p-5 sm:p-7">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2 break-words">
                {event.title}
              </h2>
              <p className="text-lg text-gray-600">
                {getEventTypeLabel(event.type)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl"
            >
              ×
            </button>
          </div>

          {/* Event Info */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <p className="font-semibold text-gray-700">Начало</p>
                  <p className="text-gray-600">{formatDate(event.startDate)}</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <p className="font-semibold text-gray-700">Окончание</p>
                  <p className="text-gray-600">{formatDate(event.endDate)}</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">📍</span>
                <div>
                  <p className="font-semibold text-gray-700">Место</p>
                  <p className="text-gray-600">{event.location}</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">👥</span>
                <div>
                  <p className="font-semibold text-gray-700">Участники</p>
                  <p className="text-gray-600">
                    {event.participantCount} / {event.capacity}
                  </p>
                </div>
              </div>
            </div>

            {/* Organizer */}
            <div className="flex items-center">
              <span className="text-2xl mr-3">👤</span>
              <div>
                <p className="font-semibold text-gray-700">Организатор</p>
                <p className="text-gray-600">
                  {event.organizer.first_name} {event.organizer.last_name}
                </p>
              </div>
            </div>

            {/* Rating */}
            {event.averageRating > 0 && (
              <div className="flex items-center">
                <span className="text-2xl mr-3">⭐</span>
                <div>
                  <p className="font-semibold text-gray-700">Рейтинг</p>
                  <p className="text-gray-600">
                    {event.averageRating.toFixed(1)} ({event.reviewCount}{' '}
                    отзывов)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Описание
            </h3>
            <p className="text-gray-600 whitespace-pre-wrap break-words">
              {event.description}
            </p>
          </div>

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Теги</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Approval status for participant */}
          {isRegistered && event.userApprovalStatus && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Статус заявки
              </h3>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm font-semibold text-gray-800">
                {event.userApprovalStatus === 'approved'
                  ? 'Подтверждено'
                  : event.userApprovalStatus === 'pending'
                    ? 'Ожидает подтверждения организатора'
                    : 'Отклонено'}
              </div>
            </div>
          )}

          {/* Organizer approval tools */}
          {canEdit && event.participants.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-800">
                  Заявки участников
                </h3>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {event.participants.map(part => (
                  <div
                    key={part.user._id}
                    className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800">
                        {part.user.first_name} {part.user.last_name}
                      </span>
                      {part.user.phone && (
                        <span className="text-xs text-gray-600">
                          Телефон: {part.user.phone}
                        </span>
                      )}
                      <span className="text-xs text-gray-600">
                        Статус: {part.approvalStatus || 'approved'}
                      </span>
                    </div>
                    {part.approvalStatus === 'pending' && (
                      <div className="flex gap-2">
                        {onApproveParticipant && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onApproveParticipant(part.user._id)}
                          >
                            Подтвердить
                          </Button>
                        )}
                        {onRejectParticipant && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRejectParticipant(part.user._id)}
                          >
                            Отклонить
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {event.reviews.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Отзывы
              </h3>
              <div className="space-y-4">
                {event.reviews.map((review, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded">
                    <div className="flex items-center mb-2">
                      {review.user.avatar?.url && (
                        <img
                          src={review.user.avatar.url}
                          alt={review.user.first_name}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">
                          {review.user.first_name} {review.user.last_name}
                        </p>
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-2">
                            {'★'.repeat(review.rating)}
                            {'☆'.repeat(5 - review.rating)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString(
                              'ru-RU'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-600">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Form */}
          {isRegistered && onAddReview && (
            <div className="mb-6">
              {!showReviewForm ? (
                <Button onClick={() => setShowReviewForm(true)}>
                  Оставить отзыв
                </Button>
              ) : (
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Ваш отзыв
                  </h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Оценка
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map(value => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`text-3xl ${
                            value <= rating
                              ? 'text-yellow-500'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Комментарий (необязательно)
                    </label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Расскажите о вашем опыте..."
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSubmitReview}>
                      Отправить отзыв
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:space-x-4">
            {canEdit && onEdit && (
              <Button onClick={onEdit} className="flex-1" variant="secondary">
                Редактировать
              </Button>
            )}
            {canEdit && onDelete && (
              <Button
                onClick={onDelete}
                className="flex-1 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300"
                variant="outline"
              >
                Удалить
              </Button>
            )}
            {canRegister && onRegister && (
              <Button onClick={onRegister} className="flex-1">
                Зарегистрироваться
              </Button>
            )}
            {isRegistered && onUnregister && (
              <Button
                onClick={onUnregister}
                className="flex-1"
                variant="outline"
              >
                Отменить регистрацию
              </Button>
            )}
            <Button onClick={onClose} className="flex-1" variant="outline">
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
