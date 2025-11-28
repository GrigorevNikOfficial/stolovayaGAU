// components/Auth/AuthForm.tsx
import { useUnit } from 'effector-react';
import React, { useMemo, useState } from 'react';
import {
    $authError,
    $currentUser,
    $isLoading,
    login,
    register,
} from '../../models/users';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, authError, currentUser, handleLogin, handleRegister] =
    useUnit([$isLoading, $authError, $currentUser, login, register]);

  // Функция для форматирования телефона с +7
  const formatPhone = (value: string): string => {
    let cleaned = value.replace(/[^\d+]/g, '');

    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    if (cleaned.startsWith('8')) {
      cleaned = '7' + cleaned.substring(1);
    }

    if (cleaned && !cleaned.startsWith('7')) {
      cleaned = '7' + cleaned;
    }

    if (cleaned.length > 12) {
      cleaned = cleaned.substring(0, 12);
    }

    return cleaned ? '+' + cleaned : '';
  };

  // Обработчик изменения телефона
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
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
    } else if (!/^\+7\d{10}$/.test(formData.phone)) {
      errors.phone = 'Введите корректный номер телефона (+79123456789)';
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
      handleRegister({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
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
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const eyeIcon = useMemo(
    () => (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    []
  );

  const eyeOffIcon = useMemo(
    () => (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3l18 18" />
        <path d="M10.73 6.73C11.15 6.57 11.57 6.5 12 6.5c6.5 0 10 6 10 6a17.08 17.08 0 0 1-2.06 2.88" />
        <path d="M6.12 6.12C4.12 7.5 2.7 10 2.7 10s3.5 6 10 6c1.05 0 2.05-.17 3-.5" />
        <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
      </svg>
    ),
    []
  );

  // Если пользователь авторизован, показываем успешное сообщение
  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1112] px-4 py-10 text-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_rgba(16,97,87,0.25),_transparent_55%)]" />
        <div className="relative z-10 text-center bg-[#1b1c1d] border border-[#2f3133] rounded-3xl shadow-2xl shadow-[#0b2a25]/40 p-10 max-w-lg w-full">
          <div className="w-20 h-20 bg-[#106157]/20 border border-[#106157]/50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#69e7b6]">
            <svg
              className="w-10 h-10"
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
          <h2 className="text-3xl font-bold text-white mb-3">
            Успешная авторизация
          </h2>
          <p className="text-gray-400 mb-8">
            Добро пожаловать,
            <span className="font-semibold text-white"> {currentUser.first_name} {currentUser.last_name}</span>
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
    <div className="min-h-screen bg-[#0f1112] text-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top,_rgba(105,231,182,0.08),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(16,97,87,0.35),_transparent_60%)]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-xl">
          <div className="bg-[#1a1b1c]/95 border border-[#2c2d30] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40 backdrop-blur-lg">
            <div className="mb-8 text-center space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500">{isLogin ? 'Вход' : 'Регистрация'}</p>
              <h1 className="text-3xl font-bold text-white">
                {isLogin ? 'Рады видеть вас снова' : 'Добро пожаловать в столовую ГАУ'}
              </h1>
              <p className="text-gray-400">
                {isLogin
                  ? 'Авторизуйтесь, чтобы управлять заказами и балансом.'
                  : 'Зарегистрируйтесь и оформляйте заказы онлайн за пару кликов.'}
              </p>
            </div>

            {authError && (
              <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-4 mb-6 text-sm text-red-200">
                {authError}
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
                      className={formErrors.firstName ? 'border-red-500/70' : ''}
                    />
                    {formErrors.firstName && (
                      <p className="text-red-300 text-xs mt-2">
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
                      className={formErrors.lastName ? 'border-red-500/70' : ''}
                    />
                    {formErrors.lastName && (
                      <p className="text-red-300 text-xs mt-2">
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
                      className={formErrors.email ? 'border-red-500/70' : ''}
                    />
                    {formErrors.email && (
                      <p className="text-red-300 text-xs mt-2">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Общие поля */}
              <div className="space-y-4">
                <div>
                  <Input
                    type="tel"
                    placeholder="Телефон (+79123456789)"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    onFocus={() => {
                      if (!formData.phone) {
                        setFormData({ ...formData, phone: '+7' });
                      }
                    }}
                    className={formErrors.phone ? 'border-red-500/70' : ''}
                  />
                  {formErrors.phone && (
                    <p className="text-red-300 text-xs mt-2">
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Пароль"
                    value={formData.password}
                    onChange={value =>
                      setFormData({ ...formData, password: value })
                    }
                    className={formErrors.password ? 'border-red-500/70' : ''}
                    icon={showPassword ? eyeIcon : eyeOffIcon}
                    onIconClick={() => setShowPassword(prev => !prev)}
                    iconAriaLabel={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  />
                  {formErrors.password && (
                    <p className="text-red-300 text-xs mt-2">
                      {formErrors.password}
                    </p>
                  )}
                </div>

                {!isLogin && (
                  <div>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Подтвердите пароль"
                      value={formData.confirmPassword}
                      onChange={value =>
                        setFormData({ ...formData, confirmPassword: value })
                      }
                      className={
                        formErrors.confirmPassword ? 'border-red-500/70' : ''
                      }
                      icon={showConfirmPassword ? eyeIcon : eyeOffIcon}
                      onIconClick={() => setShowConfirmPassword(prev => !prev)}
                      iconAriaLabel={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    />
                    {formErrors.confirmPassword && (
                      <p className="text-red-300 text-xs mt-2">
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
                  className="text-[#69e7b6] hover:text-white font-semibold transition-colors"
                >
                  {isLogin
                    ? 'Нет аккаунта? Зарегистрироваться'
                    : 'Уже есть аккаунт? Войти'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
