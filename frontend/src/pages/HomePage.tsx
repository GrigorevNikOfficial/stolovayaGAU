import React, { useState } from 'react';
import { useUnit } from 'effector-react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { ItemsList } from '../components/ItemsList';
import { CartBlock } from '../components/CardBlock.tsx';
import { $currentUser } from '../models/users';
import { OrdersList } from '../components/OrdersList.tsx';
import { CategoriesList } from '../components/CategoriesList';

export const HomePage: React.FC = () => {
  const [currentUser] = useUnit([$currentUser]);
  const [activeTab, setActiveTab] = useState(0);

  const handleNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

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
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  Профиль
                </button>
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
                  <Tab className="py-4 px-6 cursor-pointer transition-colors border-b border-gray-200 ui-selected:bg-indigo-50 ui-selected:font-medium ui-selected:text-indigo-700 ui-not-selected:text-gray-600 ui-not-selected:hover:text-gray-900 ui-not-selected:hover:bg-gray-50">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">🛍️</span>
                      <span className="font-medium">Товары</span>
                    </div>
                  </Tab>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'canteenManager' || currentUser?.role === 'cateenManager') && (
                    <Tab className="py-4 px-6 cursor-pointer transition-colors ui-selected:bg-indigo-50 ui-selected:font-medium ui-selected:text-indigo-700 ui-not-selected:text-gray-600 ui-not-selected:hover:text-gray-900 ui-not-selected:hover:bg-gray-50">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">📋</span>
                        <span className="font-medium">Категории</span>
                      </div>
                    </Tab>
                  )}
                  <Tab className="py-4 px-6 cursor-pointer transition-colors ui-selected:bg-indigo-50 ui-selected:font-medium ui-selected:text-indigo-700 ui-not-selected:text-gray-600 ui-not-selected:hover:text-gray-900 ui-not-selected:hover:bg-gray-50">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">📂</span>
                      <span className="font-medium">Заказы</span>
                    </div>
                  </Tab>
                </TabList>

                {/* Контент левого блока */}
                <div className="p-4">
                  <TabPanel>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Все доступные товары в нашем меню
                      </p>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700">
                          Добавляйте товары в корзину
                        </p>
                      </div>
                    </div>
                  </TabPanel>

                  {(currentUser?.role === 'admin' || currentUser?.role === 'canteenManager' || currentUser?.role === 'cateenManager') && (
                    <TabPanel>
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">
                          Управление категориями товаров
                        </p>
                      </div>
                    </TabPanel>
                  )}

                  <TabPanel>
                    <div className="text-center py-4">
                      {currentUser && (currentUser.role == 'admin' || currentUser.role == 'storeManager') ? (
                        <p className="text-gray-500 text-sm">Все заказы</p>
                      ) : currentUser && currentUser.role == 'user' ? (
                        <p className="text-gray-500 text-sm">Мои заказы</p>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          Авторизуйтесь чтобы отображались ваши заказы
                        </p>
                      )}
                    </div>
                  </TabPanel>
                </div>
              </Tabs>
            </div>
          </div>

          {/* Правый блок - ОСНОВНОЙ КОНТЕНТ */}
          <div className="flex-1 h-full">
            {(() => {
              const isAdminOrCanteenManager = 
                currentUser?.role === 'admin' || 
                currentUser?.role === 'canteenManager' || 
                currentUser?.role === 'cateenManager';
              
              // Определяем какая вкладка активна
              // Если есть вкладка категорий: 0=Товары, 1=Категории, 2=Заказы
              // Если нет вкладки категорий: 0=Товары, 1=Заказы
              
              if (activeTab === 0) {
                // Вкладка ТОВАРЫ - показываем список товаров и корзину
                return (
                  <div className="flex gap-8 h-full">
                    {/* Список товаров - с прокруткой */}
                    <div className="flex-1 h-full">
                      <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">
                          Все товары
                        </h2>
                        <div className="flex-1 overflow-y-auto">
                          <ItemsList />
                        </div>
                      </div>
                    </div>

                    {/* Корзина - только для вкладки "Товары" */}
                    <div className="w-80 h-full">
                      <div className="h-full">
                        <CartBlock />
                      </div>
                    </div>
                  </div>
                );
              } else if (isAdminOrCanteenManager && activeTab === 1) {
                // Вкладка КАТЕГОРИИ - показываем управление категориями
                return (
                  <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                      <CategoriesList />
                    </div>
                  </div>
                );
              } else {
                // Вкладка ЗАКАЗЫ - показываем список заказов
                return (
                  <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                      <OrdersList />
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
