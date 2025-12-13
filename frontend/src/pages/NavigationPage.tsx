import { type FC } from 'react';
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
    label: 'Демо',
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
    status: 'testing',
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
};

export const NavigationPage: FC<NavigationPageProps> = ({
  currentUser,
  onNavigate,
}) => {
  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase() ||
      'U'
    : '';
  const balanceLabel = currentUser ? formatBalance(currentUser.balance) : '';

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
                <span
                  className="max-w-[72px] truncate text-sm font-semibold text-emerald-800 sm:max-w-[140px] sm:text-base"
                  title={balanceLabel}
                >
                  {balanceLabel}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-6 sm:w-6">
                  +
                </span>
              </button>
              <NotificationBell />
              <button
                type="button"
                onClick={() => onNavigate('/profile')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-all duration-200 hover:border-emerald-300 hover:text-emerald-600 sm:h-11 sm:w-11"
                aria-label="Профиль"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-brand-indigo text-sm font-semibold text-white sm:h-10 sm:w-10">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Аватар"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    userInitials
                  )}
                </span>
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
              <h2 className="text-3xl font-semibold text-brand-indigo">
                Сервисы Studmi
              </h2>
            </div>

            <div
              id="services-grid"
              className="grid grid-cols-2 gap-3 auto-rows-fr sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
            >
              {services
                .filter(
                  service =>
                    !service.requiredRole ||
                    currentUser?.role === service.requiredRole
                )
                .map(service => {
                  const tone = statusMap[service.status];
                  const Icon = service.Icon;
                  const isComingSoon = service.status === 'soon';
                  const isCardDisabled = isComingSoon;

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
                        isCardDisabled
                          ? 'opacity-70 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex h-full flex-col">
                        <div className="sm:hidden space-y-3">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br ${service.iconAccent} text-white shadow-[0_16px_30px_rgba(16,185,129,0.35)]`}
                            >
                              <Icon
                                className="h-6 w-6 text-white"
                                aria-hidden="true"
                              />
                            </div>
                            <h3 className="text-[1rem] font-semibold leading-snug text-brand-indigo break-words">
                              {service.title}
                            </h3>
                            <span
                              className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-[0.18em] uppercase leading-none whitespace-nowrap ${tone.tone}`}
                            >
                              {tone.label}
                            </span>
                          </div>
                        </div>

                        <div className="hidden h-full flex-col sm:flex">
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br ${service.iconAccent} text-white shadow-[0_18px_35px_rgba(16,185,129,0.25)]`}
                            >
                              <Icon
                                className="h-6 w-6 text-white"
                                aria-hidden="true"
                              />
                            </div>
                            <span
                              className={`ml-auto inline-flex w-fit items-center rounded-full px-3 py-1 text-[0.7rem] font-semibold tracking-[0.2em] uppercase leading-none whitespace-nowrap ${tone.tone}`}
                            >
                              {tone.label}
                            </span>
                          </div>
                          <h3 className="mt-4 text-xl font-semibold leading-tight text-brand-indigo break-words">
                            {service.title}
                          </h3>
                          <p className="mt-2 flex-1 text-sm text-text-secondary leading-relaxed">
                            {service.description}
                          </p>
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
    </div>
  );
};

export default NavigationPage;
