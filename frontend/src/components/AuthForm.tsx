import React, { useState } from 'react';
import { useStore, useEvent } from 'effector-react';
import {
  $isLoggingIn,
  $authError,
  loginUser,
  createUser,
} from '../models/users';

export const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
  });

  const isLoggingIn = useStore($isLoggingIn);
  const authError = useStore($authError);
  const handleLogin = useEvent(loginUser);
  const handleCreateUser = useEvent(createUser);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      handleLogin({ phone: formData.phone, password: formData.password });
    } else {
      handleCreateUser({
        ...formData,
        role: 'user', // По умолчанию создаем обычного пользователя
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Вход в систему' : 'Регистрация'}
          </h2>
        </div>

        {authError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {authError}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!isLogin && (
              <>
                <div>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Имя"
                    value={formData.firstName}
                    onChange={e =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Фамилия"
                    value={formData.lastName}
                    onChange={e =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </>
            )}
            <div>
              <input
                type="tel"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Телефон"
                value={formData.phone}
                onChange={e =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Пароль"
                value={formData.password}
                onChange={e =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoggingIn
                ? 'Загрузка...'
                : isLogin
                  ? 'Войти'
                  : 'Зарегистрироваться'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              className="text-indigo-600 hover:text-indigo-500"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? 'Нет аккаунта? Зарегистрироваться'
                : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
