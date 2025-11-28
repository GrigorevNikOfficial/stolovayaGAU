import { useUnit } from 'effector-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CategoriesList } from '../components/Categories/CategoriesList.tsx';
import { ItemsList } from '../components/Items/ItemsList.tsx';
import Button from '../components/layout/Button/Button.tsx';
import Footer from '../components/layout/Footer/Footer.tsx';
import { Tabs } from '../components/layout/Tabs/Tabs.tsx';
import CartModal from '../components/Modal/CardModal.tsx';
import { OrdersList } from '../components/Orders/OrdersList.tsx';
import { Settings } from '../components/Settings/Settings.tsx';
import LogoSAU from '../images/LogoSAU.svg';
import { $cart } from '../models/cart';
import {
  $currentUser,
  logout,
  uploadAvatar,
  uploadAvatarFx,
} from '../models/users';
import { $orders, loadOrders } from '../models/orders';
import TopUpRequestModal from '../components/Modal/TopUpRequestModal.tsx';
import ProfileContent from '../components/Profile/ProfileContent.tsx';

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
  created: { label: 'Принят', color: 'text-[#fcd34d]' },
  cooking: { label: 'Готовим', color: 'text-[#69e7b6]' },
  waiting_delivery: { label: 'Ждёт отправки', color: 'text-[#93c5fd]' },
  in_transit: { label: 'В пути', color: 'text-[#f472b6]' },
  ready_for_pickup: { label: 'Можно забрать', color: 'text-[#34d399]' },
  completed: { label: 'Завершён', color: 'text-gray-400' },
  cancelled: { label: 'Отменён', color: 'text-red-400' },
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
    orders,
  } = useUnit({
    currentUser: $currentUser,
    cart: $cart,
    handleLogout: logout,
    handleUploadAvatar: uploadAvatar,
    handleLoadOrders: loadOrders,
    isAvatarUploading: uploadAvatarFx.pending,
    orders: $orders,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase() ||
      'U'
    : '';

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
        icon: '🛍️',
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
        icon: '📦',
        roles: [
          'admin',
          'canteenManager',
          'cateenManager',
          'storeManager',
          'user',
        ],
      },
      { id: 'settings', label: 'Настройки', icon: '⚙️', roles: ['admin'] },
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
      'in_transit',
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
    return tabs.map(tab =>
      tab.id === 'orders' && ordersBadge
        ? { ...tab, badge: ordersBadge }
        : tab
    );
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

  const handleProfileTabOpen = () => {
    if (profileTabIndex !== -1) {
      selectTabById('profile');
      setIsMobileMenuOpen(false);
    } else {
      handleNavigation('/profile');
    }
  };

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
    <div className="min-h-screen bg-[#161718] text-gray-100 flex flex-col overflow-x-hidden">
      {/* Шапка */}
      <header className="bg-[#1c1d1f] border-b border-[#455252] shadow-sm sticky top-0 z-40">
        <div className="px-3 sm:px-4 lg:px-6">
          {/* Вся навигация в одной строке */}
          <div className="flex items-center justify-between py-3 sm:py-4 gap-4">
            {/* Левая часть: логотип и название */}
            <div className="flex items-center gap-3 shrink-0 mr-6">
              <img
                src={LogoSAU}
                alt="Логотип столовой ГАУ"
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-100 whitespace-nowrap">
                  Столовая ГАУ
                </h1>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-orange-100 text-orange-700 border border-orange-200">
                  тестовая версия
                </span>
              </div>
            </div>

            {/* Центральная часть: табы */}
            <div className="hidden lg:flex flex-1 justify-center">
              <Tabs
                tabs={mainTabs}
                activeTab={activeMainTabIndex >= 0 ? activeMainTabIndex : -1}
                onTabChange={handleMainTabChange}
                orientation="horizontal"
                justify="center"
                className="max-w-3xl w-full"
              />
            </div>

            {/* Правая часть: кнопки пользователя */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 shrink-0">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsTopUpModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#106157]/70 bg-[#106157]/20 text-white font-semibold text-sm shadow-inner hover:bg-[#106157]/40 transition-colors"
                    aria-label="Пополнить баланс"
                  >
                    <span className="text-base sm:text-lg">
                      {(currentUser.balance ?? 0).toLocaleString('ru-RU')} ₽
                    </span>
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#106157] text-white text-base leading-none">
                      +
                    </span>
                  </button>
                  {profileTabIndex !== -1 && (
                    <button
                      type="button"
                      onClick={handleProfileTabOpen}
                      aria-pressed={profileTabActive}
                      className={`w-11 h-11 rounded-full border transition-all duration-200 flex items-center justify-center ${profileTabActive ? 'bg-[#106157] text-white border-[#106157] shadow-sm' : 'border-[#455252] text-gray-200 hover:text-white hover:border-[#106157]/60 bg-[#2d2d2c]'}`}
                    >
                      <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#106157] to-[#0d4a43] border border-white/20 shadow flex items-center justify-center text-base font-semibold text-white overflow-hidden">
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
                    className="w-11 h-11 flex items-center justify-center rounded-full border border-[#455252] text-gray-200 hover:text-red-400 hover:border-red-400 transition-colors bg-[#2d2d2c]/60"
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
                >
                  Войти
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="flex-1 px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="h-full">
          {/* Мобильное меню */}
          <div
            className={`lg:hidden mb-6 transition-all duration-300 ${isMobileMenuOpen ? 'block' : 'hidden'}`}
          >
            <div className="bg-[#2d2d2c] border border-[#455252] rounded-2xl shadow-lg p-4 text-gray-100">
              <Tabs
                tabs={mainTabs}
                activeTab={activeMainTabIndex >= 0 ? activeMainTabIndex : 0}
                onTabChange={handleMainTabChange}
                orientation="vertical"
                className="w-full"
              />
            </div>
          </div>

          {/* Контент активного таба */}
          {activeTab < visibleTabs.length && (
            <>
              {visibleTabs[activeTab].id === 'menu' && (
                <div className="h-full">
                  <div className="bg-[#2d2d2c] border border-[#455252] rounded-2xl shadow-lg p-4 sm:p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-100">
                        Меню
                      </h2>
                    </div>
                    {activeOrdersCount > 0 && (
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm text-gray-400">Активные заказы</p>
                            <p className="text-base font-semibold text-gray-100">
                              {activeOrdersCount === 1
                                ? 'Есть заказ в работе'
                                : `${activeOrdersCount} заказов в работе`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleActiveOrderClick}
                            className="text-sm font-semibold text-[#69e7b6] hover:text-white transition-colors"
                          >
                            Все заказы →
                          </button>
                        </div>
                        <div className="-mx-1 px-1 overflow-x-auto pb-2">
                          <div className="flex gap-3 min-w-full">
                            {activeOrders.map(order => {
                              const statusMeta = orderStatusMeta[order.status] ?? {
                                label: order.status,
                                color: 'text-gray-300',
                              };
                              const readyTime = formatTime(order.ready_time);
                              const createdTime = formatTime(order.created_at);
                              const methodLabel = deliveryMethodLabels[order.delivery_method] ?? 'Заказ';
                              return (
                                <button
                                  key={order._id}
                                  type="button"
                                  onClick={handleActiveOrderClick}
                                  className="flex-shrink-0 w-64 rounded-2xl border border-[#3a3b3c] bg-[#1f2021] px-4 py-3 text-left shadow-md hover:border-[#69e7b6]/60 hover:bg-[#252627] transition-colors"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                      #{order.order_number}
                                    </span>
                                    <span className={`text-xs font-semibold ${statusMeta.color}`}>
                                      {statusMeta.label}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-200 font-semibold mb-1">
                                    {methodLabel}
                                  </p>
                                  <p className="text-xs text-gray-400 mb-3">
                                    {readyTime
                                      ? `Готово к ${readyTime}`
                                      : createdTime
                                      ? `Создан в ${createdTime}`
                                      : 'Обрабатываем заказ'}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-white">
                                      {order.total_amount.toLocaleString('ru-RU')} ₽
                                    </span>
                                    <span className="text-xs text-gray-400">
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
                <div className="bg-[#2d2d2c] border border-[#455252] rounded-2xl shadow-lg p-4 sm:p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between ">
                    <div className="lg:hidden flex items-center gap-2 text-sm text-gray-200 bg-[#161718] px-3 py-1 rounded-full">
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
                <div className="bg-[#2d2d2c] border border-[#455252] rounded-2xl shadow-lg p-4 sm:p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between ">
                    <div className="lg:hidden flex items-center gap-2 text-sm text-gray-200 bg-[#161718] px-3 py-1 rounded-full">
                      <span>{visibleTabs[activeTab].icon}</span>
                      <span>{visibleTabs[activeTab].label}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <OrdersList />
                  </div>
                </div>
              )}

              {visibleTabs[activeTab].id === 'settings' && (
                <div className="bg-[#2d2d2c] border border-[#455252] rounded-2xl shadow-lg p-4 sm:p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between ">
                    <div className="lg:hidden flex items-center gap-2 text-sm text-gray-200 bg-[#161718] px-3 py-1 rounded-full">
                      <span>{visibleTabs[activeTab].icon}</span>
                      <span>{visibleTabs[activeTab].label}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <Settings />
                  </div>
                </div>
              )}

              {visibleTabs[activeTab].id === 'profile' && currentUser && (
                <div className="h-full">
                  <ProfileContent
                    currentUser={currentUser}
                    onUploadAvatar={handleUploadAvatar}
                    onLoadOrders={handleLoadOrders}
                    isAvatarUploading={isAvatarUploading}
                    layout="embedded"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Футер */}
      <Footer />

      {/* Кнопка открытия корзины (плавающая) - ТОЛЬКО ДЛЯ ДЕСКТОПА */}
      {showCart && cart.length > 0 && (
        <div className="hidden lg:block fixed bottom-6 right-6 z-30">
          <Button
            onClick={() => setIsCartModalOpen(true)}
            variant="primary"
            size="lg"
            className="shadow-2xl shadow-[#106157]/30 hover:shadow-3xl hover:shadow-[#106157]/40 transition-all duration-400 ease-out hover:scale-105"
          >
            <span className="flex items-center gap-2">
              🛒 Корзина
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full min-w-6">
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1f2122] border-t border-[#455252] p-3 z-30 shadow-lg">
        <div className="flex justify-around items-center">
          {mobileTabs.map(tab => {
            const isActive = visibleTabs[activeTab]?.id === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => selectTabById(tab.id)}
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 min-w-[70px] relative ${
                  isActive
                    ? 'text-white bg-[#106157]'
                    : 'text-gray-300 hover:text-white hover:bg-[#2d2d2c]'
                }`}
              >
                {tab.id === 'orders' && ordersBadge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
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
              className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 min-w-[70px] relative ${
                isCartModalOpen
                  ? 'text-white bg-[#106157]'
                  : 'text-gray-300 hover:text-white hover:bg-[#2d2d2c]'
              }`}
            >
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
              <span className="text-lg mb-1">🛒</span>
              <span className="text-xs font-medium">Корзина</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
