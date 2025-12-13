import React, { useEffect, useState } from 'react';
import Button from '../../components/layout/Button/Button.tsx';
import Input from '../../components/layout/Input/Input.tsx';
import ServiceHeader from '../../components/layout/ServiceHeader/ServiceHeader.tsx';
import { workApi } from '../../api/work';
import type { WorkItem } from '../../types/work';
import { formatBalance } from '../../utils/formatBalance';
import NotificationBell from '../../components/Notifications/NotificationBell.tsx';
import { useUnit } from 'effector-react';
import { $currentUser } from '../../models/users';
import { showToast } from '../../components/layout/Toast/stores/toastStore.ts';

const WorkCard: React.FC<{
  item: WorkItem;
  currentUserId?: string;
  isOwner: boolean;
  canApply: boolean;
  onApply: (id: string, message: string) => void;
  onOpenApplications: (id: string) => void;
  canOpenApplications: boolean;
}> = ({
  item,
  currentUserId,
  isOwner,
  canApply,
  onApply,
  onOpenApplications,
  canOpenApplications,
}) => {
  const [note, setNote] = useState('');
  const myApp = item.applications.find(
    app =>
      app.user &&
      (typeof app.user === 'string'
        ? app.user === currentUserId
        : app.user._id === currentUserId)
  );

  const applications = item.applications || [];
  const hasPending = applications.some(app => app.status === 'pending');

  return (
    <div className="flex h-full flex-col rounded-3xl border border-border-soft bg-white p-3 shadow-brand-card md:p-4">
      <div className="flex flex-col gap-2 md:grid md:grid-cols-[1fr_auto] md:items-start md:gap-3">
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-text-primary md:text-lg">
            {item.title}
          </h3>
          <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed line-clamp-3">
            {item.description}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
            {item.location && (
              <span className="rounded-full bg-surface-muted px-3 py-1">
                📍 {item.location}
              </span>
            )}
            {item.salaryText && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                💰 {item.salaryText}
              </span>
            )}
            <span className="rounded-full bg-surface-muted px-3 py-1">
              Создал:{' '}
              {typeof item.createdBy === 'string'
                ? '—'
                : `${item.createdBy?.first_name ?? ''} ${item.createdBy?.last_name ?? ''}`}
            </span>
            <span className="rounded-full bg-surface-muted px-3 py-1">
              Отклики: {applications.length}
            </span>
            {isOwner && hasPending && (
              <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                Новые отклики
              </span>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center justify-center self-start rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${item.status === 'open' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}
        >
          {item.status === 'open' ? 'Открыта' : 'Закрыта'}
        </span>
      </div>

      <div className="mt-auto space-y-3">
        {myApp && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Ваш отклик:{' '}
            {myApp.status === 'pending'
              ? 'ожидает'
              : myApp.status === 'accepted'
                ? 'принят'
                : 'отклонён'}
          </div>
        )}

        {canApply && item.status === 'open' && !myApp && (
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_auto] sm:items-center">
            <Input
              placeholder="Сообщение для автора"
              value={note}
              onChange={setNote}
              className="flex-1 text-base"
            />
            <Button
              variant="primary"
              onClick={() => onApply(item._id, note)}
              className="w-full sm:w-auto"
            >
              Откликнуться
            </Button>
          </div>
        )}

        {canOpenApplications && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenApplications(item._id)}
            >
              Отклики ({applications.length}) {hasPending ? '•' : ''}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const WorkPage: React.FC = () => {
  const { currentUser } = useUnit({
    currentUser: $currentUser,
  });
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    salaryText: '',
  });

  const isSuperAdmin = currentUser?.role === 'admin';
  const isWorkAdmin = currentUser?.role === 'workAdmin';
  const adminLike = isSuperAdmin || isWorkAdmin;

  const [viewMode, setViewMode] = useState<'all' | 'mine'>(
    adminLike ? 'mine' : 'all'
  );
  const [appsModal, setAppsModal] = useState<{
    open: boolean;
    loading: boolean;
    item?: WorkItem | null;
  }>({ open: false, loading: false, item: null });

  const load = async (nextView = viewMode) => {
    try {
      setLoading(true);
      const params = adminLike ? { view: nextView } : undefined;
      const data = await workApi.list(params);
      setItems(data.items || []);
    } catch (err: any) {
      setError(err?.message || 'Не удалось загрузить вакансии');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, adminLike]);

  const handleApply = async (id: string, message: string) => {
    try {
      await workApi.apply(id, { message });
      showToast({ message: 'Отклик отправлен', type: 'success' });
      await load();
    } catch (err: any) {
      setError(err?.message || 'Не удалось откликнуться');
      showToast({
        message: err?.message || 'Не удалось откликнуться',
        type: 'error',
      });
    }
  };

  const handleRespond = async (
    id: string,
    userId: string,
    action: 'accept' | 'decline'
  ) => {
    if (!userId) return;
    try {
      await workApi.respond(id, userId, action);
      showToast({
        message: action === 'accept' ? 'Отклик принят' : 'Отклик отклонён',
        type: 'success',
      });
      await load();
      if (appsModal.open && appsModal.item?._id === id) {
        await openApplications(id);
      }
    } catch (err: any) {
      setError(err?.message || 'Не удалось обновить отклик');
      showToast({
        message: err?.message || 'Не удалось обновить отклик',
        type: 'error',
      });
    }
  };

  const handleCloseApplications = () =>
    setAppsModal({ open: false, loading: false, item: null });

  const openApplications = async (id: string) => {
    setAppsModal({ open: true, loading: true, item: null });
    try {
      const { item } = await workApi.detail(id);
      setAppsModal({ open: true, loading: false, item });
    } catch (err: any) {
      setAppsModal({ open: false, loading: false, item: null });
      showToast({
        message: err?.message || 'Не удалось загрузить отклики',
        type: 'error',
      });
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setCreating(true);
    try {
      await workApi.create(form);
      setForm({ title: '', description: '', location: '', salaryText: '' });
      showToast({ message: 'Вакансия опубликована', type: 'success' });
      await load();
    } catch (err: any) {
      setError(err?.message || 'Не удалось создать вакансию');
      showToast({
        message: err?.message || 'Не удалось создать вакансию',
        type: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const balanceLabel = currentUser ? formatBalance(currentUser.balance) : '';

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <ServiceHeader
        subtitle="работа"
        onLogoClick={() => {
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
        rightSlot={
          currentUser ? (
            <>
              <button
                type="button"
                className="flex min-w-0 items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-inner"
              >
                <span className="max-w-[90px] truncate" title={balanceLabel}>
                  {balanceLabel}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  +
                </span>
              </button>
              <NotificationBell />
            </>
          ) : null
        }
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-4 sm:py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-brand-indigo">
            Работа в университете
          </h1>
          <p className="text-sm text-text-secondary">
            Подработки внутри вуза. Админ может создавать карточки, студенты —
            откликаться.
          </p>
        </div>

        {adminLike && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={viewMode === 'mine' ? 'primary' : 'outline'}
              onClick={() => setViewMode('mine')}
            >
              Мои карточки
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'all' ? 'primary' : 'outline'}
              onClick={() => setViewMode('all')}
            >
              Весь список
            </Button>
          </div>
        )}

        {(currentUser?.role === 'admin' ||
          currentUser?.role === 'workAdmin') && (
          <div className="rounded-3xl border border-border-soft bg-white p-4 shadow-brand-card space-y-3">
            <p className="text-sm font-semibold text-text-primary">
              Создать вакансию
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Название"
                value={form.title}
                onChange={value => setForm(prev => ({ ...prev, title: value }))}
              />
              <Input
                placeholder="Локация (опционально)"
                value={form.location}
                onChange={value =>
                  setForm(prev => ({ ...prev, location: value }))
                }
              />
              <Input
                placeholder="Оплата (опционально)"
                value={form.salaryText}
                onChange={value =>
                  setForm(prev => ({ ...prev, salaryText: value }))
                }
              />
            </div>
            <Input
              placeholder="Описание"
              value={form.description}
              onChange={value =>
                setForm(prev => ({ ...prev, description: value }))
              }
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'Создаём...' : 'Опубликовать'}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-text-secondary">Загружаем...</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.length === 0 ? (
              <p className="text-sm text-text-secondary">Пока нет вакансий.</p>
            ) : (
              items.map(item =>
                (() => {
                  const owner =
                    currentUser?._id ===
                    (typeof item.createdBy === 'string'
                      ? item.createdBy
                      : item.createdBy?._id);
                  const canApply = !adminLike && !owner;
                  const canOpenApps = owner || isSuperAdmin;
                  return (
                    <WorkCard
                      key={item._id}
                      item={item}
                      currentUserId={currentUser?._id}
                      isOwner={owner}
                      canApply={canApply}
                      onApply={handleApply}
                      onOpenApplications={openApplications}
                      canOpenApplications={canOpenApps}
                    />
                  );
                })()
              )
            )}
          </div>
        )}
      </main>

      {appsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-border-soft">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-text-muted">
                  Отклики
                </p>
                <h3 className="text-lg font-semibold text-text-primary">
                  {appsModal.item?.title || 'Загрузка...'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseApplications}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-text-secondary hover:text-text-primary"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5 space-y-3">
              {appsModal.loading && (
                <p className="text-sm text-text-secondary">
                  Загружаем отклики...
                </p>
              )}

              {!appsModal.loading &&
                (appsModal.item?.applications?.length ?? 0) === 0 && (
                  <p className="text-sm text-text-secondary">
                    Пока нет откликов.
                  </p>
                )}

              {!appsModal.loading &&
                appsModal.item?.applications?.map(app => {
                  const user = app.user;
                  const userId =
                    typeof user === 'string' ? user : user?._id || '';
                  const name =
                    typeof user === 'string'
                      ? 'Неизвестно'
                      : `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() ||
                        'Неизвестно';
                  const canModerate =
                    isSuperAdmin ||
                    (appsModal.item &&
                      (typeof appsModal.item.createdBy === 'string'
                        ? appsModal.item.createdBy === currentUser?._id
                        : appsModal.item.createdBy?._id === currentUser?._id));
                  return (
                    <div
                      key={userId + app.status + (app.message || '')}
                      className="rounded-2xl border border-border-subtle bg-surface-muted/60 p-3"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-sm font-semibold text-text-primary truncate"
                            title={name}
                          >
                            {name}
                          </p>
                          {app.message && (
                            <p className="text-xs text-text-secondary whitespace-pre-line">
                              {app.message}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-2 sm:pt-0">
                          <span className="text-xs uppercase tracking-[0.25em] text-text-secondary">
                            {app.status}
                          </span>
                          {app.status === 'pending' && canModerate && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() =>
                                  handleRespond(
                                    appsModal.item?._id || '',
                                    userId,
                                    'accept'
                                  )
                                }
                              >
                                Принять
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleRespond(
                                    appsModal.item?._id || '',
                                    userId,
                                    'decline'
                                  )
                                }
                              >
                                Отклонить
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkPage;
