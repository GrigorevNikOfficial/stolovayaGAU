import { useUnit } from 'effector-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CategoriesList } from '../components/Categories/CategoriesList.tsx';
import { ItemsList } from '../components/Items/ItemsList.tsx';
import Button from '../components/layout/Button/Button.tsx';
import { Tabs } from '../components/layout/Tabs/Tabs.tsx';
import CartModal from '../components/Modal/CardModal.tsx';
import { OrdersList } from '../components/Orders/OrdersList.tsx';
import LogoSAU from '../images/logo.jpg';
import { $cart } from '../models/cart';
import {
  $currentUser,
  logout,
  uploadAvatar,
  uploadAvatarFx,
  updateProfile,
  updateProfileFx,
} from '../models/users';
import { $orders, loadOrders } from '../models/orders';
import TopUpRequestModal from '../components/Modal/TopUpRequestModal.tsx';
import ProfileContent from '../components/Profile/ProfileContent.tsx';
import { formatBalance } from '../utils/formatBalance';
import { CartIcon } from '../components/icons/ServiceIcons';
import NotificationBell from '../components/Notifications/NotificationBell.tsx';

// Функция для проверки ролей
const hasRole = (user: any, roles: string | string[]): boolean => {
  if (!user) {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes('guest');
  }

  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return rolesArray.includes(user.role);
};

const orderStatusMeta: Record<string, { label: string; color: string }> = {
  created: { label: 'Принят', color: 'text-amber-500' },
  cooking: { label: 'Готовим', color: 'text-brand-grape' },
  waiting_delivery: { label: 'Ждёт отправки', color: 'text-sky-500' },
  in_transit: { label: 'В пути', color: 'text-pink-500' },
  ready_for_pickup: { label: 'Можно забрать', color: 'text-emerald-500' },
  completed: { label: 'Завершён', color: 'text-text-muted' },
  cancelled: { label: 'Отменён', color: 'text-red-500' },
};

const deliveryMethodLabels: Record<string, string> = {
  dine_in: 'В столовой',
  pickup: 'Самовывоз',
  delivery: 'Доставка',
};

