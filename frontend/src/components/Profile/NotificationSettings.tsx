import React from 'react';
import { useUnit } from 'effector-react';
import Button from '../layout/Button/Button.tsx';
import { Tabs } from '../layout/Tabs/Tabs';
import {
  $notificationPreferences,
  $notificationPreferencesPending,
  loadNotificationPreferences,
  updateNotificationPreferences,
} from '../../models/notifications';
import type {
  NotificationCategory,
  NotificationPreferences,
} from '../../types/notification';

const CATEGORY_LABELS: Record<
  NotificationCategory,
  { title: string; description: string; emoji: string }
> = {
  orders: {
    title: 'Заказы столовой',
    description: 'Готовность блюд, задержки и статусы доставки',
    emoji: '🥗',
  },
  marketplace: {
    title: 'Маркетплейс услуг',
    description: 'Новые заявки, чаты исполнителей и сделки',
    emoji: '🛠️',
  },
  system: {
    title: 'Системные события',
    description: 'Обновления платформы и важные регламенты',
    emoji: '⚙️',
  },
  chat: {
    title: 'Чаты и поддержки',
    description: 'Сообщения из командных и прямых чатов',
    emoji: '💬',
  },
  balance: {
    title: 'Баланс и финансы',
    description: 'Пополнения, списания и лимиты',
    emoji: '💳',
  },
  topups: {
    title: 'Заявки на пополнение',
    description: 'Статусы запросов на увеличение лимитов',
    emoji: '📥',
  },
  events: {
    title: 'События',
    description: 'Напоминания и обновления по событиям',
    emoji: '🎟️',
  },
};

const CHANNEL_LABELS: Record<
  keyof NotificationPreferences['channels'],
  { title: string; description: string; status: 'live' | 'soon' }
> = {
  inApp: {
    title: 'Колокольчик и центр',
    description: 'Показываем мгновенно в интерфейсе',
    status: 'live',
  },
  email: {
    title: 'Email-рассылки',
    description: 'Бета-рассылки скоро подключим',
    status: 'soon',
  },
  push: {
    title: 'Push-уведомления',
    description: 'Телефон и браузер появятся после релиза',
    status: 'soon',
  },
};

const SETTINGS_TABS = [
  { id: 'categories', label: 'Категории' },
  { id: 'channels', label: 'Каналы' },
];

type SettingsTab = 'categories' | 'channels';

const createBasePreferences = (): NotificationPreferences => ({
  categories: {
    orders: true,
    marketplace: true,
    system: true,
    chat: true,
    balance: true,
    topups: true,
    events: true,
  },
  channels: {
    inApp: true,
    email: false,
    push: false,
  },
  soundEnabled: false,
  digestEnabled: false,
  quietHours: {
    enabled: false,
    from: '22:00',
    to: '08:00',
  },
  mutedUntil: null,
  timezone:
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC',
});

const mergeWithDefaults = (
  incoming?: NotificationPreferences | null
): NotificationPreferences => {
  const base = createBasePreferences();
  if (!incoming) {
    return base;
  }

  return {
    ...base,
    ...incoming,
    categories: {
      ...base.categories,
      ...incoming.categories,
    },
    channels: {
      ...base.channels,
      ...incoming.channels,
    },
    quietHours: {
      ...base.quietHours,
      ...incoming.quietHours,
    },
  };
};

const formatTimestamp = (iso: string | null) => {
  if (!iso) {
    return '';
  }
  return new Date(iso).toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
};

