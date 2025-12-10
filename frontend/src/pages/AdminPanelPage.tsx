import { useUnit } from 'effector-react';
import React from 'react';
import { settingsApi } from '../api/settings';
import Button from '../components/layout/Button/Button';
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

type AdminSectionId = 'marketplace' | 'cafeteria' | 'finances';

type AdminSection = {
  id: AdminSectionId;
  label: string;
};

const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: 'marketplace',
    label: 'Маркетплейс',
  },
  {
    id: 'cafeteria',
    label: 'Еда',
  },
  {
    id: 'finances',
    label: 'Финансы',
  },
];

type FinanceTabId = 'balances' | 'topups';

const FINANCE_TABS: Array<{ id: FinanceTabId; label: string }> = [
  { id: 'balances', label: 'Баланс пользователей' },
  { id: 'topups', label: 'Заявки на пополнение' },
];

const PlaceholderCard: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="rounded-[32px] border-2 border-dashed border-border-soft bg-white/70 p-8 text-center">
    <p className="text-xs uppercase tracking-[0.35em] text-text-muted">в разработке</p>
    <h3 className="mt-4 text-2xl font-semibold text-brand-indigo">{title}</h3>
    <p className="mt-2 text-sm text-text-secondary">{description}</p>
  </div>
);

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
      <section className="rounded-[36px] border border-brand-indigo/20 bg-gradient-to-br from-brand-indigo/5 via-white to-brand-grape/10 p-6 shadow-brand-card">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-brand-indigo/70">баланс платформы</p>
            <h3 className="mt-3 text-4xl font-semibold text-brand-indigo">{platformBalanceLabel}</h3>
            <p className="mt-2 text-sm text-brand-indigo/80">
              Текущая комиссия: {marketplaceSettings?.marketplaceCommissionPercent ?? '—'}%
            </p>
          </div>
          <div className="grid gap-3 text-sm text-brand-indigo">
            <div className="rounded-2xl border border-brand-indigo/30 bg-white/70 px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.35em] text-brand-indigo/60">онлайн-синхронизация</p>
              <p className="mt-1 text-base font-semibold text-brand-indigo">WebSocket активен</p>
            </div>
            <div className="rounded-2xl border border-brand-indigo/30 bg-white/70 px-4 py-3 shadow-sm">
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
