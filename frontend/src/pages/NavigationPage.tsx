import type { FC } from 'react';
import { AuthForm } from '../components/Auth/AuthForm.tsx';
import Button from '../components/layout/Button/Button.tsx';
import type { User } from '../types/user';

const services = [
  {
    id: 'cafeteria',
    title: 'Столовая ГАУ',
    description: 'Полноценный сервис заказа блюд, управление балансом и отслеживание доставки в реальном времени.',
    status: 'live',
    accent: 'from-brand-grape to-brand-indigo',
    icon: '🍽️',
    path: '/services/cafeteria',
  },
  {
    id: 'chat',
    title: 'Корпоративный чат',
    description: 'Создавайте тематические каналы, общайтесь с коллегами и получайте быстрый доступ к поддержке.',
    status: 'testing',
    accent: 'from-brand-indigo to-brand-lilac',
    icon: '💬',
    path: '/services/chat',
  },
  {
    id: 'notifications',
    title: 'Уведомления',
    description: 'Централизованные уведомления по заказам, поставкам, внутренним объявлениям и важным новостям.',
    status: 'soon',
    accent: 'from-amber-200 to-amber-400',
    icon: '🔔',
    path: '/services/notifications',
  },
  {
    id: 'marketplace',
    title: 'Маркетплейс услуг',
    description: 'Локальные сервисы сотрудников и партнёров: аренда, обучение, консультации и другие предложения.',
    status: 'testing',
    accent: 'from-orange-200 to-orange-400',
    icon: '🛠️',
    path: '/services/marketplace',
  },
  {
    id: 'events',
    title: 'Афиша событий',
    description: 'Календарь мероприятий университета, напоминания и быстрые регистрации на встречи и активности.',
    status: 'soon',
    accent: 'from-brand-almond to-brand-lilac',
    icon: '🎭',
    path: '/services/events',
  },
];

const statusMap: Record<string, { label: string; tone: string }> = {
  live: { label: 'Работает', tone: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  testing: { label: 'Тестируется', tone: 'bg-amber-50 text-amber-700 border border-amber-200' },
  soon: { label: 'В разработке', tone: 'bg-surface-muted text-text-secondary border border-border-subtle' },
};

type NavigationPageProps = {
  currentUser: User | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export const NavigationPage: FC<NavigationPageProps> = ({ currentUser, onNavigate, onLogout }) => {
  return (
    <div className="min-h-screen text-text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-brand-lilac mb-3">Единая цифровая платформа</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-brand-indigo">
              Экосистема сервисов ГАУ
            </h1>
            <p className="mt-4 text-text-secondary text-lg max-w-2xl">
              Все цифровые сервисы университета в одном месте. Один аккаунт, синхронизированные данные и бесшовный переход между продуктами.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onNavigate('/profile')}
                  className="bg-gradient-to-r from-brand-indigo to-brand-grape border-transparent shadow-lg shadow-brand-grape/25 hover:-translate-y-0.5"
                >
                  Профиль
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={onLogout}
                  className="border-brand-indigo/40 text-brand-indigo font-semibold shadow-lg shadow-brand-indigo/15 hover:bg-brand-indigo hover:text-white hover:-translate-y-0.5"
                >
                  Выйти
                </Button>
              </>
            ) : (
              <Button variant="primary" size="md" onClick={() => onNavigate('/login')}>
                Войти
              </Button>
            )}
          </div>
        </header>

        <div className="grid gap-10 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-border-subtle bg-white p-6 sm:p-8 shadow-brand-card">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-lilac uppercase tracking-[0.4em]">центральная консоль</p>
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
                const isDisabled = service.status === 'soon';
                return (
                  <button
                    key={service.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && onNavigate(service.path)}
                    className={`group relative overflow-hidden rounded-[28px] border border-transparent bg-gradient-to-br ${service.accent} p-6 text-left text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-brand-grape/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                      isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{service.icon}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-widest uppercase ${tone.tone}`}>
                        {tone.label}
                      </span>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold">{service.title}</h3>
                    <p className="mt-2 text-sm text-white/90 leading-relaxed line-clamp-3">
                      {service.description}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-white/90">
                      {isDisabled ? 'Готовим к запуску' : 'Перейти в сервис'}
                      {!isDisabled && (
                        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                      )}
                    </div>
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
                    <p className="text-sm uppercase tracking-[0.4em] text-brand-lilac">аккаунт активен</p>
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
                      className="w-full bg-gradient-to-r from-brand-indigo to-brand-grape border-transparent shadow-lg shadow-brand-grape/25 hover:-translate-y-0.5"
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
    </div>
  );
};

export default NavigationPage;
