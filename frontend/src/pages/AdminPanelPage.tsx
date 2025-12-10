import { useUnit } from 'effector-react';
import React from 'react';
import { analyticsApi } from '../api/analytics';
import { settingsApi } from '../api/settings';
import Button from '../components/layout/Button/Button';
import Input from '../components/layout/Input/Input';
import NotificationBell from '../components/Notifications/NotificationBell.tsx';
import { Settings } from '../components/Settings/Settings';
import { UserBalances } from '../components/Settings/UserBalances';
import { TopUpRequestsAdmin } from '../components/TopUpRequests/TopUpRequestsAdmin';
import { showToast } from '../components/layout/Toast/stores/toastStore';
import { onSocketEvent } from '../lib/socket';
import LogoSAU from '../images/logo.jpg';
import { $currentUser, logout } from '../models/users';
import type { MarketplaceSettings } from '../types/settings';
import { formatBalance } from '../utils/formatBalance';
import {
  addServiceTagToStorage,
  getStoredServiceTags,
  SERVICE_TAG_STORAGE_KEY,
} from '../utils/serviceTags';
import type {
  AdminAnalyticsResponse,
  AnalyticsModuleId,
  AnalyticsRangeOption,
} from '../types/analytics';

type AdminSectionId = 'marketplace' | 'cafeteria' | 'finances' | 'analytics';

type FinanceTabId = 'balances' | 'topups';

type AdminSection = {
  id: AdminSectionId;
  label: string;
};

type FinanceTab = {
  id: FinanceTabId;
  label: string;
};

type PlaceholderCardProps = {
  title: string;
  description: string;
};

type AnalyticsModuleMeta = {
  label: string;
  description: string;
  accent: string;
};

type AnalyticsRangeOptionMeta = {
  label: string;
  value: AnalyticsRangeOption;
};

type AnalyticsSparklineProps = {
  values: number[];
  accent?: string;
  height?: number;
};

type AnalyticsBarChartItem = {
  id: AnalyticsModuleId;
  label: string;
  value: number;
};

type AnalyticsBarChartProps = {
  data: AnalyticsBarChartItem[];
  activeId?: AnalyticsModuleId;
  onSelect?: (id: AnalyticsModuleId) => void;
};

const ADMIN_SECTIONS: AdminSection[] = [
  { id: 'marketplace', label: 'Маркетплейс' },
  { id: 'cafeteria', label: 'Еда' },
  { id: 'finances', label: 'Финансы' },
  { id: 'analytics', label: 'Аналитика' },
];

const FINANCE_TABS: FinanceTab[] = [
  { id: 'balances', label: 'Балансы' },
  { id: 'topups', label: 'Пополнения' },
];

const ANALYTICS_RANGE_OPTIONS: AnalyticsRangeOptionMeta[] = [
  { label: '7 дней', value: 7 },
  { label: '30 дней', value: 30 },
];

const ANALYTICS_MODULE_META: Record<AnalyticsModuleId, AnalyticsModuleMeta> = {
  services: {
    label: 'Услуги',
    description: 'Заявки и исполнители',
    accent: '#4F46E5',
  },
  cafeteria: {
    label: 'Еда',
    description: 'Кафе и витрина',
    accent: '#10B981',
  },
  finance: {
    label: 'Финансы',
    description: 'Переводы и пополнения',
    accent: '#F97316',
  },
};

const valueFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
});

const shareFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const formatValue = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return valueFormatter.format(Math.round(value));
};

const formatShare = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }
  return shareFormatter.format(value);
};

const formatTimelineDay = (label?: string, fallbackIndex = 0) => {
  if (label) {
    const date = new Date(label);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    }
  }
  return `День ${fallbackIndex + 1}`;
};

const PlaceholderCard: React.FC<PlaceholderCardProps> = ({ title, description }) => (
  <div className="rounded-3xl border border-dashed border-border-soft bg-surface-muted/50 px-5 py-6 text-center">
    <p className="text-base font-semibold text-text-primary">{title}</p>
    <p className="mt-1 text-sm text-text-secondary">{description}</p>
  </div>
);

