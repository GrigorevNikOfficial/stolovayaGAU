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
  status: string;
};

const ServicePlaceholder: FC<PlaceholderProps> = ({ emoji, title, tagline, description, highlights, status }) => {
  return (
    <div className="min-h-screen text-text-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col gap-8 rounded-3xl border border-border-subtle bg-white p-8 shadow-brand-card">
          <div className="flex items-center gap-4 text-text-secondary">
            <span className="text-4xl" aria-hidden>
              {emoji}
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-text-muted">Сервис готовится</p>
              <h1 className="text-4xl font-semibold tracking-tight text-brand-indigo">{title}</h1>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-lg text-text-secondary">{tagline}</p>
              <p className="mt-4 text-sm text-text-secondary leading-relaxed">{description}</p>
            </div>
            <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.4em] text-text-muted">статус</p>
              <p className="mt-2 text-2xl font-semibold text-brand-indigo">{status}</p>
              <p className="mt-3 text-sm text-text-secondary">
                Мы синхронизируем учётные записи и инфраструктуру, чтобы этот сервис работал сразу с вашим текущим аккаунтом столовой.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map(item => (
              <div key={item} className="rounded-2xl border border-border-soft bg-white p-4 shadow-sm">
                <p className="text-sm text-text-secondary">{item}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Следите за обновлениями на главной навигационной странице. Мы сообщим о раннем доступе и пилотах.
            </p>
            <Button variant="outline" size="md" className="border-border-subtle text-text-primary" onClick={goToNavigation}>
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
    status="Внутреннее тестирование Q1 2025"
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
    status="Запуск пилота вместе с маркетплейсом"
  />
);
