// components/Auth/AuthForm.tsx
import { useUnit } from 'effector-react';
import React, { useState } from 'react';
import {
    $authError,
    $currentUser,
    $isLoading,
    login,
    register,
} from '../../models/users';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';
import PhoneInput, {
    cleanPhoneNumber,
} from '../layout/PhoneInput/PhoneInput.tsx';

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

  const [isLoading, authError, currentUser, handleLogin, handleRegister] =
    useUnit([$isLoading, $authError, $currentUser, login, register]);

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
    } else if (cleanPhoneNumber(formData.phone).length !== 11) {
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
        phone: cleanPhoneNumber(formData.phone),
        password: formData.password,
      });
    } else {
      handleRegister({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: cleanPhoneNumber(formData.phone),
        mail: formData.email,
        password: formData.password,
      });
    }
  };

  const switchMode = () => {
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
  };

  // Если пользователь авторизован, показываем успешное сообщение
  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
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
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            Успешная авторизация!
          </h2>
          <p className="text-gray-600 mb-4">
            Добро пожаловать,{' '}
            <span className="font-semibold">
              {currentUser.first_name} {currentUser.last_name}
            </span>
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => (window.location.href = '/')}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Перейти на главную
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="md"
              className="w-full"
            >
              Остаться на странице
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Заголовок */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Вход в систему' : 'Регистрация'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
          </p>
        </div>

        {/* Карточка формы */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Сообщение об ошибке */}
          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 font-medium">{authError}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Поля для регистрации */}
            {!isLogin && (
              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Имя"
                    value={formData.firstName}
                    onChange={value =>
                      setFormData({ ...formData, firstName: value })
                    }
                    className={formErrors.firstName ? 'border-red-500' : ''}
                    icon="👤"
                  />
                  {formErrors.firstName && (
                    <p className="text-red-500 text-xs mt-2">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    type="text"
                    placeholder="Фамилия"
                    value={formData.lastName}
                    onChange={value =>
                      setFormData({ ...formData, lastName: value })
                    }
                    className={formErrors.lastName ? 'border-red-500' : ''}
                    icon="👤"
                  />
                  {formErrors.lastName && (
                    <p className="text-red-500 text-xs mt-2">
                      {formErrors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={value =>
                      setFormData({ ...formData, email: value })
                    }
                    className={formErrors.email ? 'border-red-500' : ''}
                    icon="📧"
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-2">
                      {formErrors.email}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Общие поля */}
            <div className="space-y-4">
              <div>
                <PhoneInput
                  value={formData.phone}
                  onChange={value => setFormData({ ...formData, phone: value })}
                  className={formErrors.phone ? 'border-red-500' : ''}
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-2">
                    {formErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={formData.password}
                  onChange={value =>
                    setFormData({ ...formData, password: value })
                  }
                  className={formErrors.password ? 'border-red-500' : ''}
                  icon="🔒"
                />
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-2">
                    {formErrors.password}
                  </p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <Input
                    type="password"
                    placeholder="Подтвердите пароль"
                    value={formData.confirmPassword}
                    onChange={value =>
                      setFormData({ ...formData, confirmPassword: value })
                    }
                    className={
                      formErrors.confirmPassword ? 'border-red-500' : ''
                    }
                    icon="🔒"
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-2">
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Кнопка отправки */}
            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Загрузка...
                </span>
              ) : isLogin ? (
                'Войти'
              ) : (
                'Зарегистрироваться'
              )}
            </Button>

            {/* Переключение между входом и регистрацией */}
            <div className="text-center">
              <button
                type="button"
                onClick={switchMode}
                className="text-green-dark hover:text-green-darker font-medium transition-colors duration-200"
              >
                {isLogin
                  ? 'Нет аккаунта? Зарегистрироваться'
                  : 'Уже есть аккаунт? Войти'}
              </button>
            </div>

            {/* Кнопка назад */}
            <div className="text-center pt-4 border-t border-gray-200">
              <Button
                type="button"
                onClick={() => (window.location.href = '/')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                ← Назад на главную
              </Button>
            </div>
          </form>
        </div>

        {/* Дополнительная информация */}
        <div className="text-center text-sm text-gray-500">
          <p>СтоловаяГАУ - система заказа питания</p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