const AnalyticsSparkline: React.FC<AnalyticsSparklineProps> = ({ values, accent = '#4F46E5', height = 120 }) => {
  if (!values.length) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded-2xl border border-dashed border-border-soft text-sm text-text-muted">
        Нет данных для графика
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const viewportWidth = 100;
  const viewportHeight = 100;
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * viewportWidth;
      const normalized = (value - min) / range;
      const y = viewportHeight - normalized * viewportHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const gradientId = React.useId();

  return (
    <svg viewBox={`0 0 ${viewportWidth} ${viewportHeight}`} height={height} className="w-full">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={accent}
        strokeWidth={2.2}
        strokeLinecap="round"
        points={points}
      />
      <polygon
        fill={`url(#${gradientId})`}
        stroke="none"
        points={`${points} ${viewportWidth},${viewportHeight} 0,${viewportHeight}`}
      />
    </svg>
  );
};
const AnalyticsBarChart: React.FC<AnalyticsBarChartProps> = ({ data, activeId, onSelect }) => {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border-soft px-4 py-3 text-sm text-text-muted">
        Нет данных для выбранного периода
      </div>
    );
  }

  const max = Math.max(...data.map(item => item.value), 1);

  return (
    <div className="space-y-3">
      {data.map(item => {
        const isActive = activeId ? item.id === activeId : false;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item.id)}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
              isActive
                ? 'border-brand-indigo/50 bg-brand-indigo/5 shadow-[0_10px_30px_rgba(79,70,229,0.15)]'
                : 'border-border-soft bg-white hover:border-brand-indigo/40'
            }`}
          >
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{item.label}</span>
              <span className="font-semibold text-text-primary">{formatShare(item.value)}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-surface-muted">
              <div
                className={`h-full rounded-full ${isActive ? 'bg-brand-indigo' : 'bg-brand-indigo/40'}`}
                style={{ width: `${max === 0 ? 0 : (item.value / max) * 100}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export const AdminPanelPage: React.FC = () => {
  const { currentUser, handleLogout } = useUnit({
    currentUser: $currentUser,
    handleLogout: logout,
  });
  const isAdmin = currentUser?.role === 'admin';
  const [activeSection, setActiveSection] = React.useState<AdminSectionId>('marketplace');
  const [marketplaceSettings, setMarketplaceSettings] = React.useState<MarketplaceSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(false);
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);
  const [commissionInput, setCommissionInput] = React.useState('');
  const [financeTab, setFinanceTab] = React.useState<FinanceTabId>('balances');
  const [customTags, setCustomTags] = React.useState<string[]>(() => getStoredServiceTags());
  const [tagDraft, setTagDraft] = React.useState('');
  const [analyticsData, setAnalyticsData] = React.useState<AdminAnalyticsResponse | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = React.useState(false);
  const [analyticsError, setAnalyticsError] = React.useState<string | null>(null);
  const [activeAnalyticsModule, setActiveAnalyticsModule] = React.useState<AnalyticsModuleId>('services');
  const [analyticsRange, setAnalyticsRange] = React.useState<AnalyticsRangeOption>(7);
  const analyticsRequestId = React.useRef(0);

  const handleNavigate = React.useCallback((path: string) => {
    const nextUrl = new URL(path, window.location.origin);
    window.history.pushState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const handleLogoutClick = React.useCallback(() => {
    handleLogout();
    setTimeout(() => {
      handleNavigate('/');
    }, 100);
  }, [handleLogout, handleNavigate]);

  const handleProfileNavigate = React.useCallback(() => {
    handleNavigate('/profile');
  }, [handleNavigate]);

  const handleAnalyticsModuleSelect = React.useCallback((moduleId: AnalyticsModuleId) => {
    setActiveAnalyticsModule(prev => (prev === moduleId ? prev : moduleId));
  }, []);

  const handleAnalyticsRangeChange = React.useCallback((nextRange: AnalyticsRangeOption) => {
    setAnalyticsRange(prev => (prev === nextRange ? prev : nextRange));
  }, []);

  const fetchAnalytics = React.useCallback(
    async (moduleId: AnalyticsModuleId, rangeValue: AnalyticsRangeOption) => {
      const requestId = ++analyticsRequestId.current;
      setIsLoadingAnalytics(true);
      setAnalyticsError(null);
      try {
        const response = await analyticsApi.getAdminAnalytics({ module: moduleId, range: rangeValue });
        if (analyticsRequestId.current !== requestId) {
          return;
        }
        setAnalyticsData(response);
      } catch (error: any) {
        if (analyticsRequestId.current !== requestId) {
          return;
        }
        const message = error?.response?.data?.message ?? error?.message ?? 'Не удалось загрузить аналитику';
        setAnalyticsError(message);
        showToast({ message, type: 'error' });
      } finally {
        if (analyticsRequestId.current === requestId) {
          setIsLoadingAnalytics(false);
        }
      }
    },
    []
  );

  React.useEffect(() => {
    if (!isAdmin) {
      return;
    }
    fetchAnalytics(activeAnalyticsModule, analyticsRange).catch(() => {});
  }, [isAdmin, activeAnalyticsModule, analyticsRange, fetchAnalytics]);
  React.useEffect(() => {
    if (!isAdmin) {
      setMarketplaceSettings(null);
      setCommissionInput('');
      return;
    }

    let isActive = true;
    setIsLoadingSettings(true);

    settingsApi
      .getMarketplaceSettings()
      .then(response => {
        if (!isActive) {
          return;
        }
        setMarketplaceSettings(response);
        setCommissionInput(response.marketplaceCommissionPercent.toString());
      })
      .catch(error => {
        if (!isActive) {
          return;
        }
        showToast({ message: error.message || 'Не удалось загрузить настройки маркетплейса', type: 'error' });
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingSettings(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isAdmin]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== SERVICE_TAG_STORAGE_KEY) {
        return;
      }
      setCustomTags(getStoredServiceTags());
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  React.useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const unsubscribe = onSocketEvent('marketplace:settings:updated', (payload: Partial<MarketplaceSettings>) => {
      setMarketplaceSettings(prev => {
        const next: MarketplaceSettings = {
          marketplaceCommissionPercent:
            payload.marketplaceCommissionPercent ?? prev?.marketplaceCommissionPercent ?? 0,
          marketplaceBalance: payload.marketplaceBalance ?? prev?.marketplaceBalance ?? 0,
        };
        return next;
      });

      if (typeof payload.marketplaceCommissionPercent === 'number') {
        setCommissionInput(payload.marketplaceCommissionPercent.toString());
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isAdmin]);

  const handleMarketplaceSettingsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdmin) {
      return;
    }

    const parsedValue = Number(commissionInput);

    if (Number.isNaN(parsedValue) || parsedValue < 0 || parsedValue > 100) {
      showToast({ message: 'Комиссия должна быть числом от 0 до 100%', type: 'error' });
      return;
    }

    try {
      setIsSavingSettings(true);
      const updated = await settingsApi.updateMarketplaceSettings({
        marketplaceCommissionPercent: parsedValue,
      });
      setMarketplaceSettings(updated);
      setCommissionInput(updated.marketplaceCommissionPercent.toString());
      showToast({ message: 'Комиссия обновлена', type: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Не удалось обновить комиссию', type: 'error' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddCustomTag = React.useCallback(() => {
    const result = addServiceTagToStorage(tagDraft);
    if (!result.success) {
      if (result.reason === 'exists') {
        showToast({ message: 'Такой тег уже есть в подсказках', type: 'error' });
      } else {
        showToast({ message: 'Введите название тега', type: 'error' });
      }
      return;
    }
    setCustomTags(result.tags);
    setTagDraft('');
    showToast({ message: 'Тег добавлен', type: 'success' });
  }, [tagDraft]);

  const commissionValue = Number(commissionInput);
  const isCommissionValid = !Number.isNaN(commissionValue) && commissionValue >= 0 && commissionValue <= 100;
  const isCommissionDirty = marketplaceSettings
    ? commissionValue !== marketplaceSettings.marketplaceCommissionPercent
    : commissionInput.trim().length > 0;

  if (!currentUser || !isAdmin) {
    return null;
  }

  const balanceLabel = formatBalance(currentUser.balance);
  const platformBalanceLabel = formatBalance(marketplaceSettings?.marketplaceBalance ?? 0, { withDecimals: true });

  const renderMarketplaceSection = () => (
    <div className="space-y-8">
      <section className="rounded-[36px] border border-border-soft bg-white p-6 shadow-brand-card">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-brand-indigo/70">баланс платформы</p>
            <h3 className="mt-3 text-4xl font-semibold text-brand-indigo">{platformBalanceLabel}</h3>
            <p className="mt-2 text-sm text-brand-indigo/80">
              Текущая комиссия: {marketplaceSettings?.marketplaceCommissionPercent ?? '—'}%
            </p>
          </div>
          <div className="grid gap-3 text-sm text-brand-indigo">
            <div className="rounded-2xl border border-border-soft bg-surface-muted/60 px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.35em] text-brand-indigo/60">онлайн-синхронизация</p>
              <p className="mt-1 text-base font-semibold text-brand-indigo">WebSocket активен</p>
            </div>
            <div className="rounded-2xl border border-border-soft bg-surface-muted/60 px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.35em] text-brand-indigo/60">операции</p>
              <p className="mt-1 text-base font-semibold text-brand-indigo">
                {marketplaceSettings ? 'Комиссии удерживаются автоматически' : 'Данные недоступны'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-text-muted">комиссия маркетплейса</p>
              <h3 className="mt-2 text-2xl font-semibold text-brand-indigo">Управление удержаниями</h3>
            </div>
            <span className="rounded-full border border-brand-indigo/30 px-3 py-1 text-xs font-semibold text-brand-indigo">
              Только админ
            </span>
          </div>

          {isLoadingSettings ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border-soft px-4 py-3 text-sm text-text-secondary">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-indigo/20 border-t-brand-indigo"></div>
              Загружаем настройки...
            </div>
          ) : !marketplaceSettings ? (
            <PlaceholderCard
              title="Настройки недоступны"
              description="Перезагрузите страницу или попробуйте позже."
            />
          ) : (
            <form className="mt-6 space-y-5" onSubmit={handleMarketplaceSettingsSubmit}>
              <label className="block text-sm font-medium text-text-primary">
                Комиссия, %
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commissionInput}
                  onChange={event => setCommissionInput(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border-soft bg-surface-muted px-4 py-3 text-base text-text-primary focus:border-brand-indigo focus:outline-none focus:ring-2 focus:ring-brand-indigo/20"
                  placeholder="15"
                />
              </label>
              <p className="text-sm text-text-secondary">
                Комиссия удерживается при создании заявки и автоматически зачисляется на баланс платформы.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!isCommissionValid || !isCommissionDirty || isSavingSettings}
                >
                  {isSavingSettings ? 'Сохраняем…' : 'Сохранить'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() =>
                    marketplaceSettings &&
                    setCommissionInput(marketplaceSettings.marketplaceCommissionPercent.toString())
                  }
                  disabled={isSavingSettings}
                >
                  Сбросить изменения
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-5 rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.4em] text-text-muted">как работает баланс</p>
          <ul className="space-y-4 text-sm text-text-secondary">
            <li className="rounded-2xl border border-border-soft px-4 py-3">
              <strong className="text-text-primary">1. Создание заявки</strong> — комиссия удерживается сразу и попадает на баланс.
            </li>
            <li className="rounded-2xl border border-border-soft px-4 py-3">
              <strong className="text-text-primary">2. Отмена</strong> — при возврате средств комиссия автоматически списывается с баланса платформы.
            </li>
            <li className="rounded-2xl border border-border-soft px-4 py-3">
              <strong className="text-text-primary">3. Мониторинг</strong> — данные синхронизируются между всеми открытыми админскими окнами без перезагрузки.
            </li>
          </ul>
          <div className="rounded-2xl border border-brand-indigo/30 bg-brand-indigo/5 px-4 py-3 text-sm text-brand-indigo">
            Если баланс изменился неожиданно, проверьте историю заявок: каждая операция оставляет запись в Transaction.
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-700">панель администратора</p>
            <h3 className="mt-2 text-2xl font-semibold text-emerald-900">Теги услуг</h3>
            <p className="mt-1 text-sm text-emerald-900/80">Добавляйте новые подсказки, чтобы авто-поле быстрее предлагало свежие навыки.</p>
          </div>
          <span className="rounded-full border border-emerald-400 px-3 py-1 text-xs font-semibold text-emerald-800">Видно только администраторам</span>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input value={tagDraft} onChange={setTagDraft} placeholder="Например, Product design" />
          <Button
            type="button"
            variant="primary"
            className="sm:min-w-[180px]"
            onClick={handleAddCustomTag}
            disabled={!tagDraft.trim()}
          >
            Добавить тег
          </Button>
        </div>
        {customTags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {customTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-sm font-medium text-emerald-800"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-emerald-900/80">Пока нет пользовательских тегов. Добавьте первый тег, чтобы коллеги увидели его в подсказках.</p>
        )}
        <p className="mt-4 text-xs uppercase tracking-[0.35em] text-emerald-700">синхронизация</p>
        <p className="text-sm text-emerald-900/80">Список автоматически появится в разделе «Услуги» у всех пользователей после обновления страницы.</p>
      </section>
    </div>
  );

  const renderCafeteriaSection = () => (
    <section className="rounded-[36px] border border-border-soft bg-white p-6 shadow-brand-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-3xl font-semibold text-brand-indigo">Еда</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Оперативно управляйте меню, доставкой и служебными уведомлениями в одном модуле.
          </p>
        </div>
      </div>
      <Settings />
    </section>
  );

  const renderFinancesSection = () => (
    <div className="space-y-8">
      <section className="rounded-[36px] border border-border-soft bg-white p-6 shadow-brand-card">
        <div>
          <h3 className="text-3xl font-semibold text-brand-indigo">Финансы</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Контролируйте балансы пользователей и входящие заявки на пополнение без переключения вкладок.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {FINANCE_TABS.map(tab => {
            const isActive = financeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFinanceTab(tab.id)}
                className={`group relative flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'border-emerald-400/70 bg-emerald-50 text-emerald-800 shadow-[0_18px_45px_rgba(16,185,129,0.2)]'
                    : 'border-transparent bg-transparent text-text-secondary hover:text-emerald-600'
                } cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30`}
              >
                <span>{tab.label}</span>
                <span
                  className={`pointer-events-none absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all duration-300 ${
                    isActive
                      ? 'scale-x-100 opacity-100'
                      : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-70'
                  }`}
                />
              </button>
            );
          })}
        </div>
        <div className="mt-6 rounded-[32px] border border-border-soft bg-surface-muted/40 p-4 sm:p-6">
          {financeTab === 'balances' ? <UserBalances /> : <TopUpRequestsAdmin />}
        </div>
      </section>
    </div>
  );

  const renderAnalyticsSection = () => {
    const summaryCards = analyticsData?.summaryCards ?? [];
    const moduleShare = analyticsData?.moduleShare ?? [];
    const checklist = analyticsData?.checklist ?? [];
    const timeline = analyticsData?.timeline;
    const periodMeta = analyticsData?.period;
    const selectedModulePayload = analyticsData?.selectedModule;
    const selectedModuleId = selectedModulePayload?.id ?? activeAnalyticsModule;
    const selectedModuleMeta = ANALYTICS_MODULE_META[selectedModuleId] ?? ANALYTICS_MODULE_META.services;
    const selectedShare = moduleShare.find(item => item.id === selectedModuleId)?.value ?? 0;
    const selectedSeries = selectedModulePayload?.timeline ?? [];
    const selectedTotal = selectedModulePayload?.total ?? 0;
    const selectedAverage = selectedModulePayload?.averagePerDay ?? 0;
    const selectedLast =
      selectedModulePayload?.lastValue ?? (selectedSeries.length ? selectedSeries[selectedSeries.length - 1] : 0);
    const rangeLabel = ANALYTICS_RANGE_OPTIONS.find(option => option.value === analyticsRange)?.label ?? '7 дней';
    const showSummarySkeleton = isLoadingAnalytics && !analyticsData;
    const showErrorState = Boolean(analyticsError) && !analyticsData;
    const hasData = Boolean(analyticsData);

    const timelineLabels = timeline?.labels ?? [];
    const servicesTimeline = timeline?.services ?? [];
    const cafeteriaTimeline = timeline?.cafeteria ?? [];
    const financeTimeline = timeline?.finance ?? [];
    const combinedLength = Math.max(
      timelineLabels.length,
      servicesTimeline.length,
      cafeteriaTimeline.length,
      financeTimeline.length
    );
    const recentEntries = Array.from({ length: combinedLength }).map((_, index) => ({
      label: timelineLabels[index],
      services: servicesTimeline[index] ?? 0,
      cafeteria: cafeteriaTimeline[index] ?? 0,
      finance: financeTimeline[index] ?? 0,
    }));
    const lastEntries = recentEntries.slice(-3);

    const formatPeriodDate = (value?: string) => {
      if (!value) {
        return '';
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    };

    const periodCaption = periodMeta ? `${formatPeriodDate(periodMeta.start)} — ${formatPeriodDate(periodMeta.end)}` : '—';

    return (
      <div className="space-y-8">
        <section className="rounded-[36px] border border-border-soft bg-white p-6 shadow-brand-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-text-muted">сводка</p>
              <h3 className="mt-2 text-3xl font-semibold text-brand-indigo">Пульс сервисов</h3>
              <p className="mt-1 text-sm text-text-secondary">
                {periodCaption} · {rangeLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-full border border-border-soft bg-surface-muted/60 p-1 text-xs font-semibold">
                {ANALYTICS_RANGE_OPTIONS.map(option => {
                  const isActive = analyticsRange === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAnalyticsRangeChange(option.value)}
                      className={`rounded-full px-3 py-1 transition ${
                        isActive ? 'bg-white text-brand-indigo shadow-sm' : 'text-text-secondary'
                      }`}
                      aria-pressed={isActive}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fetchAnalytics(activeAnalyticsModule, analyticsRange)}
                disabled={isLoadingAnalytics}
              >
                {isLoadingAnalytics ? 'Обновляем…' : 'Обновить'}
              </Button>
            </div>
          </div>
          {analyticsError && analyticsData ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Не удалось обновить последние данные: {analyticsError}. Показаны сохранённые значения.
            </div>
          ) : null}
          {showSummarySkeleton ? (
            <div className="mt-6 flex items-center gap-3 rounded-3xl border border-border-soft px-5 py-4 text-sm text-text-secondary">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-indigo/20 border-t-brand-indigo" />
              Загрузка аналитики…
            </div>
          ) : showErrorState ? (
            <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
              <p className="text-base font-semibold text-rose-900">Не удалось загрузить аналитику</p>
              <p className="mt-1">{analyticsError}</p>
              <Button
                className="mt-4"
                type="button"
                variant="primary"
                size="sm"
                onClick={() => fetchAnalytics(activeAnalyticsModule, analyticsRange)}
              >
                Повторить попытку
              </Button>
            </div>
          ) : hasData ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {summaryCards.map(card => {
                const diffNegative = card.diff.trim().startsWith('-');
                return (
                  <div key={card.id} className="rounded-3xl border border-border-soft bg-surface-muted/60 px-5 py-4 shadow-inner">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-muted">{card.title}</p>
                    <p className="mt-3 text-3xl font-semibold text-brand-indigo">{formatValue(card.value)}</p>
                    <p className={`text-sm ${diffNegative ? 'text-rose-600' : 'text-emerald-600'}`}>{card.diff}</p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>

        {hasData ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5 rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-text-muted">модули</p>
                    <h4 className="mt-2 text-2xl font-semibold text-brand-indigo">{selectedModuleMeta.label}</h4>
                    <p className="text-sm text-text-secondary">{selectedModuleMeta.description}</p>
                  </div>
                  <span className="rounded-full border border-brand-indigo/20 px-3 py-1 text-xs font-semibold text-brand-indigo">
                    {formatShare(selectedShare)}% активности
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ANALYTICS_MODULE_META) as AnalyticsModuleId[]).map(moduleId => {
                    const meta = ANALYTICS_MODULE_META[moduleId];
                    const isActive = moduleId === selectedModuleId;
                    return (
                      <button
                        key={moduleId}
                        type="button"
                        onClick={() => handleAnalyticsModuleSelect(moduleId)}
                        className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${
                          isActive
                            ? 'border-brand-indigo/60 bg-brand-indigo/5 text-brand-indigo shadow-sm'
                            : 'border-border-soft text-text-secondary hover:border-brand-indigo/40'
                        }`}
                      >
                        <span className="block font-semibold text-text-primary">{meta.label}</span>
                        <span className="text-xs text-text-secondary">{meta.description}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-[28px] border border-border-soft bg-surface-muted/60 p-4">
                  <AnalyticsSparkline values={selectedSeries} accent={selectedModuleMeta.accent} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border-soft bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-muted">итого</p>
                    <p className="text-2xl font-semibold text-brand-indigo">{formatValue(selectedTotal)}</p>
                  </div>
                  <div className="rounded-2xl border border-border-soft bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-muted">в день</p>
                    <p className="text-2xl font-semibold text-brand-indigo">{formatValue(selectedAverage)}</p>
                  </div>
                  <div className="rounded-2xl border border-border-soft bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-muted">последние</p>
                    <p className="text-2xl font-semibold text-brand-indigo">{formatValue(selectedLast)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-text-muted">распределение спроса</p>
                    <h4 className="mt-2 text-xl font-semibold text-brand-indigo">Использование модулей</h4>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-indigo/70">{rangeLabel}</span>
                </div>
                <AnalyticsBarChart data={moduleShare} activeId={selectedModuleId} onSelect={handleAnalyticsModuleSelect} />
                <div className="rounded-2xl border border-border-soft bg-surface-muted/60 px-4 py-3 text-sm text-text-secondary">
                  <p>
                    {selectedModuleMeta.label} удерживает {formatShare(selectedShare)}% активности. Переключитесь по карточкам, чтобы найти узкие места.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[36px] border border-border-soft bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-text-muted">динамика за период</p>
                  <h4 className="mt-2 text-xl font-semibold text-brand-indigo">Последние дни</h4>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {lastEntries.map((entry, index) => (
                  <div
                    key={`${entry.label ?? 'day'}-${index}`}
                    className="rounded-2xl border border-border-soft bg-surface-muted/60 px-4 py-3 text-sm"
                  >
                    <p className="text-[10px] uppercase tracking-[0.35em] text-text-muted">{formatTimelineDay(entry.label, index)}</p>
                    <p className="mt-1 text-base font-semibold text-brand-indigo">Услуги: {formatValue(entry.services)}</p>
                    <p className="text-sm text-text-secondary">Еда: {formatValue(entry.cafeteria)}</p>
                    <p className="text-sm text-text-secondary">Финансы: {formatValue(entry.finance)}</p>
                  </div>
                ))}
                {!lastEntries.length ? (
                  <div className="rounded-2xl border border-dashed border-border-soft px-4 py-3 text-center text-sm text-text-muted">
                    Нет данных за выбранный период
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[36px] border border-border-soft bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-text-muted">оперативный чек-лист</p>
                  <h4 className="mt-2 text-2xl font-semibold text-brand-indigo">Что проверить сегодня</h4>
                </div>
                <span className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">{rangeLabel}</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {checklist.map(item => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border-soft bg-surface-muted/60 px-4 py-3 text-sm text-text-secondary"
                  >
                    <p className="text-base font-semibold text-text-primary">{item.title}</p>
                    <p className="text-2xl font-bold text-brand-indigo">{formatValue(item.value)}</p>
                    <p className="text-xs text-text-muted">{item.description}</p>
                  </div>
                ))}
                {!checklist.length ? (
                  <div className="rounded-2xl border border-dashed border-border-soft px-4 py-3 text-center text-sm text-text-muted">
                    Чек-лист пуст за выбранный период
                  </div>
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </div>
    );
  };


  const renderSectionTabs = React.useCallback(
    (className = '') => (
      <div
        className={`flex w-full flex-wrap justify-center gap-2 overflow-x-auto px-1 py-1.5 sm:py-2 ${className}`}
        role="tablist"
      >
        {ADMIN_SECTIONS.map(section => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveSection(section.id)}
              className={`group relative flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? 'border-emerald-400/70 bg-emerald-50 text-emerald-800 shadow-[0_18px_45px_rgba(16,185,129,0.25)]'
                  : 'border-transparent bg-transparent text-text-secondary hover:text-emerald-600'
              } cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30`}
            >
              <span>{section.label}</span>
              <span
                className={`pointer-events-none absolute inset-x-6 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all duration-300 ${
                  isActive
                    ? 'scale-x-100 opacity-100'
                    : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-70'
                }`}
              />
            </button>
          );
        })}
      </div>
    ),
    [activeSection]
  );

  const renderActiveSection = () => {
    if (activeSection === 'marketplace') {
      return renderMarketplaceSection();
    }
    if (activeSection === 'cafeteria') {
      return renderCafeteriaSection();
    }
    if (activeSection === 'finances') {
      return renderFinancesSection();
    }
    if (activeSection === 'analytics') {
      return renderAnalyticsSection();
    }
    return null;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_55%)] text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-white/95 shadow-sm backdrop-blur">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between gap-4 py-3 sm:py-4 min-h-[72px]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigate('/')}
                className="group flex items-center gap-3 rounded-2xl border border-transparent px-1 py-1 text-left transition-all duration-200 hover:border-brand-indigo/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30"
                aria-label="Перейти на страницу навигации"
              >
                <img
                  src={LogoSAU}
                  alt="Логотип сервиса"
                  className="hidden h-12 w-12 rounded-3xl border border-transparent transition-transform duration-200 group-hover:scale-105 sm:block sm:h-14 sm:w-14"
                />
                <div className="leading-tight">
                  <h1 className="flex items-center text-2xl font-black uppercase tracking-tight text-text-primary sm:text-[1.85rem] lg:text-[2.1rem]">
                    <span className="tracking-[-0.04em]">STUD</span>
                    <span className="ml-1 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm tracking-[-0.04em]">
                      MI
                    </span>
                  </h1>
                  <p className="mt-1 text-xs uppercase tracking-[0.4em] text-text-muted">панель администратора</p>
                </div>
              </button>
            </div>
            <div className="hidden flex-1 justify-center px-3 lg:flex">
              <div className="w-full max-w-3xl">{renderSectionTabs()}</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleProfileNavigate}
                className="flex min-w-0 items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-inner transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
              >
                <span
                  className="max-w-[90px] truncate text-sm font-semibold text-emerald-800 sm:max-w-[140px] sm:text-base"
                  title={balanceLabel}
                >
                  {balanceLabel}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-6 sm:w-6">+</span>
              </button>
              <NotificationBell />
              <button
                type="button"
                onClick={handleProfileNavigate}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-all duration-200 hover:border-emerald-300 hover:text-emerald-600"
                aria-label="Профиль"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-brand-indigo text-base font-semibold text-white">
                  {currentUser.avatar?.url ? (
                    <img src={currentUser.avatar.url} alt="Аватар" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={handleLogoutClick}
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
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-28 sm:pb-32 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          <section className="rounded-[36px] border border-border-soft bg-white p-6 shadow-brand-card lg:hidden">
            <div className="flex justify-center">
              <div className="w-full max-w-xl">{renderSectionTabs()}</div>
            </div>
          </section>

          {renderActiveSection()}
        </div>
      </main>
    </div>
  );
};

export default AdminPanelPage;
