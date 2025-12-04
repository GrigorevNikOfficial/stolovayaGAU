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
    accent: 'from-[#69e7b6] to-[#0d4a43]',
    icon: '🍽️',
    path: '/services/cafeteria',
  },
  {
    id: 'chat',
    title: 'Корпоративный чат',
    description: 'Создавайте тематические каналы, общайтесь с коллегами и получайте быстрый доступ к поддержке.',
    status: 'testing',
    accent: 'from-[#60a5fa] to-[#1e3a8a]',
    icon: '💬',
    path: '/services/chat',
  },
  {
    id: 'notifications',
    title: 'Уведомления',
    description: 'Централизованные уведомления по заказам, поставкам, внутренним объявлениям и важным новостям.',
    status: 'soon',
    accent: 'from-[#fcd34d] to-[#b45309]',
    icon: '🔔',
    path: '/services/notifications',
  },
  {
    id: 'marketplace',
    title: 'Маркетплейс услуг',
    description: 'Локальные сервисы сотрудников и партнёров: аренда, обучение, консультации и другие предложения.',
    status: 'soon',
    accent: 'from-[#fdba74] to-[#c2410c]',
    icon: '🛠️',
    path: '/services/marketplace',
  },
  {
    id: 'events',
    title: 'Афиша событий',
    description: 'Календарь мероприятий университета, напоминания и быстрые регистрации на встречи и активности.',
    status: 'soon',
    accent: 'from-[#c084fc] to-[#6b21a8]',
    icon: '🎭',
    path: '/services/events',
  },
];

const statusMap: Record<string, { label: string; tone: string }> = {
  live: { label: 'Работает', tone: 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30' },
  testing: { label: 'Тестируется', tone: 'bg-amber-400/20 text-amber-200 border border-amber-400/30' },
  soon: { label: 'В разработке', tone: 'bg-white/10 text-white/80 border border-white/20' },
};

type NavigationPageProps = {
  currentUser: User | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export const NavigationPage: FC<NavigationPageProps> = ({ currentUser, onNavigate, onLogout }) => {
  return (
    <div className="relative min-h-screen bg-[#030405] text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#030c0a] via-[#050607] to-[#05020b]" />
      <div className="absolute -top-1/3 right-0 w-[520px] h-[520px] bg-[#106157]/30 blur-[160px]" />
      <div className="absolute top-1/2 -left-20 w-[420px] h-[420px] bg-[#4c1d95]/20 blur-[160px]" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_60%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-3">Единая цифровая платформа</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
              Экосистема сервисов ГАУ
            </h1>
            <p className="mt-4 text-gray-300 text-lg max-w-2xl">
              Все цифровые сервисы университета в одном месте. Один аккаунт, синхронизированные данные и бесшовный переход между продуктами.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <Button variant="outline" size="md" onClick={() => onNavigate('/profile')} className="border border-white/30">
                  Профиль
                </Button>
                <Button variant="outline" size="md" onClick={onLogout} className="border border-white/30">
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
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-200 uppercase tracking-[0.4em]">центральная консоль</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Выберите сервис для продолжения</h2>
                  <p className="mt-4 text-gray-300">
                    Доступные продукты обновляются автоматически. Новые сервисы появятся в вашей панели без повторной регистрации.
                  </p>
                </div>
                {currentUser && (
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-gray-200">
                    <p className="text-white mb-1 font-semibold">
                      {currentUser.first_name} {currentUser.last_name}
                    </p>
                    <p className="text-gray-400">Статус аккаунта синхронизирован</p>
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
                    className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${service.accent} p-6 text-left shadow-lg transition-all duration-300 hover:translate-y-[-4px] hover:shadow-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                      isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{service.icon}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-widest uppercase ${tone.tone}`}>
                        {tone.label}
                      </span>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold text-white">{service.title}</h3>
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
            <div className="rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl p-6 sm:p-8">
              {currentUser ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.4em] text-emerald-200">аккаунт активен</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Вы уже авторизованы</h3>
                    <p className="mt-3 text-sm text-gray-300">
                      Можете сразу перейти в рабочие продукты. Все данные синхронизированы со столовой и будущими сервисами.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Button type="button" variant="primary" size="lg" className="w-full" onClick={() => onNavigate('/services/cafeteria')}>
                      Открыть столовую
                    </Button>
                    <Button type="button" variant="outline" size="md" className="w-full border-white/30" onClick={() => onNavigate('/profile')}>
                      Перейти в профиль
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm uppercase tracking-[0.4em] text-gray-400 mb-4">единый вход</p>
                  <AuthForm variant="embedded" />
                </>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6">
              <p className="text-xs uppercase tracking-[0.4em] text-gray-400">дорожная карта</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Новые сервисы появятся поэтапно</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
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
