// components/layout/Tabs/Tabs.tsx
import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon: string;
  roles: string[];
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

  const containerClasses = isHorizontal
    ? `flex flex-wrap gap-2 sm:flex-nowrap sm:gap-3 ${
        justify === 'center'
          ? 'justify-center'
          : justify === 'between'
            ? 'justify-between'
            : justify === 'end'
              ? 'justify-end'
              : 'justify-start'
      }`
    : 'flex flex-col space-y-1';

  const wrapperClasses = isHorizontal
    ? 'w-full overflow-x-auto pb-1'
    : 'w-full';

  const tabBaseClasses =
    'flex items-center cursor-pointer transition-colors duration-200 rounded-lg flex-shrink-0 border bg-[#161718] border-[#2d2d2c] text-gray-300';

  const tabSizeClasses = isHorizontal
    ? 'px-3 py-2 text-sm'
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
            <span className="text-base mr-2">{tab.icon}</span>
            <span className="font-medium whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
