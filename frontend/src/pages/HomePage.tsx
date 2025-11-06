import React from 'react';
import { useUnit } from 'effector-react';
import { ItemsList } from '../components/ItemsList';
import { CartBlock } from '../components/CardBlock';
import { $currentUser } from '../models/users';

export const HomePage: React.FC = () => {
  const [currentUser] = useUnit([$currentUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          {' '}
          {/* Убираем max-w-7xl mx-auto */}
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Ресторан</h1>
            </div>

            <div className="flex items-center space-x-4">
              {currentUser ? (
                <a
                  href="/profile"
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  Профиль
                </a>
              ) : (
                <>
                  <a
                    href="/login"
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Войти
                  </a>
                  <a
                    href="/register"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Регистрация
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {' '}
        {/* Убираем max-w-7xl mx-auto */}
        <div className="flex gap-8">
          {/* Блок товаров - СЛЕВА, занимает все оставшееся пространство */}
          <div className="flex-1">
            <ItemsList />
          </div>

          {/* Блок корзины - СПРАВА */}
          <div className="w-80">
            <CartBlock />
          </div>
        </div>
      </div>
    </div>
  );
};
