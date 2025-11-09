import React, { useState, useEffect } from 'react';
import { useUnit } from 'effector-react';
import {
  $isLoggingIn,
  $authError,
  loginUser,
  registerUser,
  $currentUser,
} from '../models/users';

export const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const [isLoggingIn, authError, currentUser, handleLogin, handleRegister] =
    useUnit([$isLoggingIn, $authError, $currentUser, loginUser, registerUser]);

  // Автоматическое перенаправление после успешной авторизации
  useEffect(() => {
    if (currentUser) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  // Если пользователь авторизован, показываем сообщение о успехе
  if (showSuccess && currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            Успешная авторизация!
          </h2>
          <p className="text-gray-600 mb-2">
            Добро пожаловать, {currentUser.first_name} {currentUser.last_name}
          </p>
          <p className="text-gray-500 text-sm">
            Перенаправление на главную страницу через 2 секунды...
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-4 text-indigo-600 hover:text-indigo-500 underline"
          >
            Перейти сразу
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      handleLogin({ phone: formData.phone, password: formData.password });
    } else {
      if (formData.password !== formData.confirmPassword) {
        alert('Пароли не совпадают');
        return;
      }

      handleRegister({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email, // ПЕРЕДАЕМ EMAIL
        password: formData.password,
        role: 'user',
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
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
          </p>
        </div>

        {authError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
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
                <div>
                  <input
                    type="email"
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Email (необязательно)"
                    value={formData.email}
                    onChange={e =>
                      setFormData({ ...formData, email: e.target.value })
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Пароль"
                value={formData.password}
                onChange={e =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            {!isLogin && (
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Подтвердите пароль"
                  value={formData.confirmPassword}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
            )}
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
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({
                  firstName: '',
                  lastName: '',
                  phone: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                });
              }}
            >
              {isLogin
                ? 'Нет аккаунта? Зарегистрироваться'
                : 'Уже есть аккаунт? Войти'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => (window.location.href = '/')}
              className="text-gray-600 hover:text-gray-500 text-sm"
            >
              ← Назад на главную
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
