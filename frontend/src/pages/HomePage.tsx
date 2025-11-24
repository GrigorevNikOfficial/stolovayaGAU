import { useUnit } from 'effector-react';
import React, { useEffect, useState } from 'react';
import { CategoriesList } from '../components/Categories/CategoriesList.tsx';
import { ItemsList } from '../components/Items/ItemsList.tsx';
import { PointItemsList } from '../components/Points/PointItemsList.tsx';
import { StockManagement } from '../components/Stock/StockManagement.tsx';
import Button from '../components/layout/Button/Button.tsx';
import Footer from '../components/layout/Footer/Footer.tsx';
import { Tabs } from '../components/layout/Tabs/Tabs.tsx';
import CartModal from '../components/Modal/CardModal.tsx';
import { OrdersList } from '../components/Orders/OrdersList.tsx';
import { Settings } from '../components/Settings/Settings.tsx';
import LogoSAU from '../images/LogoSAU.svg';
import { $cart } from '../models/cart';
import { $currentUser } from '../models/users';

// Функция для проверки ролей
const hasRole = (user: any, roles: string | string[]): boolean => {
  if (!user) {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes('guest');
  }

  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return rolesArray.includes(user.role);
};

// Функция для определения типа администратора
const getAdminType = (user: any) => {
  if (!user) return null;

  if (user.role === 'admin') return 'system';
  if (user.role === 'canteenManager' || user.role === 'cateenManager')
    return 'canteen';
  if (user.role === 'storeManager') return 'store';

  return null;
};

