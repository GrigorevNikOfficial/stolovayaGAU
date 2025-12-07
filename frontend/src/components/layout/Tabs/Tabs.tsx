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
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  orientation = 'horizontal',
  justify = 'start',
}) => {
  const isHorizontal = orientation === 'horizontal';

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

  const tabBaseClasses =
    'flex items-center transition-all duration-200 rounded-2xl flex-shrink-0 border bg-white border-border-subtle text-text-secondary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/40';

  const tabSizeClasses = isHorizontal
    ? 'px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm'
    : 'px-4 py-3 text-base w-full';

  return (
    <div className={`${wrapperClasses} ${className}`}>
      <div className={`${containerClasses}`}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;
          const isDisabled = Boolean(tab.disabled);

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
              className={`
                ${tabBaseClasses}
                ${tabSizeClasses}
                ${isActive ? 'text-text-primary border-brand-indigo bg-brand-seashell shadow-brand-card' : 'hover:text-text-primary hover:border-brand-indigo'}
                ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              `}
              aria-pressed={isActive}
              aria-disabled={isDisabled}
            >
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
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
