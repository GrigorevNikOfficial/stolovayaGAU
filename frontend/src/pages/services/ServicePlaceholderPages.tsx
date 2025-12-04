import type { FC } from 'react';
import Button from '../../components/layout/Button/Button.tsx';

const goToNavigation = () => {
  window.history.pushState({}, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
};

type PlaceholderProps = {
  emoji: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  gradient: string;
  status: string;
};

const ServicePlaceholder: FC<PlaceholderProps> = ({ emoji, title, tagline, description, highlights, gradient, status }) => {
  return (
    <div className="relative min-h-screen bg-[#050607] text-white overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.45),_transparent_60%)]" />
      <div className="absolute top-10 right-[-120px] w-[420px] h-[420px] bg-white/10 blur-[180px]" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col gap-8 rounded-3xl border border-white/15 bg-black/30 backdrop-blur-xl p-8 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-4 text-white/80">
            <span className="text-4xl" aria-hidden>
              {emoji}
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">Сервис готовится</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white">{title}</h1>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-lg text-white/80">{tagline}</p>
              <p className="mt-4 text-sm text-white/70 leading-relaxed">{description}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">статус</p>
              <p className="mt-2 text-2xl font-semibold text-white">{status}</p>
              <p className="mt-3 text-sm text-white/70">
                Мы синхронизируем учётные записи и инфраструктуру, чтобы этот сервис работал сразу с вашим текущим аккаунтом столовой.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map(item => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/80">{item}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/70">
              Следите за обновлениями на главной навигационной странице. Мы сообщим о раннем доступе и пилотах.
            </p>
            <Button variant="outline" size="md" className="border-white/40" onClick={goToNavigation}>
              Вернуться в навигацию
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatServicePage: FC = () => (
  <ServicePlaceholder
    emoji="💬"
    title="Корпоративный чат"
    tagline="Общайтесь с командами, создавайте проектные каналы и получайте поддержку без переключения между приложениями."
    description="Мы строим чат на той же платформе авторизации, что и столовая. Вы сможете использовать единый профиль, видеть статусы коллег и мгновенно обсуждать оперативные вопросы."
    highlights={[
      'Общие и приватные каналы, закрепы и реакции',
      'Интеграция с уведомлениями и карточками заказов',
      'Безопасное хранение истории сообщений',
      'Десктоп и мобильные клиенты в 2025 году',
    ]}
    gradient="from-[#09101a] via-[#030508] to-[#010203]"
    status="MVP планируется к лету 2025"
  />
);

export const NotificationsServicePage: FC = () => (
  <ServicePlaceholder
    emoji="🔔"
    title="Центр уведомлений"
    tagline="Все события в одном канале: заказы, поставки, внутренние объявления и персональные задачи."
    description="Новый центр уведомлений объединит push, email и in-app сообщения. Алгоритм приоритизирует важное и хранит историю событий, связанную с вашим аккаунтом."
    highlights={[
      'Лента событий со смарт-фильтрами',
      'Push-уведомления и webhooks для интеграций',
      'Режим Do Not Disturb и расписания',
      'Синхронизация с чатами и маркетплейсом',
    ]}
    gradient="from-[#0e0a02] via-[#140d02] to-[#020100]"
    status="Внутреннее тестирование Q1 2025"
  />
);

export const MarketplaceServicePage: FC = () => (
  <ServicePlaceholder
    emoji="🛠️"
    title="Маркетплейс услуг"
    tagline="Единая площадка для сервисов сотрудников и партнёров: обучение, аренда, бытовая помощь и многое другое."
    description="Мы разрабатываем безопасный каталог предложений с отзывами, встроенными платежами и контрактами. Все авторы проходят верификацию через корпоративный SSO."
    highlights={[
      'Категории услуг и быстрый поиск',
      'Встроенные заявки и чат с исполнителем',
      'Гарантированные платежи и баланс',
      'Личный кабинет исполнителя',
    ]}
    gradient="from-[#1b0a02] via-[#2c1204] to-[#040100]"
    status="Дизайн-спринт запланирован на Q2 2025"
  />
);

export const EventsServicePage: FC = () => (
  <ServicePlaceholder
    emoji="🎭"
    title="Афиша событий"
    tagline="Освежённый календарь жизни университета: лекции, концерты, спортивные активности и внутренние митапы."
    description="Сервис позволит отмечаться на события, получать пропуска и напоминания, а также синхронизировать расписание с календарями."
    highlights={[
      'Интерактивный календарь и карта площадок',
      'Регистрация по QR и гостевые списки',
      'Подбор событий по интересам',
      'Интеграция с чатами и уведомлениями',
    ]}
    gradient="from-[#120216] via-[#200433] to-[#030104]"
    status="Запуск пилота вместе с маркетплейсом"
  />
);