export const HomePage: React.FC = () => {
  const [currentUser] = useUnit([$currentUser]);
  const [cart] = useUnit([$cart]);
  const [activeTab, setActiveTab] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'stock'>('items');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase() ||
      'U'
    : '';

  const adminType = getAdminType(currentUser);
  const isAdmin = adminType !== null;
  const isSystemAdmin = adminType === 'system';
  const isCanteenAdmin = adminType === 'canteen';
  const isStoreAdmin = adminType === 'store';

  const handleNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleProfileClick = () => {
    handleNavigation('/profile');
  };

  // Определяем видимые табы для текущего пользователя
  const getVisibleTabs = () => {
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
      {
        id: 'settings',
        label: 'Настройки',
        icon: '⚙️',
        roles: ['admin'],
      },
    ];

    return allTabs.filter(tab => hasRole(currentUser, tab.roles));
  };

  const visibleTabs = getVisibleTabs();

  // Определяем, нужно ли показывать корзину
  const showCart =
    currentUser &&
    (currentUser.role === 'admin' || currentUser.role === 'user');

  // Закрываем мобильное меню при смене таба
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  // Сбрасываем субтаб при смене основного таба
  useEffect(() => {
    setActiveSubTab('items');
  }, [activeTab]);

  // Получаем заголовок для активного таба с учетом субтабов
  const getActiveTabTitle = () => {
    const currentTab = visibleTabs[activeTab];
    if (!currentTab) return '';

    if (currentTab.id === 'menu') {
      if (isAdmin) {
        return activeSubTab === 'items' ? 'Создание товаров' : 'Учет товаров';
      }
      return 'Выбор точки и товаров';
    }

    return currentTab.label;
  };

  // Получаем контент для активного таба
  const renderActiveTabContent = () => {
    const currentTab = visibleTabs[activeTab];
    if (!currentTab) return null;

    switch (currentTab.id) {
      case 'menu':
        if (isAdmin) {
          // Для админов показываем субтабы
          return (
            <div className="h-full flex flex-col">
              {/* Субтабы для админов */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveSubTab('items')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                    activeSubTab === 'items'
                      ? 'bg-green-dark text-white shadow-lg shadow-green-dark/25'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  📦 Создание товаров
                </button>
                <button
                  onClick={() => setActiveSubTab('stock')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                    activeSubTab === 'stock'
                      ? 'bg-green-dark text-white shadow-lg shadow-green-dark/25'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  📊 Учет товаров
                </button>
              </div>

              {/* Контент субтабов */}
              <div className="flex-1 overflow-y-auto">
                {activeSubTab === 'items' && <ItemsList />}
                {activeSubTab === 'stock' && <StockManagement />}
              </div>
            </div>
          );
        } else {
          // Для обычных пользователей - выбор точки и товаров
          return <PointItemsList />;
        }

      case 'categories':
        return <CategoriesList />;

      case 'orders':
        return <OrdersList />;

      case 'settings':
        return <Settings />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Шапка */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-3 sm:px-4 lg:px-6">
          {/* Вся навигация в одной строке */}
          <div className="flex items-center justify-between py-3 sm:py-4 gap-4">
            {/* Левая часть: логотип и название */}
            <div className="flex items-center gap-3 shrink-0 mr-12">
              <img
                src={LogoSAU}
                alt="Логотип столовой ГАУ"
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">
                Столовая ГАУ
              </h1>
            </div>

            {/* Центральная часть: табы */}
            <div className="hidden lg:block flex-1 min-w-0">
              <Tabs
                tabs={visibleTabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                orientation="horizontal"
                className="flex-1"
              />
            </div>

            {/* Правая часть: кнопки пользователя */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 shrink-0">
              {currentUser && (
                <>
                  <div className="sm:hidden mr-1 text-xs font-semibold text-green-dark bg-green-light/60 px-2 py-1 rounded-full">
                    {(currentUser.balance ?? 0).toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-right mr-1">
                    <span className="text-[11px] uppercase tracking-wide text-gray-400">
                      Баланс
                    </span>
                    <span className="text-base font-bold text-green-dark">
                      {(currentUser.balance ?? 0).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </>
              )}
              {currentUser ? (
                <Button
                  onClick={handleProfileClick}
                  variant="icon"
                  avatarUrl={avatarUrl}
                  initials={userInitials}
                  size="md"
                />
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
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <Tabs
                tabs={visibleTabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                orientation="vertical"
                className="w-full"
              />
            </div>
          </div>

          {/* Контент активного таба */}
          {activeTab < visibleTabs.length && (
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 h-full flex flex-col">
              {/* Заголовок таба */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {getActiveTabTitle()}
                </h2>

                {/* Индикатор активного таба для мобильных */}
                <div className="lg:hidden flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  <span>{visibleTabs[activeTab].icon}</span>
                  <span>{visibleTabs[activeTab].label}</span>
                </div>
              </div>

              {/* Дополнительная информация для админов в меню */}
              {visibleTabs[activeTab].id === 'menu' && isAdmin && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    {isSystemAdmin &&
                      '💼 Системный администратор: управление всеми товарами и точками'}
                    {isCanteenAdmin &&
                      '🏢 Администратор столовой: управление товарами столовой'}
                    {isStoreAdmin &&
                      '🏪 Администратор буфета: управление товарами буфета'}
                  </p>
                </div>
              )}

              {/* Основной контент */}
              <div className="flex-1 overflow-y-auto">
                {renderActiveTabContent()}
              </div>
            </div>
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
            className="shadow-2xl shadow-green-dark/30 hover:shadow-3xl hover:shadow-green-dark/40 transition-all duration-400 ease-out hover:scale-105"
          >
            <span className="flex items-center gap-2">
              🛒 Корзина
              <span className="bg-white text-green-dark text-xs font-bold px-2 py-1 rounded-full min-w-6">
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
      />

      {/* Мобильная навигация */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-30 shadow-lg">
        <div className="flex justify-around items-center">
          {visibleTabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(index)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 min-w-[70px] ${
                activeTab === index
                  ? 'text-green-dark bg-green-light'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg mb-1">{tab.icon}</span>
              <span className="text-xs font-medium truncate max-w-[60px]">
                {tab.label}
              </span>
            </button>
          ))}

          {/* Кнопка корзины для мобильных */}
          {showCart && (
            <button
              onClick={() => setIsCartModalOpen(true)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 min-w-[70px] relative ${
                isCartModalOpen
                  ? 'text-green-dark bg-green-light'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
