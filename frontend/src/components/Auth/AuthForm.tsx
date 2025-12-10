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
import { normalizePhoneDigits, phoneToApiFormat } from '../../utils/phone';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';

type AuthFormProps = {
  variant?: 'full' | 'embedded';
};

export const AuthForm: React.FC<AuthFormProps> = ({ variant = 'full' }) => {
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

  // Валидация формы
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    const phoneDigits = normalizePhoneDigits(formData.phone);

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
    } else if (phoneDigits.length !== 11) {
      errors.phone = 'Введите номер в формате +7 999 123-45-67';
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

    const preparedPhone = phoneToApiFormat(formData.phone);

    if (!preparedPhone) {
      setFormErrors(prev => ({ ...prev, phone: 'Введите номер в формате +7 999 123-45-67' }));
      return;
    }

    if (isLogin) {
      handleLogin({
        phone: preparedPhone,
        password: formData.password,
      });
    } else {
      handleRegister({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: preparedPhone,
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

  const isEmbedded = variant === 'embedded';

  const successContent = (
    <div className="text-center bg-white border border-border-soft rounded-3xl shadow-brand-card p-10 w-full">
      <div className="w-20 h-20 bg-brand-seashell border border-brand-indigo/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-brand-indigo">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-text-primary mb-3">Успешная авторизация</h2>
      <p className="text-text-secondary mb-8">
        Добро пожаловать,
        <span className="font-semibold text-text-primary">
          {' '}
          {currentUser?.first_name} {currentUser?.last_name}
        </span>
      </p>
      <div className="space-y-3">
        <Button onClick={() => (window.location.href = '/')} variant="primary" size="lg" className="w-full">
          Перейти на главную
        </Button>
        <Button onClick={() => window.location.reload()} variant="outline" size="md" className="w-full">
          Остаться на странице
        </Button>
      </div>
    </div>
  );

  if (currentUser) {
    if (isEmbedded) {
      return <div className="w-full">{successContent}</div>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 text-text-primary">
        <div className="w-full max-w-lg">{successContent}</div>
      </div>
    );
  }

  const formCard = (
    <div className="bg-white border border-border-soft rounded-3xl p-6 sm:p-8 shadow-brand-card backdrop-blur-lg">
      <div className="mb-8 text-center space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-text-muted">
          {isLogin ? 'Вход' : 'Регистрация'}
        </p>
        <h1 className="text-3xl font-bold text-text-primary">
          {isLogin ? 'Войдите в систему' : 'Добро пожаловать в столовую ГАУ'}
        </h1>
        <p className="text-text-secondary">
          {isLogin
            ? 'Введите телефон и пароль, чтобы продолжить.'
            : 'Зарегистрируйтесь и оформляйте заказы онлайн за пару кликов.'}
        </p>
      </div>

      {authError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700">
          {authError}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Имя"
                value={formData.firstName}
                onChange={value => setFormData({ ...formData, firstName: value })}
                className={formErrors.firstName ? 'border-red-500/70' : ''}
              />
              {formErrors.firstName && <p className="text-red-300 text-xs mt-2">{formErrors.firstName}</p>}
            </div>

            <div>
              <Input
                type="text"
                placeholder="Фамилия"
                value={formData.lastName}
                onChange={value => setFormData({ ...formData, lastName: value })}
                className={formErrors.lastName ? 'border-red-500/70' : ''}
              />
              {formErrors.lastName && <p className="text-red-300 text-xs mt-2">{formErrors.lastName}</p>}
            </div>

            <div>
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={value => setFormData({ ...formData, email: value })}
                className={formErrors.email ? 'border-red-500/70' : ''}
              />
              {formErrors.email && <p className="text-red-300 text-xs mt-2">{formErrors.email}</p>}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Input
              type="tel"
              placeholder="Телефон (+7 999 123-45-67)"
              value={formData.phone}
              onChange={value => setFormData({ ...formData, phone: value })}
              onFocus={() => {
                if (!formData.phone) {
                  setFormData({ ...formData, phone: '+7' });
                }
              }}
              className={formErrors.phone ? 'border-red-500/70' : ''}
            />
            {formErrors.phone && <p className="text-red-300 text-xs mt-2">{formErrors.phone}</p>}
          </div>

          <div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Пароль"
              value={formData.password}
              onChange={value => setFormData({ ...formData, password: value })}
              className={formErrors.password ? 'border-red-500/70' : ''}
              icon={showPassword ? eyeIcon : eyeOffIcon}
              onIconClick={() => setShowPassword(prev => !prev)}
              iconAriaLabel={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            />
            {formErrors.password && <p className="text-red-300 text-xs mt-2">{formErrors.password}</p>}
          </div>

          {!isLogin && (
            <div>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Подтвердите пароль"
                value={formData.confirmPassword}
                onChange={value => setFormData({ ...formData, confirmPassword: value })}
                className={formErrors.confirmPassword ? 'border-red-500/70' : ''}
                icon={showConfirmPassword ? eyeIcon : eyeOffIcon}
                onIconClick={() => setShowConfirmPassword(prev => !prev)}
                iconAriaLabel={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
              />
              {formErrors.confirmPassword && (
                <p className="text-red-300 text-xs mt-2">{formErrors.confirmPassword}</p>
              )}
            </div>
          )}
        </div>

        <Button type="submit" disabled={isLoading} variant="primary" size="lg" className="w-full">
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

        <div className="text-center">
          <button
            type="button"
            onClick={switchMode}
            className="text-brand-indigo hover:text-brand-grape font-semibold transition-colors"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </form>
    </div>
  );

  if (isEmbedded) {
    return <div className="w-full">{formCard}</div>;
  }

  return (
    <div className="min-h-screen text-text-primary flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-xl">{formCard}</div>
    </div>
  );
};

export default AuthForm;
