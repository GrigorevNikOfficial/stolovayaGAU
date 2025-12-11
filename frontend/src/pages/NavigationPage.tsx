import { useState, type FC } from 'react';
import Button from '../components/layout/Button/Button.tsx';
import Footer from '../components/layout/Footer/Footer.tsx';
import ServiceHeader from '../components/layout/ServiceHeader/ServiceHeader.tsx';
import {
  BellIcon,
  CalendarIcon,
  ChatBubblesIcon,
  ChecklistIcon,
  ForkKnifeIcon,
  PieChartIcon,
  ToolkitIcon,
  TrophyIcon,
} from '../components/icons/ServiceIcons.tsx';
import type { IconProps } from '../components/icons/ServiceIcons.tsx';
import NotificationBell from '../components/Notifications/NotificationBell.tsx';
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
  requiredRole?: User['role'];
};

const services: ServiceCardDescriptor[] = [
  {
    id: 'cafeteria',
    title: 'Еда',
    description: 'Быстрый заказ блюд и отслеживание доставки.',
    status: 'live',
    Icon: ForkKnifeIcon,
    iconAccent: 'from-emerald-400 to-emerald-600',
    path: '/services/cafeteria',
  },
  {
    id: 'chat',
    title: 'Чат',
    description: 'Тематики, чаты поддержки и общие каналы команды.',
    status: 'testing',
    Icon: ChatBubblesIcon,
    iconAccent: 'from-sky-400 via-sky-500 to-sky-600',
    path: '/services/chat',
  },
  {
    id: 'notifications',
    title: 'Уведомления',
    description: 'Все заказы, поставки и объявления в одном канале.',
    status: 'testing',
    Icon: BellIcon,
    iconAccent: 'from-amber-300 to-amber-500',
    path: '/services/notifications',
  },
  {
    id: 'marketplace',
    title: 'Услуги',
    description: 'Публикуйте услуги и находите исполнителей среди студентов.',
    status: 'testing',
    Icon: ToolkitIcon,
    iconAccent: 'from-rose-300 to-rose-500',
    path: '/services/marketplace',
  },
  {
    id: 'events',
    title: 'Афиша событий',
    description: 'Календарь мероприятий университета с напоминаниями.',
    status: 'soon',
    Icon: CalendarIcon,
    iconAccent: 'from-purple-300 to-purple-500',
    path: '/services/events',
  },
  {
    id: 'achievements',
    title: 'Достижения',
    description: 'Бейджи активности за заявки, услуги и участие.',
    status: 'testing',
    Icon: TrophyIcon,
    iconAccent: 'from-amber-300 to-amber-500',
    path: '/profile?tab=achievements',
  },
  {
    id: 'work',
    title: 'Работа',
    description: 'Подработки и задачи внутри университета.',
    status: 'testing',
    Icon: ChecklistIcon,
    iconAccent: 'from-emerald-300 to-emerald-500',
    path: '/services/work',
  },
  {
    id: 'internships',
    title: 'Стажировки',
    description: 'Предложения компаний с фильтрами по формату и занятости.',
    status: 'testing',
    Icon: ChecklistIcon,
    iconAccent: 'from-sky-300 to-sky-500',
    path: '/services/internships',
  },
  {
    id: 'admin',
    title: 'Админ-панель',
    description: 'Комиссии, балансы и статусы сервисов.',
    status: 'live',
    Icon: PieChartIcon,
    iconAccent: 'from-slate-500 to-slate-800',
    path: '/admin',
    requiredRole: 'admin',
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
  const [isServicePromptVisible, setIsServicePromptVisible] = useState(true);

  return (
    <div className="min-h-screen text-text-primary flex flex-col bg-surface-base">
      <ServiceHeader
        onLogoClick={() => onNavigate('/')}
        rightSlot={
          currentUser ? (
            <>
              <button
                type="button"
                onClick={() => onNavigate('/profile')}
                className="flex min-w-0 items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2 py-1 text-xs font-semibold text-emerald-700 shadow-inner transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:px-3 sm:py-1.5 sm:text-sm"
              >
                <span className="max-w-[72px] truncate text-sm font-semibold text-emerald-800 sm:max-w-[140px] sm:text-base" title={balanceLabel}>
                  {balanceLabel}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-6 sm:w-6">+</span>
              </button>
              <NotificationBell />
              <button
                type="button"
                onClick={() => onNavigate('/profile')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-all duration-200 hover:border-emerald-300 hover:text-emerald-600 sm:h-11 sm:w-11"
                aria-label="Профиль"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-brand-indigo text-sm font-semibold text-white sm:h-10 sm:w-10">
                  {avatarUrl ? <img src={avatarUrl} alt="Аватар" className="h-full w-full rounded-full object-cover" /> : userInitials}
                </span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-colors hover:border-emerald-300 hover:text-emerald-600 sm:h-11 sm:w-11"
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
            <Button
              variant="primary"
              size="md"
              className="px-7 text-base shadow-brand-card hover:-translate-y-0.5"
              onClick={() => onNavigate('/login')}
            >
              Войти
            </Button>
          )
        }
      />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          <section className="space-y-5">
            <div>
              <h2 className="text-3xl font-semibold text-brand-indigo">Сервисы Studmi</h2>
            </div>

            <div
              id="services-grid"
              className="grid grid-cols-2 gap-3 auto-rows-fr sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
            >
              {services
                .filter(service => !service.requiredRole || currentUser?.role === service.requiredRole)
                .map(service => {
                  const tone = statusMap[service.status];
                  const Icon = service.Icon;
                  const isComingSoon = service.status === 'soon';
                  const isCardDisabled = isComingSoon;
                  const cardCtaCopy = isComingSoon ? 'Готовим к запуску' : 'Перейти в сервис';

                  const handleServiceClick = () => {
                    if (isComingSoon) {
                      return;
                    }
                    if (!currentUser && service.id === 'achievements') {
                      onNavigate('/login');
                      return;
                    }
                    onNavigate(service.path);
                  };

                  return (
                    <button
                      key={service.id}
                      type="button"
                      disabled={isCardDisabled}
                      onClick={handleServiceClick}
                      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white p-4 text-left text-text-primary shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_35px_70px_rgba(16,185,129,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-almond/30 sm:rounded-[26px] sm:p-5 ${
                        isCardDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex h-full flex-col">
                        <div className="sm:hidden space-y-3">
                          <div className="flex gap-3">
                            <div className={`flex h-10 w-10 min-w-[44px] items-center justify-center rounded-2xl bg-gradient-to-br ${service.iconAccent} text-white shadow-[0_16px_30px_rgba(16,185,129,0.35)]`}>
                              <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                              <h3 className="text-[0.9rem] font-semibold leading-tight text-brand-indigo">{service.title}</h3>
                              <span className={`rounded-full px-2 py-0.5 text-[0.58rem] font-semibold tracking-[0.28em] uppercase ${tone.tone}`}>
                                {tone.label}
                              </span>
                              <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                                {service.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-indigo">
                            {cardCtaCopy}
                            {!isCardDisabled && (
                              <span className="text-brand-almond transition-transform duration-300 group-hover:translate-x-1">→</span>
                            )}
                          </div>
                        </div>

                        <div className="hidden h-full flex-col sm:flex">
                          <div className="flex items-start gap-3">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br ${service.iconAccent} text-white shadow-[0_18px_35px_rgba(16,185,129,0.25)]`}>
                              <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                            <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold tracking-[0.3em] uppercase ${tone.tone}`}>
                              {tone.label}
                            </span>
                          </div>
                          <h3 className="mt-4 text-xl font-semibold leading-tight text-brand-indigo">{service.title}</h3>
                          <p className="mt-2 flex-1 text-sm text-text-secondary leading-relaxed">
                            {service.description}
                          </p>
                          <div className="mt-4 flex items-center gap-2 text-base font-semibold text-brand-indigo">
                            {cardCtaCopy}
                            {!isCardDisabled && (
                              <span className="text-brand-almond transition-transform duration-300 group-hover:translate-x-1">→</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pointer-events-none absolute inset-x-6 bottom-6 h-px bg-gradient-to-r from-transparent via-brand-almond/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </button>
                  );
                })}
            </div>
          </section>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />

      {isServicePromptVisible && (
        <div className="fixed left-1/2 z-40 w-full max-w-xl -translate-x-1/2 px-4 sm:px-0 top-[6.5rem] sm:top-[7rem]">
          <div className="mx-auto rounded-[24px] border border-emerald-200/80 bg-emerald-50/95 px-4 py-3 text-emerald-900 shadow-[0_25px_60px_rgba(16,185,129,0.25)]">
            <div className="flex items-start gap-3">
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-base font-semibold leading-snug sm:text-lg">Выберите сервис для продолжения</h2>
                <p className="mt-1 text-xs text-emerald-800 sm:text-sm">
                  Сервисы доступны в карточках ниже. Нажмите на нужный, чтобы перейти.
                </p>
              </div>
              <button
                type="button"
                aria-label="Скрыть подсказку"
                onClick={() => setIsServicePromptVisible(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-600 transition hover:bg-emerald-100"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationPage;
