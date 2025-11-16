import React, { useState } from 'react';
import { useUnit } from 'effector-react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { ItemsList } from '../components/ItemsList';
import { CartBlock } from '../components/CardBlock.tsx';
import { $currentUser } from '../models/users';
import { OrdersList } from '../components/OrdersList.tsx';
import { DeliverySettings } from '../components/DeliverySettings.tsx';
import { CategoriesList } from '../components/CategoriesList.tsx';

// Функция для проверки ролей
const hasRole = (user: any, roles: string | string[]): boolean => {
  if (!user) {
    // Для неавторизованного пользователя
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes('guest');
  }

  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return rolesArray.includes(user.role);
};

export const HomePage: React.FC = () => {
  const [currentUser] = useUnit([$currentUser]);
  const [activeTab, setActiveTab] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase() ||
      'U'
    : '';

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
        roles: ['admin', 'canteenManager', 'user', 'guest'],
      },
      {
        id: 'categories',
        label: 'Категории',
        icon: '📂',
        roles: ['admin', 'canteenManager'],
      },
      {
        id: 'orders',
        label: 'Заказы',
        icon: '📦',
        roles: ['admin', 'canteenManager', 'storeManager', 'user'],
      },
      { id: 'settings', label: 'Настройки', icon: '⚙️', roles: ['admin'] },
    ];

    return allTabs.filter(tab => hasRole(currentUser, tab.roles));
  };

  const visibleTabs = getVisibleTabs();

  // Определяем, нужно ли показывать корзину
  const showCart =
    currentUser &&
    (currentUser.role === 'admin' || currentUser.role === 'user');

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Шапка */}
      <header className="bg-white shadow-sm">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Бургер меню для мобильных */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">
                СтоловаяГАУ
              </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300 flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-600">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={`${currentUser.first_name} ${currentUser.last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{userInitials}</span>
                      )}
                    </div>
                    <span className="text-gray-700 hover:text-gray-900 font-medium text-sm sm:text-base hidden xs:block">
                      Профиль
                    </span>
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigation('/login')}
                    className="text-gray-700 hover:text-gray-900 font-medium text-sm sm:text-base"
                  >
                    Войти
                  </button>
                  <button
                    onClick={() => handleNavigation('/register')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    Регистрация
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)]">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 h-full">
          {/* Левый блок с табами - для десктопа и мобильное меню */}
          <div
            className={`lg:w-64 ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}`}
          >
            <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full">
              <Tabs
                selectedIndex={activeTab}
                onSelect={index => {
                  setActiveTab(index);
                  setIsMobileMenuOpen(false);
                }}
              >
                <TabList className="flex flex-col">
                  {visibleTabs.map(tab => (
                    <Tab
                      key={tab.id}
                      className="py-3 sm:py-4 px-4 sm:px-6 cursor-pointer transition-colors border-b border-gray-200 ui-selected:bg-indigo-50 ui-selected:font-medium ui-selected:text-indigo-700 ui-not-selected:text-gray-600 ui-not-selected:hover:text-gray-900 ui-not-selected:hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <span className="text-base sm:text-lg mr-2 sm:mr-3">
                          {tab.icon}
                        </span>
                        <span className="font-medium text-sm sm:text-base">
                          {tab.label}
                        </span>
                      </div>
                    </Tab>
                  ))}
                </TabList>

                {/* Контент левого блока - только для десктопа */}
                <div className="p-3 sm:p-4 hidden lg:block">
                  {visibleTabs.map(tab => (
                    <TabPanel key={tab.id}>
                      <div className="text-center py-3 sm:py-4">
                        <p className="text-gray-500 text-xs sm:text-sm">
                          {getTabDescription(tab.id, currentUser)}
                        </p>
                      </div>
                    </TabPanel>
                  ))}
                </div>
              </Tabs>
            </div>
          </div>

          {/* Правый блок - ОСНОВНОЙ КОНТЕНТ */}
          <div className="flex-1 h-full min-h-0">
            {activeTab < visibleTabs.length && (
              <>
                {visibleTabs[activeTab].id === 'menu' && (
                  <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 h-full">
                    {/* Список товаров - на мобильных занимает всю ширину */}
                    <div className="w-full h-full min-h-0">
                      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                            Меню
                          </h2>
                          {/* Индикатор активного таба для мобильных */}
                          <div className="lg:hidden flex items-center gap-2 text-sm text-gray-500">
                            <span>{visibleTabs[activeTab].icon}</span>
                            <span>{visibleTabs[activeTab].label}</span>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          <ItemsList />
                        </div>
                      </div>
                    </div>

                    {/* Корзина для десктопа */}
                    {showCart && (
                      <div className="hidden lg:block lg:w-80 h-full">
                        <CartBlock />
                      </div>
                    )}
                  </div>
                )}

                {visibleTabs[activeTab].id === 'categories' && (
                  <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        Управление категориями
                      </h2>
                      <div className="lg:hidden flex items-center gap-2 text-sm text-gray-500">
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
                  <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        {getOrdersTitle(currentUser)}
                      </h2>
                      <div className="lg:hidden flex items-center gap-2 text-sm text-gray-500">
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
                  <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        Настройки доставки
                      </h2>
                      <div className="lg:hidden flex items-center gap-2 text-sm text-gray-500">
                        <span>{visibleTabs[activeTab].icon}</span>
                        <span>{visibleTabs[activeTab].label}</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <DeliverySettings />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Мобильная корзина - выезжающая панель */}
      {showCart && isCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Затемнение фона */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Панель корзины */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Заголовок корзины */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Корзина</h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Контент корзины */}
              <div className="flex-1 overflow-y-auto">
                <CartBlock />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Мобильная навигация - индикатор активного таба + корзина */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-40">
        <div className="flex justify-around">
          {visibleTabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(index)}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                activeTab === index
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          ))}

          {/* Кнопка корзины без количества товаров */}
          {showCart && (
            <button
              onClick={() => setIsCartOpen(true)}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isCartOpen
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">🛒</span>
              <span className="text-xs mt-1 font-medium">Корзина</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Вспомогательная функция для описаний табов
const getTabDescription = (tabId: string, user: any) => {
  switch (tabId) {
    case 'menu':
      return 'Все доступные товары в нашем меню';
    case 'categories':
      return 'Управление категориями товаров';
    case 'orders':
      if (!user) return 'Авторизуйтесь чтобы отображались ваши заказы';
      if (hasRole(user, ['admin', 'canteenManager', 'storeManager']))
        return 'Все заказы системы';
      return 'Мои заказы';
    case 'settings':
      return 'Управление настройками доставки';
    default:
      return '';
  }
};

// Функция для заголовка заказов
const getOrdersTitle = (user: any) => {
  if (!user) return 'Заказы';
  if (hasRole(user, ['admin', 'canteenManager', 'storeManager']))
    return 'Все заказы';
  return 'Мои заказы';
};
