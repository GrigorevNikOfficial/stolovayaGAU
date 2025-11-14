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

  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
    : '';

  const handleNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
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

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Шапка */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">СтоловаяГАУ</h1>
            </div>

            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300 flex items-center justify-center text-sm font-semibold text-gray-600">
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
                  <button
                    onClick={() => handleNavigation('/profile')}
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Профиль
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigation('/login')}
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Войти
                  </button>
                  <button
                    onClick={() => handleNavigation('/register')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
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
      <div className="px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-80px)]">
        <div className="flex gap-8 h-full">
          {/* Левый блок с табами */}
          <div className="w-64">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full">
              <Tabs selectedIndex={activeTab} onSelect={setActiveTab}>
                <TabList className="flex flex-col">
                  {visibleTabs.map(tab => (
                    <Tab
                      key={tab.id}
                      className="py-4 px-6 cursor-pointer transition-colors border-b border-gray-200 ui-selected:bg-indigo-50 ui-selected:font-medium ui-selected:text-indigo-700 ui-not-selected:text-gray-600 ui-not-selected:hover:text-gray-900 ui-not-selected:hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{tab.icon}</span>
                        <span className="font-medium">{tab.label}</span>
                      </div>
                    </Tab>
                  ))}
                </TabList>

                {/* Контент левого блока */}
                <div className="p-4">
                  {visibleTabs.map(tab => (
                    <TabPanel key={tab.id}>
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">
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
          <div className="flex-1 h-full">
            {activeTab < visibleTabs.length && (
              <>
                {visibleTabs[activeTab].id === 'menu' && (
                  <div className="flex gap-8 h-full">
                    <div className="flex-1 h-full">
                      <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">
                          Меню
                        </h2>
                        <div className="flex-1 overflow-y-auto">
                          <ItemsList />
                        </div>
                      </div>
                    </div>
                    <div className="w-80 h-full">
                      <CartBlock />
                    </div>
                  </div>
                )}

                {visibleTabs[activeTab].id === 'categories' && (
                  <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Управление категориями
                    </h2>
                    <div className="flex-1 overflow-y-auto">
                      <CategoriesList />
                    </div>
                  </div>
                )}

                {visibleTabs[activeTab].id === 'orders' && (
                  <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      {getOrdersTitle(currentUser)}
                    </h2>
                    <div className="flex-1 overflow-y-auto">
                      <OrdersList />
                    </div>
                  </div>
                )}

                {visibleTabs[activeTab].id === 'settings' && (
                  <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
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
