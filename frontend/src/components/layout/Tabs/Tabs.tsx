// components/layout/Tabs/Tabs.tsx
import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon: string;
  roles: string[];
  badge?: string | number;
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
    'flex items-center cursor-pointer transition-colors duration-200 rounded-lg flex-shrink-0 border bg-[#161718] border-[#2d2d2c] text-gray-300';

  const tabSizeClasses = isHorizontal
    ? 'px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm'
    : 'px-4 py-3 text-base w-full';

  return (
    <div className={`${wrapperClasses} ${className}`}>
      <div className={`${containerClasses}`}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(index)}
            className={`
              ${tabBaseClasses}
              ${tabSizeClasses}
              ${
                activeTab === index
                  ? 'text-white border-[#106157] shadow-[0_0_12px_rgba(16,97,87,0.35)]'
                  : 'hover:text-white hover:border-[#106157]'
              }
            `}
          >
            <span className="text-sm sm:text-base mr-2">{tab.icon}</span>
            <span className="font-medium whitespace-nowrap flex items-center gap-2">
              {tab.label}
              {tab.badge && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[#69e7b6]/20 text-[#69e7b6] border border-[#69e7b6]/40 min-w-[1.75rem]">
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
