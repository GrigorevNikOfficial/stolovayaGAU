import { useUnit } from 'effector-react';
import React from 'react';
import { BellIcon, CheckIcon } from '../icons/ServiceIcons';
import {
  $notificationMeta,
  $notifications,
  $notificationsLoading,
  loadMoreNotifications,
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../models/notifications';
import { $currentUser } from '../../models/users';
import type { NotificationItem } from '../../types/notification';

const navigate = (path: string) => {
  if (!path) {
    return;
  }

  if (/^https?:/i.test(path)) {
    window.open(path, '_blank', 'noopener');
    return;
  }

  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const formatRelativeTime = (timestamp?: string | null) => {
  if (!timestamp) {
    return '';
  }

  const target = new Date(timestamp);
  const diff = Date.now() - target.getTime();
  if (Number.isNaN(diff)) {
    return '';
  }

  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) {
    return 'только что';
  }
  if (minutes < 60) {
    return `${minutes} мин назад`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ч назад`;
  }
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
};

const severityAccent: Record<NotificationItem['severity'], string> = {
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
};

const categoryIcon: Partial<Record<NotificationItem['category'], string>> = {
  orders: '🍽️',
  marketplace: '🛎️',
  chat: '💬',
  balance: '💰',
  topups: '💳',
};

export type NotificationBellProps = {
  onRequireAuth?: () => void;
  className?: string;
};

export const NotificationBell: React.FC<NotificationBellProps> = ({ onRequireAuth, className }) => {
  const {
    notifications,
    meta,
    loading,
    handleLoadMore,
    handleLoad,
    handleMarkAll,
    handleMarkRead,
    currentUser,
  } = useUnit({
    notifications: $notifications,
    meta: $notificationMeta,
    loading: $notificationsLoading,
    handleLoadMore: loadMoreNotifications,
    handleLoad: loadNotifications,
    handleMarkAll: markAllNotificationsRead,
    handleMarkRead: markNotificationRead,
    currentUser: $currentUser,
  });

  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const hoverIntentRef = React.useRef(false);

  React.useEffect(() => {
    if (!currentUser) {
      setIsOpen(false);
      return;
    }
    if (!notifications.length) {
      handleLoad();
    }
  }, [currentUser, notifications.length, handleLoad]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    setIsOpen(prev => !prev);
  };

  const closeDropdown = () => {
    hoverIntentRef.current = false;
    setIsOpen(false);
  };

  const handleItemClick = (notification: NotificationItem) => {
    if (!notification.read) {
      handleMarkRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      closeDropdown();
    }
  };

  const visibleNotifications = notifications;
  const unreadCount = meta.unreadCount ?? 0;
  const showEmptyState = !loading && visibleNotifications.length === 0;

  if (!currentUser) {
    return (
      <button
        type="button"
        onClick={onRequireAuth}
        className={`w-11 h-11 flex items-center justify-center rounded-full border border-border-subtle text-text-secondary hover:text-emerald-600 hover:border-emerald-300 transition-colors bg-surface-base ${className ?? ''}`}
        aria-label="Уведомления"
      >
        <BellIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className ?? ''}`}
      onMouseEnter={() => {
        hoverIntentRef.current = true;
        setIsOpen(true);
      }}
      onMouseLeave={() => {
        hoverIntentRef.current = false;
        window.setTimeout(() => {
          if (!hoverIntentRef.current) {
            setIsOpen(false);
          }
        }, 120);
      }}
    >
      <button
        type="button"
        onClick={toggleDropdown}
        className="w-11 h-11 flex items-center justify-center rounded-full border border-border-subtle text-text-secondary hover:text-emerald-600 hover:border-emerald-300 transition-colors bg-surface-base relative"
        aria-label="Центр уведомлений"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-semibold text-white">
            {Math.min(unreadCount, 99)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[320px] rounded-3xl border border-border-soft bg-white shadow-[0_25px_80px_rgba(15,23,42,0.15)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle/60">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-text-muted">уведомления</p>
              <p className="text-base font-semibold text-text-primary">
                {unreadCount > 0 ? `${unreadCount} не прочитано` : 'Всё актуально'}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 disabled:text-text-muted"
              onClick={() => handleMarkAll()}
              disabled={!unreadCount}
            >
              Пометить всё прочитанным
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto px-3 py-2">
            {loading && (
              <div className="flex items-center justify-center py-6 text-text-muted">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-soft border-t-emerald-500" />
              </div>
            )}

            {showEmptyState && (
              <div className="text-center py-6 text-text-secondary text-sm">
                Пока нет новых уведомлений
              </div>
            )}

            {!loading &&
              visibleNotifications.map(item => {
                const accent = severityAccent[item.severity] ?? severityAccent.info;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left rounded-2xl border px-4 py-3 mb-2 last:mb-0 transition-colors ${accent} ${
                      item.read ? 'opacity-80' : 'shadow-brand-card'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg" aria-hidden>
                        {item.icon || categoryIcon[item.category] || '🔔'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary line-clamp-2">
                          {item.title}
                        </p>
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                          {item.body}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-text-muted">
                          <span>{item.category}</span>
                          <span>{formatRelativeTime(item.createdAt)}</span>
                        </div>
                      </div>
                      {!item.read && (
                        <span className="mt-1 inline-flex items-center justify-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-600">
                          новое
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

            {!loading && meta.hasMore && (
              <button
                type="button"
                className="w-full rounded-2xl border border-dashed border-border-soft px-4 py-2 text-sm font-semibold text-emerald-600"
                onClick={() => handleLoadMore()}
              >
                Показать ещё
              </button>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border-subtle/60 px-4 py-3">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary"
              onClick={() => {
                navigate('/services/notifications');
                closeDropdown();
              }}
            >
              Открыть центр
              <span aria-hidden>→</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1 text-xs uppercase tracking-[0.35em] text-text-muted"
              onClick={() => handleMarkAll()}
            >
              <CheckIcon className="w-3 h-3" />
              Всё прочитано
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