const NotificationSettings: React.FC = () => {
  const { preferences, isPending, fetchPreferences, savePreferences } = useUnit(
    {
      preferences: $notificationPreferences,
      isPending: $notificationPreferencesPending,
      fetchPreferences: loadNotificationPreferences,
      savePreferences: updateNotificationPreferences,
    }
  );

  const [formState, setFormState] = React.useState<NotificationPreferences>(
    () => createBasePreferences()
  );
  const [isDirty, setIsDirty] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] =
    React.useState<SettingsTab>('categories');
  const hasRequestedRef = React.useRef(false);
  const submittedRef = React.useRef(false);

  React.useEffect(() => {
    if (!hasRequestedRef.current) {
      hasRequestedRef.current = true;
      fetchPreferences();
    }
  }, [fetchPreferences]);

  React.useEffect(() => {
    if (preferences) {
      setFormState(mergeWithDefaults(preferences));
      setIsDirty(false);
      if (submittedRef.current) {
        submittedRef.current = false;
        setLastSavedAt(new Date().toISOString());
      }
    }
  }, [preferences]);

  const handleCategoryToggle = (category: NotificationCategory) => {
    setFormState(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category],
      },
    }));
    setIsDirty(true);
  };

  const handleChannelToggle = (
    channel: keyof NotificationPreferences['channels']
  ) => {
    if (channel !== 'inApp') {
      return;
    }

    setFormState(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel],
        email: false,
        push: false,
      },
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    submittedRef.current = true;
    savePreferences(formState);
  };

  const handleReset = () => {
    setFormState(mergeWithDefaults(preferences ?? null));
    setIsDirty(false);
  };

  const helperText = isPending
    ? 'Сохраняем обновления...'
    : lastSavedAt
      ? `Настройки синхронизированы в ${formatTimestamp(lastSavedAt)}`
      : 'Выбирайте, какие события напоминать и какими каналами.';

  const settingsTabIndex = Math.max(
    SETTINGS_TABS.findIndex(tab => tab.id === activeSettingsTab),
    0
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-6 py-6 shadow-[0_25px_60px_rgba(16,185,129,0.15)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-emerald-900">
              Настройки уведомлений
            </h2>
            <p className="mt-2 text-sm text-emerald-800/80">{helperText}</p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-white/80 px-5 py-4 text-sm text-emerald-900 shadow-inner">
            <p className="text-sm font-semibold text-emerald-900">
              Режим тестирования
            </p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-800">
              Каналы подключаем поэтапно. Сейчас активно только отображение
              внутри сервиса, email и push выйдут позже.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Tabs
            tabs={SETTINGS_TABS}
            activeTab={settingsTabIndex}
            onTabChange={index => {
              const nextTab = SETTINGS_TABS[index];
              setActiveSettingsTab(
                (nextTab?.id as SettingsTab) ?? 'categories'
              );
            }}
            variant="marketplace"
            wrap={false}
            className="max-w-md"
          />
        </div>
      </section>

      {activeSettingsTab === 'categories' ? (
        <section className="space-y-4">
          <div />
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(CATEGORY_LABELS).map(([category, meta]) => {
              const isActive =
                formState.categories[category as NotificationCategory];
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    handleCategoryToggle(category as NotificationCategory)
                  }
                  className={`group flex items-start gap-4 rounded-3xl border px-5 py-4 text-left transition-all duration-200 ${
                    isActive
                      ? 'border-emerald-400 bg-white shadow-[0_20px_45px_rgba(16,185,129,0.15)]'
                      : 'border-emerald-100 bg-white/60 hover:border-emerald-200'
                  }`}
                >
                  <div className="text-3xl" aria-hidden="true">
                    {meta.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-emerald-900">
                      {meta.title}
                    </p>
                    <p className="text-sm text-emerald-800/80">
                      {meta.description}
                    </p>
                    <span
                      className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${
                        isActive
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-emerald-100 text-emerald-500'
                      }`}
                    >
                      {isActive ? 'Включено' : 'Выключено'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div />
          <div className="grid gap-4 md:grid-cols-3">
            {(
              Object.keys(CHANNEL_LABELS) as Array<
                keyof NotificationPreferences['channels']
              >
            ).map(channel => {
              const meta = CHANNEL_LABELS[channel];
              const isActive = Boolean(formState.channels[channel]);
              const isDisabled = meta.status === 'soon';
              return (
                <div
                  key={channel}
                  className={`relative flex h-full flex-col rounded-3xl border px-5 py-4 transition-all ${
                    isActive
                      ? 'border-emerald-400 bg-white shadow-[0_18px_35px_rgba(16,185,129,0.18)]'
                      : 'border-emerald-100 bg-emerald-50/60'
                  } ${
                    isDisabled
                      ? 'opacity-70 cursor-not-allowed'
                      : 'cursor-pointer hover:border-emerald-300'
                  }`}
                  onClick={() => !isDisabled && handleChannelToggle(channel)}
                >
                  <p className="text-base font-semibold text-emerald-900">
                    {meta.title}
                  </p>
                  <p className="mt-2 flex-1 text-sm text-emerald-800/80">
                    {meta.description}
                  </p>
                  <span
                    className={`mt-4 inline-flex w-full items-center justify-center rounded-2xl border px-3 py-2 text-sm font-semibold ${
                      isActive
                        ? 'border-emerald-500 bg-white text-emerald-700'
                        : 'border-emerald-200 text-emerald-600'
                    }`}
                  >
                    {isDisabled
                      ? 'В разработке'
                      : isActive
                        ? 'Включено'
                        : 'Отключено'}
                  </span>
                  {isDisabled && (
                    <span className="absolute top-4 right-4 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600">
                      soon
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={!isDirty || isPending}
          onClick={handleSave}
          className="flex-1 min-w-[140px] sm:flex-none sm:min-w-[180px]"
        >
          {isPending ? 'Сохраняем...' : 'Сохранить изменения'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isPending || !isDirty}
          onClick={handleReset}
          className="flex-1 min-w-[140px] sm:flex-none sm:min-w-[180px]"
        >
          Сбросить изменения
        </Button>
        {isPending && (
          <span className="text-sm text-emerald-800">
            Синхронизируем с сервером...
          </span>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
