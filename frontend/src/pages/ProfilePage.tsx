import React from 'react';
import { useUnit } from 'effector-react';
import { marketplaceApi } from '../api/services';
import { serviceRequestsApi } from '../api/service-requests';
import { $currentUser, uploadAvatar, uploadAvatarFx, logout, updateProfile, updateProfileFx } from '../models/users';
import { loadOrders } from '../models/orders';
import Button from '../components/layout/Button/Button.tsx';
import ServiceHeader from '../components/layout/ServiceHeader/ServiceHeader.tsx';
import { Tabs } from '../components/layout/Tabs/Tabs';
import NotificationBell from '../components/Notifications/NotificationBell.tsx';
import NotificationSettings from '../components/Profile/NotificationSettings.tsx';
import ProfileContent from '../components/Profile/ProfileContent.tsx';
import Achievements from '../components/Profile/Achievements';
import TopUpRequestModal from '../components/Modal/TopUpRequestModal';
import { formatBalance } from '../utils/formatBalance';
import type { ProfileStats } from '../components/Profile/profileStats';
import { defaultProfileStats } from '../components/Profile/profileStats';
import { countUnlockedAchievements } from '../components/Profile/achievementsData';

type ProfileTabId = 'data' | 'stats' | 'notifications' | 'achievements';

const PROFILE_TABS: Array<{
  id: ProfileTabId;
  label: string;
  description: string;
  disabled?: boolean;
}> = [
  {
    id: 'data',
    label: 'Данные',
    description: 'Персональная информация и доступ',
  },
  {
    id: 'stats',
    label: 'Статистика',
    description: 'Активность в маркетплейсе',
  },
  {
    id: 'notifications',
    label: 'Уведомления',
    description: 'Колокольчик и каналы доставки',
  },
  {
    id: 'achievements',
    label: 'Достижения',
    description: 'Бейджи активности',
  },
];


type ProfilePageProps = {
  initialTab?: ProfileTabId;
};

const isValidProfileTab = (candidate: string | null): candidate is ProfileTabId =>
  Boolean(candidate && PROFILE_TABS.some(tab => tab.id === candidate && !tab.disabled));

