import React from 'react';
import { useUnit } from 'effector-react';
import { marketplaceApi } from '../api/services';
import { serviceRequestsApi } from '../api/service-requests';
import { $currentUser, uploadAvatar, uploadAvatarFx, logout } from '../models/users';
import { loadOrders } from '../models/orders';
import Button from '../components/layout/Button/Button.tsx';
import Footer from '../components/layout/Footer/Footer.tsx';
import { Tabs } from '../components/layout/Tabs/Tabs';
import { BellIcon } from '../components/icons/ServiceIcons';
import ProfileContent from '../components/Profile/ProfileContent.tsx';
import TopUpRequestModal from '../components/Modal/TopUpRequestModal';
import LogoSAU from '../images/logo.jpg';
import { formatBalance } from '../utils/formatBalance';

type ProfileTabId = 'data' | 'stats' | 'achievements';

const PROFILE_TABS: Array<{
  id: ProfileTabId;
  label: string;
  description: string;
  icon: string;
  disabled?: boolean;
}> = [
  {
    id: 'data',
    label: 'Данные',
    description: 'Персональная информация и доступ',
    icon: '📋',
  },
  {
    id: 'stats',
    label: 'Статистика',
    description: 'Активность в маркетплейсе',
    icon: '📊',
  },
  {
    id: 'achievements',
    label: 'Достижения в разработке',
    description: 'Скоро появятся награды',
    icon: '⭐',
    disabled: true,
  },
];

type ProfileStats = {
  requestsAsCustomer: number;
  requestsAsProvider: number;
  activeRequests: number;
  completedRequests: number;
  servicesPublished: number;
  lastServiceUpdatedAt: string | null;
};

const defaultStats: ProfileStats = {
  requestsAsCustomer: 0,
  requestsAsProvider: 0,
  activeRequests: 0,
  completedRequests: 0,
  servicesPublished: 0,
  lastServiceUpdatedAt: null,
};

export const ProfilePage: React.FC = () => {
  const {
    currentUser,
    handleLoadOrders,
    handleUploadAvatar,
    handleLogout,
    isAvatarUploading,
  } = useUnit({
    currentUser: $currentUser,
    handleLoadOrders: loadOrders,
    handleUploadAvatar: uploadAvatar,
    handleLogout: logout,
    isAvatarUploading: uploadAvatarFx.pending,
  });

  const [activeTab, setActiveTab] = React.useState<ProfileTabId>('data');
  const [stats, setStats] = React.useState<ProfileStats>(defaultStats);
  const [isStatsLoading, setIsStatsLoading] = React.useState(false);
  const [statsError, setStatsError] = React.useState<string | null>(null);
  const [hasLoadedStats, setHasLoadedStats] = React.useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = React.useState(false);

  const NotificationBell = () => (
    <button
      type="button"
      aria-label="Уведомления"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-colors hover:border-emerald-300 hover:text-emerald-600"
    >
      <BellIcon className="h-5 w-5" />
    </button>
  );

  const headerTabs = React.useMemo(
    () =>
      PROFILE_TABS.map(tab => ({
        id: tab.id,
        label: tab.label,
        icon: tab.icon,
        roles: ['user'],
        disabled: tab.disabled,
      })),
    []
  );

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
    if (activeTab === 'stats' && currentUser && !hasLoadedStats && !isStatsLoading) {
      void loadStats();
    }
  }, [activeTab, currentUser, hasLoadedStats, isStatsLoading, loadStats]);

  const handleHeaderTabChange = React.useCallback(
    (index: number) => {
      const tab = PROFILE_TABS[index];
      if (tab && !tab.disabled) {
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

  const renderStatsTab = () => (
    <div className="space-y-6">
      {statsError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {statsError}
        </div>
      )}

      <div className="rounded-[32px] border border-border-soft bg-white px-6 py-8 text-center shadow-brand-card">
        <p className="text-xs uppercase tracking-[0.4em] text-text-muted">заявки в маркетплейсе</p>
        <p className="mt-3 text-5xl font-semibold text-brand-indigo">{totalRequests}</p>
        <p className="mt-2 text-sm text-text-secondary">
          {stats.requestsAsCustomer} как заказчик · {stats.requestsAsProvider} как исполнитель
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-border-soft bg-surface-muted/60 px-5 py-4 text-sm text-text-secondary text-center">
        Статистика обновляется автоматически после действий в маркетплейсе. Чем активнее вы оставляете заявки, тем выше счётчик.
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-text-primary flex flex-col bg-[radial-gradient(circle_at_top,_rgba(76,99,255,0.08),_transparent_55%)]">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-white/95 shadow-sm backdrop-blur">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex flex-wrap items-center gap-4 py-3 sm:py-4 lg:flex-nowrap lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigation('/')}
                className="group flex items-center gap-3 rounded-2xl border border-transparent px-1 py-1 text-left transition-all duration-200 hover:border-brand-indigo/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30"
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
                  <p className="mt-1 text-xs uppercase tracking-[0.35em] text-text-muted">профиль</p>
                </div>
              </button>
            </div>

            <div className="hidden flex-1 justify-center lg:flex">
              <Tabs tabs={headerTabs} activeTab={activeTabIndex} onTabChange={handleHeaderTabChange} justify="center" className="max-w-xl" />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsTopUpModalOpen(true)}
                className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-inner transition-colors hover:bg-emerald-100"
              >
                <span className="text-base sm:text-lg">{formatBalance(currentUser.balance)}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">+</span>
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
              <button
                type="button"
                onClick={handleLogoutClick}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-colors hover:border-brand-indigo/40 hover:text-brand-indigo"
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

          <div className="pb-3 lg:hidden">
            <Tabs tabs={headerTabs} activeTab={activeTabIndex} onTabChange={handleHeaderTabChange} className="w-full" />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-10 pt-6 px-3 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-border-soft bg-white shadow-brand-card overflow-hidden">
            <div className="p-4 sm:p-8">
              {activeTab === 'data' && (
                <ProfileContent
                  currentUser={currentUser}
                  onUploadAvatar={handleUploadAvatar}
                  onLoadOrders={handleLoadOrders}
                  isAvatarUploading={isAvatarUploading}
                  layout="embedded"
                  showHeader={false}
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

              {activeTab === 'achievements' && (
                <div className="rounded-3xl border border-dashed border-border-soft bg-surface-muted px-5 py-8 text-center text-text-secondary">
                  Раздел «Достижения в разработке» сейчас в разработке. Мы добавим бейджи и уровни за активность чуть позже.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <TopUpRequestModal isOpen={isTopUpModalOpen} onClose={() => setIsTopUpModalOpen(false)} />
    </div>
  );
};
