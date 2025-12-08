import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
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
            <p className="text-gray-600 whitespace-pre-wrap">
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

          {/* QR Code */}
          {isRegistered && event.qrCode && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                QR-код для входа
              </h3>
              <p className="text-gray-600 mb-2">
                Покажите этот код на входе для регистрации посещения
              </p>
              <div className="bg-gray-100 p-4 rounded flex flex-col items-center gap-3">
                <QRCodeSVG value={event.qrCode} size={192} includeMargin />
                <p className="text-xs text-gray-500 break-all">
                  {event.qrCode}
                </p>
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
          <div className="flex space-x-4">
            {canRegister && onRegister && (
              <Button onClick={onRegister} className="flex-1">
                Зарегистрироваться
              </Button>
            )}
            {isRegistered && onUnregister && (
              <button
                onClick={onUnregister}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Отменить регистрацию
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
