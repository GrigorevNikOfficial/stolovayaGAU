import type { FC } from 'react';
import { AuthForm } from '../components/Auth/AuthForm.tsx';
import Button from '../components/layout/Button/Button.tsx';
import {
  BellIcon,
  CalendarIcon,
  ChatBubblesIcon,
  ForkKnifeIcon,
  ToolkitIcon,
} from '../components/icons/ServiceIcons.tsx';
import type { IconProps } from '../components/icons/ServiceIcons.tsx';
import NotificationBell from '../components/Notifications/NotificationBell.tsx';
import LogoSAU from '../images/logo.jpg';
import type { User } from '../types/user';
import { formatBalance } from '../utils/formatBalance';

const statusMap = {
  live: {
    label: 'Работает',
    tone: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  testing: {
    label: 'Тестируем',
    tone: 'border border-amber-200 bg-amber-50 text-amber-700',
  },
  soon: {
    label: 'Скоро',
    tone: 'border border-slate-200 bg-slate-50 text-slate-500',
  },
} as const;

type ServiceCardDescriptor = {
  id: string;
  title: string;
  description: string;
  status: keyof typeof statusMap;
  Icon: FC<IconProps>;
  iconAccent: string;
  path: string;
};

const services: ServiceCardDescriptor[] = [
  {
    id: 'cafeteria',
    title: 'Еда',
    description: 'Полноценный сервис заказа блюд, управление балансом и отслеживание доставки в реальном времени.',
    status: 'live',
    Icon: ForkKnifeIcon,
    iconAccent: 'from-emerald-400 to-emerald-600',
    path: '/services/cafeteria',
  },
  {
    id: 'chat',
    title: 'Чат',
    description: 'Создавайте тематические каналы, общайтесь с коллегами и получайте быстрый доступ к поддержке.',
    status: 'testing',
    Icon: ChatBubblesIcon,
    iconAccent: 'from-sky-400 via-sky-500 to-sky-600',
    path: '/services/chat',
  },
  {
    id: 'notifications',
    title: 'Уведомления',
    description: 'Централизованные уведомления по заказам, поставкам, внутренним объявлениям и важным новостям.',
    status: 'testing',
    Icon: BellIcon,
    iconAccent: 'from-amber-300 to-amber-500',
    path: '/services/notifications',
  },
  {
    id: 'marketplace',
    title: 'Услуги',
    description: 'Локальные сервисы сотрудников и партнёров: аренда, обучение, консультации и другие предложения.',
    status: 'testing',
    Icon: ToolkitIcon,
    iconAccent: 'from-rose-300 to-rose-500',
    path: '/services/marketplace',
  },
  {
    id: 'events',
    title: 'Афиша событий',
    description: 'Календарь мероприятий университета, напоминания и быстрые регистрации на встречи и активности.',
    status: 'testing',
    Icon: CalendarIcon,
    iconAccent: 'from-purple-300 to-purple-500',
    path: '/services/events',
  },
];

type NavigationPageProps = {
  currentUser: User | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export const NavigationPage: FC<NavigationPageProps> = ({ currentUser, onNavigate, onLogout }) => {
  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
    : '';
  const balanceLabel = currentUser ? formatBalance(currentUser.balance) : '';

  return (
    <div className="min-h-screen text-text-primary flex flex-col bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-white/95 shadow-sm backdrop-blur">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between gap-4 py-3 sm:py-4 min-h-[72px]">
            <div className="flex items-center gap-3 rounded-2xl border border-transparent px-1 py-1">
              <img
                src={LogoSAU}
                alt="Логотип сервиса"
                className="w-12 h-12 rounded-3xl border border-transparent sm:w-14 sm:h-14"
              />
              <div className="leading-tight">
                <h1 className="flex items-center text-2xl font-black uppercase tracking-tight text-text-primary sm:text-[1.85rem] lg:text-[2.1rem]">
                  <span className="tracking-[-0.04em]">STUD</span>
                  <span className="ml-1 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm tracking-[-0.04em]">
                    MI
                  </span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('/profile')}
                    className="flex min-w-0 items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-inner transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
                  >
                    <span className="max-w-[90px] truncate text-sm font-semibold text-emerald-800 sm:max-w-[140px] sm:text-base" title={balanceLabel}>
                      {balanceLabel}
                    </span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-6 sm:w-6">+</span>
                  </button>
                  <NotificationBell />
                  <button
                    type="button"
                    onClick={() => onNavigate('/profile')}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-all duration-200 hover:border-emerald-300 hover:text-emerald-600"
                    aria-label="Профиль"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-brand-indigo text-base font-semibold text-white">
                      {avatarUrl ? <img src={avatarUrl} alt="Аватар" className="h-full w-full rounded-full object-cover" /> : userInitials}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-colors hover:border-emerald-300 hover:text-emerald-600"
                    aria-label="Выйти"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <NotificationBell onRequireAuth={() => onNavigate('/login')} />
                  <Button
                    variant="primary"
                    size="md"
                    className="px-7 text-base shadow-brand-card hover:-translate-y-0.5"
                    onClick={() => onNavigate('/login')}
                  >
                    Войти
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          <div className="grid gap-10 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-border-subtle bg-white p-6 sm:p-8 shadow-brand-card">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="mt-3 text-3xl font-semibold text-brand-indigo">Выберите сервис для продолжения</h2>
                  <p className="mt-4 text-text-secondary">
                    Доступные продукты обновляются автоматически. Новые сервисы появятся в вашей панели без повторной регистрации.
                  </p>
                </div>
                {currentUser && (
                  <div className="rounded-2xl border border-border-subtle bg-surface-muted px-5 py-4 text-sm text-text-secondary">
                    <p className="text-brand-indigo mb-1 font-semibold">
                      {currentUser.first_name} {currentUser.last_name}
                    </p>
                    <p className="text-text-muted">Статус аккаунта синхронизирован</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {services.map(service => {
                const tone = statusMap[service.status];
                const Icon = service.Icon;
                const isDisabled = service.status === 'soon';
                return (
                  <button
                    key={service.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && onNavigate(service.path)}
                    className={`group relative overflow-hidden rounded-[28px] border border-border-subtle bg-white p-6 text-left text-text-primary shadow-[0_35px_80px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_90px_rgba(16,185,129,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-almond/30 ${
                      isDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${service.iconAccent} text-white shadow-[0_18px_35px_rgba(16,185,129,0.35)]`}>
                        <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-widest uppercase ${tone.tone}`}>
                        {tone.label}
                      </span>
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold text-brand-indigo">{service.title}</h3>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-3">
                      {service.description}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-brand-indigo">
                      {isDisabled ? 'Готовим к запуску' : 'Перейти в сервис'}
                      {!isDisabled && (
                        <span className="transition-transform duration-300 group-hover:translate-x-1 text-brand-almond">→</span>
                      )}
                    </div>
                    <div className="pointer-events-none absolute inset-x-6 bottom-6 h-px bg-gradient-to-r from-transparent via-brand-almond/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-border-subtle bg-white p-6 sm:p-8 shadow-brand-card">
              {currentUser ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="mt-2 text-2xl font-semibold text-brand-indigo">Вы уже авторизованы</h3>
                    <p className="mt-3 text-sm text-text-secondary">
                      Можете сразу перейти в рабочие продукты. Все данные синхронизированы со столовой и будущими сервисами.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Button type="button" variant="primary" size="lg" className="w-full" onClick={() => onNavigate('/services/cafeteria')}>
                      Открыть столовую
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="w-full shadow-brand-card hover:-translate-y-0.5"
                      onClick={() => onNavigate('/profile')}
                    >
                      Перейти в профиль
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm uppercase tracking-[0.4em] text-text-muted mb-4">единый вход</p>
                  <AuthForm variant="embedded" />
                </>
              )}
            </div>

            <div className="rounded-3xl border border-border-subtle bg-white p-6 shadow-brand-card">
              <p className="text-xs uppercase tracking-[0.4em] text-text-muted">дорожная карта</p>
              <h3 className="mt-2 text-xl font-semibold text-brand-indigo">Новые сервисы появятся поэтапно</h3>
              <ul className="mt-4 space-y-3 text-sm text-text-secondary">
                <li>• Q1 2025 — запуск уведомлений и мобильных пушей</li>
                <li>• Q2 2025 — общий чат и поддержка</li>
                <li>• Q3 2025 — маркетплейс услуг сотрудников</li>
                <li>• Q4 2025 — афиша мероприятий</li>
              </ul>
            </div>
          </aside>
        </div>
        </div>
      </main>
    </div>
  );
};

export default NavigationPage;
