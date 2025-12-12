import { useUnit } from 'effector-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CategoriesList } from '../components/Categories/CategoriesList.tsx';
import { ItemsList } from '../components/Items/ItemsList.tsx';
import Button from '../components/layout/Button/Button.tsx';
import { Tabs } from '../components/layout/Tabs/Tabs.tsx';
import ServiceHeader from '../components/layout/ServiceHeader/ServiceHeader.tsx';
import CartModal from '../components/Modal/CardModal.tsx';
import { CartBlock } from '../components/Items/CardBlock.tsx';
import { OrdersList } from '../components/Orders/OrdersList.tsx';
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
import { isAuthPath, markAuthRedirect } from '../utils/authRedirect';
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
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isGuestPromptVisible, setIsGuestPromptVisible] =
    useState(!currentUser);

  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase() ||
      'U'
    : 'U';

  const handleNavigation = (path: string) => {
    if (isAuthPath(path)) {
      markAuthRedirect('/services/cafeteria');
    }
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Определяем видимые табы для текущего пользователя
  const getVisibleTabs = (user: any) => {
    const allTabs = [
      {
        id: 'menu',
        label: 'Меню',
        roles: ['admin', 'canteenManager', 'cateenManager', 'user', 'guest'],
      },
      {
        id: 'categories',
        label: 'Категории',
        roles: ['admin', 'canteenManager', 'cateenManager'],
      },
      {
        id: 'orders',
        label: 'Заказы',
        roles: [
          'admin',
          'canteenManager',
          'cateenManager',
          'storeManager',
          'user',
        ],
      },
    ];

    if (user && (user.role === 'admin' || user.role === 'user')) {
      allTabs.push({
        id: 'cart',
        label: 'Корзина',
        roles: ['admin', 'user'],
      });
    }

    if (user) {
      allTabs.push({
        id: 'profile',
        label: 'Профиль',
        roles: [
          'admin',
          'canteenManager',
          'cateenManager',
          'storeManager',
          'user',
        ],
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
  const ordersBadge =
    activeOrdersCount > 0 ? String(Math.min(activeOrdersCount, 99)) : undefined;
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartBadge =
    cartItemCount > 0 ? String(Math.min(cartItemCount, 99)) : undefined;

  const visibleTabs = useMemo(() => {
    const tabs = getVisibleTabs(currentUser);
    return tabs.map(tab => ({
      ...tab,
      badge:
        tab.id === 'orders' && ordersBadge
          ? ordersBadge
          : tab.id === 'cart' && cartBadge
            ? cartBadge
            : undefined,
    }));
  }, [currentUser, ordersBadge, cartBadge]);

  const profileTabIndex = visibleTabs.findIndex(tab => tab.id === 'profile');
  const profileTabActive =
    profileTabIndex !== -1 && activeTab === profileTabIndex;
  const mainTabs = visibleTabs.filter(tab => tab.id !== 'profile');
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

  useEffect(() => {
    if (currentUser) {
      setIsGuestPromptVisible(false);
    }
  }, [currentUser]);

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

  const shouldShowGuestPrompt = !currentUser && isGuestPromptVisible;

  return (
    <div className="min-h-screen text-text-primary flex flex-col overflow-x-hidden">
      <ServiceHeader
        subtitle="еда"
        onLogoClick={() => handleNavigation('/')}
        centerSlot={
          <div className="w-full max-w-3xl">
            <Tabs
              tabs={mainTabs}
              activeTab={activeMainTabIndex >= 0 ? activeMainTabIndex : -1}
              onTabChange={handleMainTabChange}
              orientation="horizontal"
              justify="center"
              className="w-full"
              variant="marketplace"
            />
          </div>
        }
        mobileDockSlot={
          <Tabs
            tabs={mainTabs}
            activeTab={activeMainTabIndex >= 0 ? activeMainTabIndex : -1}
            onTabChange={handleMainTabChange}
            orientation="horizontal"
            className="w-full"
            variant="marketplace"
          />
        }
        rightSlot={
          currentUser ? (
            <>
              <button
                type="button"
                onClick={() => setIsTopUpModalOpen(true)}
                className="flex min-w-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2 py-1 text-xs font-semibold text-emerald-700 shadow-inner transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:px-3 sm:py-1.5 sm:text-sm"
                aria-label="Пополнить баллы"
              >
                <span className="max-w-[72px] truncate text-sm font-semibold text-emerald-800 sm:max-w-[120px] sm:text-base">
                  {formatBalance(currentUser.balance)}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-6 sm:w-6">
                  +
                </span>
              </button>
              <NotificationBell />
              {profileTabIndex !== -1 && (
                <button
                  type="button"
                  onClick={() => handleNavigation('/profile')}
                  aria-pressed={profileTabActive}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 sm:h-11 sm:w-11 ${
                    profileTabActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-brand-card'
                      : 'border-border-subtle text-text-secondary hover:text-emerald-600 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-sm font-semibold text-emerald-700 shadow-sm sm:h-10 sm:w-10">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Аватар"
                        className="h-full w-full rounded-full object-cover"
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
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-colors hover:border-emerald-300 hover:text-emerald-600 sm:h-11 sm:w-11"
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
          )
        }
        isFixed
      />

      {/* Основной контент */}
      <div className="flex-1 px-2 sm:px-4 lg:px-6 pt-4 pb-28 sm:pt-6 sm:pb-32 lg:pt-8 lg:pb-12 mt-[88px] sm:mt-[96px] lg:mt-[104px]">
        <div className="h-full">
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
                            Вы можете изучить меню, но оформление заказа
                            доступно только после входа.
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
                            <p className="text-xs uppercase tracking-[0.35em] text-text-muted">
                              активные заказы
                            </p>
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
                              const statusMeta = orderStatusMeta[
                                order.status
                              ] ?? {
                                label: order.status,
                                color: 'text-text-secondary',
                              };
                              const readyTime = formatTime(order.ready_time);
                              const createdTime = formatTime(order.created_at);
                              const methodLabel =
                                deliveryMethodLabels[order.delivery_method] ??
                                'Заказ';
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
                                    <span
                                      className={`text-xs font-semibold ${statusMeta.color}`}
                                    >
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
                                      {order.total_amount.toLocaleString(
                                        'ru-RU'
                                      )}{' '}
                                      баллов
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
                  <div className="lg:hidden text-xs font-semibold uppercase tracking-[0.35em] text-text-secondary bg-white px-3 py-1 rounded-full shadow-sm">
                    {visibleTabs[activeTab].label}
                  </div>
                  <div className="flex-1 overflow-y-auto mt-3 lg:mt-0">
                    <CategoriesList />
                  </div>
                </div>
              )}

              {visibleTabs[activeTab].id === 'orders' && (
                <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-lg p-4 sm:p-6 h-full flex flex-col">
                  <div className="lg:hidden text-xs font-semibold uppercase tracking-[0.35em] text-text-secondary bg-white px-3 py-1 rounded-full shadow-sm">
                    {visibleTabs[activeTab].label}
                  </div>
                  <div className="flex-1 overflow-y-auto mt-3 lg:mt-0">
                    <OrdersList />
                  </div>
                </div>
              )}

              {visibleTabs[activeTab].id === 'cart' && showCart && (
                <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-lg p-0 h-full overflow-hidden">
                  <CartBlock onOrderCreated={handleCartOrderCreated} />
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
        isOpen={isCartModalOpen && visibleTabs[activeTab]?.id !== 'cart'}
        onClose={() => setIsCartModalOpen(false)}
        onOrderCreated={handleCartOrderCreated}
      />

      <TopUpRequestModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
      />
      {shouldShowGuestPrompt && (
        <div className="fixed left-1/2 z-40 w-full max-w-xl -translate-x-1/2 px-4 sm:px-0 top-[6.5rem] sm:top-[7rem]">
          <div className="mx-auto rounded-[24px] border border-emerald-200/80 bg-emerald-50/95 px-4 py-3 text-emerald-900 shadow-[0_25px_60px_rgba(16,185,129,0.25)]">
            <div className="flex items-start gap-3">
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-base font-semibold leading-snug sm:text-lg">
                  Войдите для оформления заказа.
                </h2>
                <p className="mt-1 text-xs text-emerald-800 sm:text-sm">
                  Авторизуйтесь, чтобы добавлять блюда в корзину и завершать
                  покупки.
                </p>
              </div>
              <button
                type="button"
                aria-label="Скрыть подсказку"
                onClick={() => setIsGuestPromptVisible(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-600 transition hover:bg-emerald-100"
              >
                <svg
                  width="14"
                  height="14"
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
          </div>
        </div>
      )}
    </div>
  );
};
