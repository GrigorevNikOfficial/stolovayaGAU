import React, { useState } from 'react';
import { useUnit } from 'effector-react';
import { ItemsList } from '../components/ItemsList';
import { CartBlock } from '../components/CardBlock.tsx';
import { $currentUser } from '../models/users';
import { OrdersList } from '../components/OrdersList.tsx';
import { DeliverySettings } from '../components/DeliverySettings.tsx';
import { CategoriesList } from '../components/CategoriesList.tsx';
import Button from '../components/layout/Button/Button.tsx';
import Tabs from '../components/layout/Tabs/Tabs.tsx';
import Footer from '../components/layout/Footer/Footer.tsx';

// Функция для проверки ролей
const hasRole = (user: any, roles: string | string[]): boolean => {
  if (!user) {
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
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-3 sm:px-4 lg:px-6">
          {/* Вся навигация в одной строке */}
          <div className="flex items-center justify-between py-3 sm:py-4 gap-4">
            {/* Левая часть: лого и табы */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap shrink-0">
                СтоловаяГАУ
              </h1>

              {/* Табы - скрываем на мобильных */}
              <div className="hidden lg:block flex-1 min-w-0">
                <Tabs
                  tabs={visibleTabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  orientation="horizontal"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Правая часть: кнопки пользователя */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 shrink-0">
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
          {/* УБИРАЕМ мобильные табы из header - они теперь только внизу */}
        </div>
      </header>

      {/* Основной контент */}
      {/* Основной контент */}
      {/* Основной контент */}
      <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 h-[calc(100vh-64px-64px)] sm:h-[calc(100vh-80px-64px)] lg:h-[calc(100vh-80px)]">
        <div className="h-full">
          {/* Правый блок - ОСНОВНОЙ КОНТЕНТ */}
          <div className="h-full min-h-0">
            {activeTab < visibleTabs.length && (
              <>
                {visibleTabs[activeTab].id === 'menu' && (
                  <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 h-full">
                    {/* Список товаров */}
                    <div className="w-full h-full min-h-0">
                      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                            Меню
                          </h2>
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
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Корзина</h3>
                <Button
                  onClick={() => setIsCartOpen(false)}
                  variant="outline"
                  size="sm"
                >
                  <svg
                    className="w-4 h-4"
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
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <CartBlock />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Мобильная навигация - индикатор активного таба + корзина */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-40 shadow-lg">
        <div className="flex justify-around items-center">
          {visibleTabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(index)}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-[60px] ${
                activeTab === index
                  ? 'text-green-dark bg-green-light'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg mb-1">{tab.icon}</span>
              <span className="text-xs font-medium truncate max-w-[50px]">
                {tab.label}
              </span>
            </button>
          ))}

          {/* Кнопка корзины */}
          {showCart && (
            <button
              onClick={() => setIsCartOpen(true)}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-[60px] ${
                isCartOpen
                  ? 'text-green-dark bg-green-light'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg mb-1">🛒</span>
              <span className="text-xs font-medium">Корзина</span>
            </button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Функция для заголовка заказов
const getOrdersTitle = (user: any) => {
  if (!user) return 'Заказы';
  if (hasRole(user, ['admin', 'canteenManager', 'storeManager']))
    return 'Все заказы';
  return 'Мои заказы';
};
