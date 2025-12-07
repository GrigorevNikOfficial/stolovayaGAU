// components/layout/Tabs/Tabs.tsx
import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  roles?: string[];
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: number;
  onTabChange: (index: number) => void;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  justify?: 'start' | 'center' | 'between' | 'end';
  variant?: 'default' | 'marketplace';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  orientation = 'horizontal',
  justify = 'start',
  variant = 'default',
}) => {
  const isHorizontal = orientation === 'horizontal';
  const isMarketplaceVariant = variant === 'marketplace' && isHorizontal;

  const justifyClassMap: Record<'start' | 'center' | 'between' | 'end', string> = {
    start: 'md:justify-start',
    center: 'md:justify-center',
    between: 'md:justify-between',
    end: 'md:justify-end',
  };

  const containerClasses = isHorizontal
    ? `flex gap-2 sm:gap-3 flex-nowrap md:flex-wrap overflow-x-auto hide-scrollbar justify-start ${justifyClassMap[justify]}`
    : 'flex flex-col space-y-1';

  const wrapperClasses = isHorizontal
    ? 'w-full pb-1'
    : 'w-full';

  const defaultBaseClasses =
    'flex items-center transition-all duration-200 rounded-2xl flex-shrink-0 border bg-white border-border-subtle text-text-secondary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/40';

  const defaultSizeClasses = isHorizontal
    ? 'px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm'
    : 'px-4 py-3 text-base w-full';

  return (
    <div className={`${wrapperClasses} ${className}`}>
      <div className={`${containerClasses}`}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;
          const isDisabled = Boolean(tab.disabled);
          const buttonClasses = isMarketplaceVariant
            ? `group relative flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-all duration-300 ${
                isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:-translate-y-0.5'
              } ${
                isActive
                  ? 'border-emerald-400/70 bg-emerald-50 text-emerald-800 shadow-[0_18px_45px_rgba(16,185,129,0.25)]'
                  : 'border-transparent bg-transparent text-text-secondary hover:text-emerald-600'
              }`
            : `${defaultBaseClasses} ${defaultSizeClasses} ${
                isActive
                  ? 'text-text-primary border-brand-indigo bg-brand-seashell shadow-brand-card'
                  : 'hover:text-text-primary hover:border-brand-indigo'
              } ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isDisabled) {
                  onTabChange(index);
                }
              }}
              type="button"
              disabled={isDisabled}
              className={buttonClasses}
              aria-pressed={isActive}
              aria-disabled={isDisabled}
            >
              {isMarketplaceVariant ? (
                <>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    {tab.icon ? (
                      <span className="text-sm sm:text-base text-text-secondary">{tab.icon}</span>
                    ) : null}
                    <span className="font-semibold flex items-center gap-2">
                      {tab.label}
                      {tab.badge && (
                        <span className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          isActive
                            ? 'border-emerald-400 bg-white/70 text-emerald-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </span>
                  </span>
                  <span
                    className={`pointer-events-none absolute inset-x-6 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all duration-300 ${
                      isActive
                        ? 'scale-x-100 opacity-100'
                        : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-70'
                    }`}
                  />
                </>
              ) : (
                <span className="flex items-center gap-2">
                  {tab.icon ? (
                    <span className="text-sm sm:text-base text-text-secondary">{tab.icon}</span>
                  ) : null}
                  <span className="font-medium whitespace-nowrap flex items-center gap-2">
                    {tab.label}
                    {tab.badge && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-brand-almond text-brand-indigo border border-brand-almond min-w-[1.75rem]">
                        {tab.badge}
                      </span>
                    )}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
