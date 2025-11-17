import { useUnit } from 'effector-react';
import React, { useState } from 'react';
import {
    $authError,
    $currentUser,
    $isLoading,
    login,
    register,
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
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showSuccess] = useState(false);

  const [isLoading, authError, currentUser, handleLogin, handleRegister] =
    useUnit([$isLoading, $authError, $currentUser, login, register]);

  // Функция для форматирования телефона с +7
  const formatPhone = (value: string): string => {
    // Убираем все нецифровые символы кроме +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Если начинается с +, оставляем как есть
    if (cleaned.startsWith('+')) {
      // Убираем + для обработки
      cleaned = cleaned.substring(1);
    }
    
    // Если номер начинается с 8, заменяем на 7
    if (cleaned.startsWith('8')) {
      cleaned = '7' + cleaned.substring(1);
    }
    
    // Если номер не начинается с 7, добавляем 7
    if (cleaned && !cleaned.startsWith('7')) {
      cleaned = '7' + cleaned;
    }
    
    // Ограничиваем длину до 12 цифр (7 + 10 цифр)
    if (cleaned.length > 12) {
      cleaned = cleaned.substring(0, 12);
    }
    
    // Возвращаем с +7
    return cleaned ? '+' + cleaned : '';
  };

  // Обработчик изменения телефона
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  // Валидация формы
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!isLogin) {
      if (!formData.firstName.trim()) errors.firstName = 'Имя обязательно';
      if (!formData.lastName.trim()) errors.lastName = 'Фамилия обязательна';
      if (!formData.email.trim()) {
        errors.email = 'Email обязателен';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Введите корректный email';
      }
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Телефон обязателен';
    } else if (!/^[\d\+][\d\(\)\ -]{4,14}\d$/.test(formData.phone)) {
      errors.phone = 'Введите корректный номер телефона';
    }

    if (!formData.password) {
      errors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      errors.password = 'Пароль должен быть не менее 6 символов';
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Подтвердите пароль';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Пароли не совпадают';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isLogin) {
      handleLogin({
        phone: formData.phone,
        password: formData.password,
      });
    } else {
      // Используем mail вместо email
      handleRegister({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        mail: formData.email, // Ключевое изменение: mail вместо email
        password: formData.password,
      });
    }
  };

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
                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                      formErrors.firstName
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Имя"
                    value={formData.firstName}
                    onChange={e =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                  {formErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    required
                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                      formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Фамилия"
                    value={formData.lastName}
                    onChange={e =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                  {formErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="email"
                    required
                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Email"
                    value={formData.email}
                    onChange={e =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>
              </>
            )}
            <div>
              <input
                type="tel"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                  formErrors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Телефон: например +79181234567"
                value={formData.phone}
                onChange={handlePhoneChange}
                onFocus={(e) => {
                  // Если поле пустое, автоматически добавляем +7
                  if (!e.target.value) {
                    setFormData({ ...formData, phone: '+7' });
                  }
                }}
              />
              {formErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
              )}
            </div>
            <div>
              <input
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Пароль"
                value={formData.password}
                onChange={e =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.password}
                </p>
              )}
            </div>
            {!isLogin && (
              <div>
                <input
                  type="password"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                    formErrors.confirmPassword
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Подтвердите пароль"
                  value={formData.confirmPassword}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading
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
                setFormErrors({});
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