export const HomePage: React.FC = () => {
  const {
    currentUser,
    cart,
    handleLogout,
    handleUploadAvatar,
    handleLoadOrders,
    isAvatarUploading,
    handleUpdateProfile,
    isProfileUpdating,
    orders,
  } = useUnit({
    currentUser: $currentUser,
    cart: $cart,
    handleLogout: logout,
    handleUploadAvatar: uploadAvatar,
    handleLoadOrders: loadOrders,
    isAvatarUploading: uploadAvatarFx.pending,
    handleUpdateProfile: updateProfile,
    isProfileUpdating: updateProfileFx.pending,
    orders: $orders,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
    : 'U';

  const handleNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Определяем видимые табы для текущего пользователя
  const getVisibleTabs = (user: any) => {
    const allTabs = [
      {
        id: 'menu',
        label: 'Меню',
        icon: '🍽️',
        roles: ['admin', 'canteenManager', 'cateenManager', 'user', 'guest'],
      },
      {
        id: 'categories',
        label: 'Категории',
        icon: '📂',
        roles: ['admin', 'canteenManager', 'cateenManager'],
      },
      {
        id: 'orders',
        label: 'Заказы',
        icon: '🧾',
        roles: [
          'admin',
          'canteenManager',
          'cateenManager',
          'storeManager',
          'user',
        ],
      },
    ];

    if (user) {
      allTabs.push({
        id: 'profile',
        label: 'Профиль',
        icon: '👤',
        roles: ['admin', 'canteenManager', 'cateenManager', 'storeManager', 'user'],
      });
    }

    return allTabs.filter(tab => hasRole(user, tab.roles));
  };

  const activeOrders = useMemo(() => {
    if (!currentUser || currentUser.role !== 'user') {
      return [];
    }

    const activeStatuses = new Set([
      'created',
      'cooking',
      'waiting_delivery',
      'ready_for_pickup',
    ]);

    return orders.filter(
      order =>
        order.user_id === currentUser._id && activeStatuses.has(order.status)
    );
  }, [orders, currentUser]);

  const activeOrdersCount = activeOrders.length;
  const ordersBadge = activeOrdersCount > 0 ? String(Math.min(activeOrdersCount, 99)) : undefined;

  const visibleTabs = useMemo(() => {
    const tabs = getVisibleTabs(currentUser);
    return tabs.map(tab => ({
      ...tab,
      badge: tab.id === 'orders' && ordersBadge ? ordersBadge : undefined,
    }));
  }, [currentUser, ordersBadge]);

  const profileTabIndex = visibleTabs.findIndex(tab => tab.id === 'profile');
  const profileTabActive = profileTabIndex !== -1 && activeTab === profileTabIndex;
  const mainTabs = profileTabIndex === -1 ? visibleTabs : visibleTabs.filter(tab => tab.id !== 'profile');
  const activeMainTabIndex = mainTabs.findIndex(
    tab => tab.id === visibleTabs[activeTab]?.id
  );

  const selectTabById = (tabId: string) => {
    const nextIndex = visibleTabs.findIndex(tab => tab.id === tabId);
    if (nextIndex !== -1) {
      setActiveTab(nextIndex);
    }
  };

  const handleMainTabChange = (index: number) => {
    const tabId = mainTabs[index]?.id;
    if (tabId) {
      selectTabById(tabId);
    }
  };

  useEffect(() => {
    if (visibleTabs.length === 0) {
      return;
    }
    if (activeTab >= visibleTabs.length) {
      setActiveTab(Math.max(0, visibleTabs.length - 1));
    }
  }, [activeTab, visibleTabs.length]);

  const handleLogoutClick = () => {
    handleLogout();
    setTimeout(() => {
      handleNavigation('/');
    }, 100);
  };

  // Определяем, нужно ли показывать корзину
  const showCart =
    currentUser &&
    (currentUser.role === 'admin' || currentUser.role === 'user');

  // Закрываем мобильное меню при смене таба
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  const mobileTabs = mainTabs;
  const handleCartOrderCreated = () => {
    selectTabById('orders');
    setIsCartModalOpen(false);
  };
  const handleActiveOrderClick = () => {
    selectTabById('orders');
  };

  const formatTime = (value?: string | null) => {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen text-text-primary flex flex-col overflow-x-hidden">
        {/* Шапка */}
        <header className="fixed top-0 left-0 right-0 z-40 border-b border-border-subtle bg-white/95 shadow-sm backdrop-blur">
        <div className="px-3 sm:px-4 lg:px-6">
          {/* Вся навигация в одной строке */}
          <div className="flex items-center justify-between py-3 sm:py-4 gap-4 min-h-[72px]">
            {/* Левая часть: логотип и название */}
            <button
              type="button"
              onClick={() => handleNavigation('/')}
              className="group flex items-center gap-3 shrink-0 mr-6 rounded-2xl border border-transparent px-1 py-1 text-left transition-all duration-200 hover:border-brand-indigo/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30"
              aria-label="Перейти в навигацию сервисов"
            >
              <img
                src={LogoSAU}
                alt="Логотип столовой ГАУ"
                className="hidden h-12 w-12 rounded-3xl border border-transparent transition-transform duration-200 group-hover:scale-105 sm:block sm:h-14 sm:w-14"
              />
              <div className="leading-tight">
                <h1 className="flex items-center text-2xl font-black uppercase tracking-tight text-text-primary sm:text-[1.85rem] lg:text-[2.1rem]">
                  <span className="tracking-[-0.04em]">STUD</span>
                  <span className="ml-1 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm tracking-[-0.04em]">
                    MI
                  </span>
                </h1>
                <p className="mt-1 text-xs uppercase tracking-[0.35em] text-text-muted">еда</p>
              </div>
            </button>

            {/* Центральная часть: табы */}
            <div className="hidden lg:flex flex-1 justify-center">
              <Tabs
                tabs={mainTabs}
                activeTab={activeMainTabIndex >= 0 ? activeMainTabIndex : -1}
                onTabChange={handleMainTabChange}
                orientation="horizontal"
                justify="center"
                className="max-w-3xl w-full"
                variant="marketplace"
              />
            </div>

            {/* Правая часть: кнопки пользователя */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 shrink-0">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsTopUpModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 text-emerald-700 font-semibold text-sm shadow-inner transition-colors hover:bg-emerald-100"
                    aria-label="Пополнить баллы"
                  >
                    <span className="text-base sm:text-lg">{formatBalance(currentUser.balance)}</span>
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500 text-white text-base leading-none shadow-sm">
                      +
                    </span>
                  </button>
                  <NotificationBell />
                  {profileTabIndex !== -1 && (
                    <button
                      type="button"
                      onClick={() => handleNavigation('/profile')}
                      aria-pressed={profileTabActive}
                      className={`w-11 h-11 rounded-full border transition-all duration-200 flex items-center justify-center ${profileTabActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-brand-card' : 'border-border-subtle text-text-secondary hover:text-emerald-600 hover:border-emerald-300 bg-white'}`}
                    >
                      <span className="w-10 h-10 rounded-full bg-white border border-emerald-200 shadow-sm flex items-center justify-center text-base font-semibold text-emerald-700 overflow-hidden">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Аватар"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          userInitials
                        )}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    aria-label="Выйти из аккаунта"
                    className="w-11 h-11 flex items-center justify-center rounded-full border border-border-subtle text-text-secondary hover:text-emerald-600 hover:border-emerald-300 transition-colors bg-surface-base"
                  >
                    <svg
                      className="w-5 h-5"
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
                </>
              ) : (
                <Button
                  onClick={() => handleNavigation('/login')}
                  variant="primary"
                  size="md"
                  className="px-7 text-base shadow-brand-card hover:-translate-y-0.5"
                >
                  Войти
                </Button>
              )}
            </div>
          </div>
        </div>
        </header>

        {/* Основной контент */}
        <div className="flex-1 px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 mt-[88px] sm:mt-[96px] lg:mt-[104px]">
        <div className="h-full">
          {/* Мобильное меню */}
          <div
            className={`lg:hidden mb-6 transition-all duration-300 ${isMobileMenuOpen ? 'block' : 'hidden'}`}
          >
            <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-lg p-4">
              <Tabs
                tabs={mainTabs}
                activeTab={activeMainTabIndex >= 0 ? activeMainTabIndex : 0}
                onTabChange={handleMainTabChange}
                orientation="vertical"
                className="w-full"
                variant="marketplace"
              />
            </div>
          </div>

          {/* Контент активного таба */}
          {activeTab < visibleTabs.length && (
            <>
              {visibleTabs[activeTab].id === 'menu' && (
                <div className="h-full">
                  <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-lg p-4 sm:p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-brand-indigo">
                        Меню
                      </h2>
                    </div>
                    {!currentUser && (
                      <div className="mb-5 rounded-2xl border border-dashed border-brand-indigo/30 bg-white/80 p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-brand-indigo uppercase tracking-[0.3em]">
                            режим гостя
                          </p>
                          <p className="text-base text-text-secondary">
                            Вы можете изучить меню, но оформление заказа доступно только после входа.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="primary"
                          size="md"
                          className="w-full sm:w-auto"
                          onClick={() => handleNavigation('/login')}
                        >
                          Войти, чтобы заказать
                        </Button>
                      </div>
                    )}
                    {activeOrdersCount > 0 && (
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-text-muted">активные заказы</p>
                            <p className="text-sm text-text-secondary">
                              {activeOrdersCount === 1
                                ? 'Есть заказ в работе'
                                : `${activeOrdersCount} заказов в работе`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleActiveOrderClick}
                            className="text-sm font-semibold text-brand-almond hover:text-brand-indigo transition-colors"
                          >
                            Все заказы →
                          </button>
                        </div>
                        <div className="-mx-1 px-1 overflow-x-auto pb-2">
                          <div className="flex gap-3 min-w-full">
                            {activeOrders.map(order => {
                              const statusMeta = orderStatusMeta[order.status] ?? {
                                label: order.status,
                                color: 'text-text-secondary',
                              };
                              const readyTime = formatTime(order.ready_time);
                              const createdTime = formatTime(order.created_at);
                              const methodLabel = deliveryMethodLabels[order.delivery_method] ?? 'Заказ';
                              return (
                                <button
                                  key={order._id}
                                  type="button"
                                  onClick={handleActiveOrderClick}
                                  className="flex-shrink-0 w-64 rounded-2xl border border-border-subtle bg-surface-elevated px-4 py-3 text-left shadow-md hover:border-brand-almond/60 hover:bg-white transition-colors"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                                      #{order.order_number}
                                    </span>
                                    <span className={`text-xs font-semibold ${statusMeta.color}`}>
                                      {statusMeta.label}
                                    </span>
                                  </div>
                                  <p className="text-sm text-text-primary font-semibold mb-1">
                                    {methodLabel}
                                  </p>
                                  <p className="text-xs text-text-muted mb-3">
                                    {readyTime
                                      ? `Готово к ${readyTime}`
                                      : createdTime
                                      ? `Создан в ${createdTime}`
                                      : 'Обрабатываем заказ'}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-brand-indigo">
                                      {order.total_amount.toLocaleString('ru-RU')} баллов
                                    </span>
                                    <span className="text-xs text-text-muted">
                                      Tap, чтобы открыть
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 overflow-y-auto">
                      <ItemsList />
                    </div>
                  </div>
                </div>
              )}

              {visibleTabs[activeTab].id === 'categories' && (
                <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-lg p-4 sm:p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between ">
                    <div className="lg:hidden flex items-center gap-2 text-sm text-text-secondary bg-white px-3 py-1 rounded-full shadow-sm">
                      <span>{visibleTabs[activeTab].icon}</span>
                      <span>{visibleTabs[activeTab].label}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <CategoriesList />
                  </div>
                </div>
              )}

              {visibleTabs[activeTab].id === 'orders' && (
                <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-lg p-4 sm:p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="lg:hidden flex items-center gap-2 text-sm text-text-secondary bg-white px-3 py-1 rounded-full shadow-sm">
                      <span>{visibleTabs[activeTab].icon}</span>
                      <span>{visibleTabs[activeTab].label}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <OrdersList />
                  </div>
                </div>
              )}


              {visibleTabs[activeTab].id === 'profile' && currentUser && (
                <div className="h-full">
                  <ProfileContent
                    currentUser={currentUser}
                    onUploadAvatar={handleUploadAvatar}
                    onLoadOrders={handleLoadOrders}
                    onUpdateProfile={handleUpdateProfile}
                    isAvatarUploading={isAvatarUploading}
                    isProfileUpdating={isProfileUpdating}
                    layout="embedded"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Кнопка открытия корзины (плавающая) - ТОЛЬКО ДЛЯ ДЕСКТОПА */}
      {showCart && cart.length > 0 && (
        <div className="hidden lg:block fixed bottom-6 right-6 z-30">
          <Button
            onClick={() => setIsCartModalOpen(true)}
            variant="primary"
            size="lg"
            className="shadow-2xl shadow-emerald-200/60 hover:shadow-emerald-300 transition-all duration-300 ease-out hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <CartIcon className="w-5 h-5" />
              Корзина
              <span className="bg-brand-seashell text-brand-indigo text-xs font-semibold px-2 py-1 rounded-full min-w-6">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            </span>
          </Button>
        </div>
      )}

      {/* Модальное окно корзины */}
      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        onOrderCreated={handleCartOrderCreated}
      />

      <TopUpRequestModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
      />

      {/* Мобильная навигация */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 border-t border-border-subtle p-3 z-30 shadow-lg backdrop-blur">
        <div className="flex justify-around items-center">
          {mobileTabs.map(tab => {
            const isActive = visibleTabs[activeTab]?.id === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => selectTabById(tab.id)}
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 min-w-[70px] border ${
                  isActive
                    ? 'text-brand-indigo bg-brand-seashell border-brand-almond shadow-brand-card'
                    : 'border-transparent text-text-secondary hover:text-brand-indigo hover:bg-surface-muted'
                }`}
              >
                {tab.id === 'orders' && ordersBadge && (
                  <span className="absolute -top-1 -right-1 bg-brand-almond text-brand-indigo text-xs font-semibold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                    {ordersBadge}
                  </span>
                )}
                <span className="text-lg mb-1">{tab.icon}</span>
                <span className="text-xs font-medium truncate max-w-[60px]">
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* Кнопка корзины для мобильных */}
          {showCart && (
            <button
              onClick={() => setIsCartModalOpen(true)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 min-w-[70px] border ${
                isCartModalOpen
                  ? 'text-brand-indigo bg-brand-seashell border-brand-almond shadow-brand-card'
                  : 'border-transparent text-text-secondary hover:text-brand-indigo hover:bg-surface-muted'
              }`}
            >
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-almond text-brand-indigo text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
              <span className="mb-1">
                <CartIcon className="w-5 h-5" />
              </span>
              <span className="text-xs font-medium">Корзина</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