const getTabFromLocation = (): ProfileTabId | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('tab');
  return isValidProfileTab(requested) ? requested : null;
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ initialTab }) => {
  const {
    currentUser,
    handleLoadOrders,
    handleUploadAvatar,
    handleLogout,
    isAvatarUploading,
    handleUpdateProfile,
    isProfileUpdating,
  } = useUnit({
    currentUser: $currentUser,
    handleLoadOrders: loadOrders,
    handleUploadAvatar: uploadAvatar,
    handleLogout: logout,
    isAvatarUploading: uploadAvatarFx.pending,
    handleUpdateProfile: updateProfile,
    isProfileUpdating: updateProfileFx.pending,
  });

  const [activeTab, setActiveTab] = React.useState<ProfileTabId>(() => {
    const fromUrl = getTabFromLocation();
    if (fromUrl) {
      return fromUrl;
    }
    if (initialTab && isValidProfileTab(initialTab)) {
      return initialTab;
    }
    return 'data';
  });
  const [stats, setStats] = React.useState<ProfileStats>(defaultProfileStats);
  const [isStatsLoading, setIsStatsLoading] = React.useState(false);
  const [statsError, setStatsError] = React.useState<string | null>(null);
  const [hasLoadedStats, setHasLoadedStats] = React.useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = React.useState(false);
  const updateTabInUrl = React.useCallback((tabId: ProfileTabId) => {
    if (typeof window === 'undefined') {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.replaceState({}, '', url.toString());
  }, []);

  const syncTabFromUrl = React.useCallback(() => {
    const nextTab = getTabFromLocation();
    if (nextTab) {
      setActiveTab(nextTab);
    }
  }, []);

  React.useEffect(() => {
    syncTabFromUrl();
    if (typeof window === 'undefined') {
      return undefined;
    }
    window.addEventListener('popstate', syncTabFromUrl);
    return () => {
      window.removeEventListener('popstate', syncTabFromUrl);
    };
  }, [syncTabFromUrl]);

  React.useEffect(() => {
    updateTabInUrl(activeTab);
  }, [activeTab, updateTabInUrl]);

  const headerTabs = React.useMemo(
    () =>
      PROFILE_TABS.map(tab => ({
        id: tab.id,
        label: tab.label,
        roles: ['user'],
      })),
    []
  );
  const mobileTabs = React.useMemo(() => PROFILE_TABS, []);

  const activeTabIndex = React.useMemo(() => {
    const index = PROFILE_TABS.findIndex(tab => tab.id === activeTab);
    return index >= 0 ? index : 0;
  }, [activeTab]);

  const handleNavigation = React.useCallback((path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const handleLogoutClick = React.useCallback(() => {
    handleLogout();
    setTimeout(() => {
      handleNavigation('/');
    }, 120);
  }, [handleLogout, handleNavigation]);

  const loadStats = React.useCallback(async () => {
    if (!currentUser) {
      return;
    }

    setIsStatsLoading(true);
    setStatsError(null);

    try {
      const [customerRequests, providerRequests, myServices] = await Promise.all([
        serviceRequestsApi.getRequests({ scope: 'customer' }),
        serviceRequestsApi.getRequests({ scope: 'provider' }),
        marketplaceApi.getMyServices(),
      ]);

      const activeStatuses = new Set(['pending', 'accepted', 'in_progress']);
      const combinedRequests = [
        ...customerRequests.data,
        ...providerRequests.data,
      ];

      const nextStats: ProfileStats = {
        requestsAsCustomer: customerRequests.data.length,
        requestsAsProvider: providerRequests.data.length,
        activeRequests: combinedRequests.filter(request => activeStatuses.has(request.status)).length,
        completedRequests: combinedRequests.filter(request => request.status === 'completed').length,
        servicesPublished: myServices.length,
        lastServiceUpdatedAt:
          myServices.length > 0
            ? myServices
                .map(service => service.updatedAt)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
            : null,
      };

      setStats(nextStats);
      setHasLoadedStats(true);
    } catch (error: any) {
      setStatsError(error?.message || 'Не удалось загрузить статистику');
    } finally {
      setIsStatsLoading(false);
    }
  }, [currentUser?._id]);

  React.useEffect(() => {
    const needsStats = activeTab === 'stats' || activeTab === 'achievements';
    if (needsStats && currentUser && !hasLoadedStats && !isStatsLoading) {
      void loadStats();
    }
  }, [activeTab, currentUser, hasLoadedStats, isStatsLoading, loadStats]);

  const handleHeaderTabChange = React.useCallback(
    (index: number) => {
      const tab = PROFILE_TABS[index];
      if (tab) {
        setActiveTab(tab.id);
      }
    },
    [setActiveTab]
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-primary px-4">
        <div className="text-center space-y-4 max-w-md bg-white/90 border border-border-soft rounded-3xl p-8 shadow-brand-card">
          <p className="text-xs uppercase tracking-[0.35em] text-text-muted">доступ ограничен</p>
          <h2 className="text-2xl font-bold">Пользователь не авторизован</h2>
          <p className="text-text-secondary text-sm">Чтобы увидеть персональные данные и историю заказов, войдите в личный кабинет.</p>
          <Button onClick={() => handleNavigation('/')} variant="primary" size="md">
            На главную
          </Button>
        </div>
      </div>
    );
  }

  const avatarUrl = currentUser.avatar?.url;
  const userInitials = `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`
    .toUpperCase()
    .trim() || 'U';
  const totalRequests = stats.requestsAsCustomer + stats.requestsAsProvider;
  const unlockedAchievements = countUnlockedAchievements(stats);
  const balanceLabel = formatBalance(currentUser.balance);

  const renderStatsTab = () => (
    <div className="space-y-6">
      {statsError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {statsError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-border-soft bg-white px-5 py-6 shadow-brand-card lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.35em] text-text-muted">заявки в маркетплейсе</p>
          <p className="mt-2 text-4xl font-bold text-brand-indigo">{totalRequests}</p>
          <p className="mt-2 text-sm text-text-secondary">
            {stats.requestsAsCustomer} как заказчик · {stats.requestsAsProvider} как исполнитель
          </p>
        </div>

        <div className="rounded-3xl border border-border-soft bg-white px-5 py-6 shadow-brand-card">
          <p className="text-xs uppercase tracking-[0.35em] text-text-muted">активные</p>
          <p className="mt-2 text-3xl font-semibold text-brand-indigo">{stats.activeRequests}</p>
          <p className="mt-1 text-sm text-text-secondary">Заявки в работе или ожидании</p>
        </div>

        <div className="rounded-3xl border border-border-soft bg-white px-5 py-6 shadow-brand-card">
          <p className="text-xs uppercase tracking-[0.35em] text-text-muted">завершено</p>
          <p className="mt-2 text-3xl font-semibold text-brand-indigo">{stats.completedRequests}</p>
          <p className="mt-1 text-sm text-text-secondary">Сделки закрыты обеими сторонами</p>
        </div>

        <div className="rounded-3xl border border-border-soft bg-white px-5 py-6 shadow-brand-card">
          <p className="text-xs uppercase tracking-[0.35em] text-text-muted">услуги опубликованы</p>
          <p className="mt-2 text-3xl font-semibold text-brand-indigo">{stats.servicesPublished}</p>
          <p className="mt-1 text-sm text-text-secondary">Объявления видны коллегам</p>
        </div>

        <div className="rounded-3xl border border-border-soft bg-white px-5 py-6 shadow-brand-card">
          <p className="text-xs uppercase tracking-[0.35em] text-text-muted">последнее обновление</p>
          <p className="mt-2 text-xl font-semibold text-brand-indigo">
            {stats.lastServiceUpdatedAt
              ? new Date(stats.lastServiceUpdatedAt).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'нет публикаций'}
          </p>
          <p className="mt-1 text-sm text-text-secondary">Когда вы редактировали услугу</p>
        </div>

        <div className="rounded-3xl border border-border-soft bg-white px-5 py-6 shadow-brand-card">
          <p className="text-xs uppercase tracking-[0.35em] text-text-muted">получено достижений</p>
          <p className="mt-2 text-3xl font-semibold text-brand-indigo">{unlockedAchievements}</p>
          <p className="mt-1 text-sm text-text-secondary">Бейджи профиля за активность</p>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-border-soft bg-surface-muted/60 px-5 py-4 text-sm text-text-secondary text-center">
        Статистика обновляется автоматически после действий в маркетплейсе и управлении услугами. Чем активнее вы публикуете и закрываете заявки, тем богаче карточки.
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-text-primary flex flex-col bg-[radial-gradient(circle_at_top,_rgba(76,99,255,0.08),_transparent_55%)]">
      <ServiceHeader
        subtitle="профиль"
        onLogoClick={() => handleNavigation('/')}
        centerSlot={(
          <div className="w-full max-w-3xl">
            <Tabs
              tabs={headerTabs}
              activeTab={activeTabIndex}
              onTabChange={handleHeaderTabChange}
              className="max-w-2xl w-full"
              wrap={false}
              variant="marketplace"
            />
          </div>
        )}
        mobileDockSlot={(
          <Tabs
            tabs={headerTabs}
            activeTab={activeTabIndex}
            onTabChange={handleHeaderTabChange}
            orientation="horizontal"
            className="w-full"
            variant="marketplace"
            wrap
          />
        )}
        rightSlot={(
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
            <button
              type="button"
              onClick={() => setIsTopUpModalOpen(true)}
              className="flex min-w-0 items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-inner transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
            >
              <span className="max-w-[90px] truncate text-sm font-semibold text-emerald-800 sm:max-w-[140px] sm:text-base" title={balanceLabel}>
                {balanceLabel}
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-6 sm:w-6">+</span>
            </button>
            <NotificationBell />
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-brand-indigo text-base font-semibold text-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Аватар" className="h-full w-full rounded-full object-cover" />
                ) : (
                  userInitials
                )}
              </span>
            </div>
          </div>
        )}
      />

      <main className="flex-1 pb-28 pt-6 px-3 sm:px-6 sm:pb-32 lg:pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-border-soft bg-white shadow-brand-card overflow-hidden">
            <div className="p-4 sm:p-8">
              {activeTab === 'data' && (
                <ProfileContent
                  currentUser={currentUser}
                  onUploadAvatar={handleUploadAvatar}
                  onLoadOrders={handleLoadOrders}
                  onUpdateProfile={handleUpdateProfile}
                  isAvatarUploading={isAvatarUploading}
                  isProfileUpdating={isProfileUpdating}
                  layout="embedded"
                />
              )}

              {activeTab === 'stats' && (
                <div className="space-y-6">
                  {isStatsLoading && !hasLoadedStats ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface-muted px-4 py-3 text-sm text-text-secondary">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-indigo/30 border-t-brand-indigo" />
                      Считаем вашу статистику...
                    </div>
                  ) : (
                    renderStatsTab()
                  )}
                </div>
              )}

              {activeTab === 'notifications' && <NotificationSettings />}

              {activeTab === 'achievements' && <Achievements stats={stats} />}
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleLogoutClick}
              className="gap-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300"
            >
              Выйти из аккаунта
              <svg
                className="h-4 w-4"
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
            </Button>
          </div>
        </div>
      </main>
      <TopUpRequestModal isOpen={isTopUpModalOpen} onClose={() => setIsTopUpModalOpen(false)} />

      {mobileTabs.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border-subtle bg-white/95 p-3 shadow-lg backdrop-blur z-40">
          <div className="flex justify-around items-center">
            {mobileTabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-2 text-center text-xs font-medium transition-all duration-300 min-w-[80px] ${
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
    </div>
  );
};
