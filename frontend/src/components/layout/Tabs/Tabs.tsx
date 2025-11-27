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
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  orientation = 'horizontal',
}) => {
  const isHorizontal = orientation === 'horizontal';

  const containerClasses = isHorizontal
    ? 'flex flex-wrap gap-2 sm:flex-nowrap sm:gap-3'
    : 'flex flex-col space-y-1';

  const wrapperClasses = isHorizontal
    ? 'w-full overflow-x-auto pb-1'
    : 'w-full';

  const tabBaseClasses =
    'flex items-center cursor-pointer transition-colors duration-200 rounded-lg flex-shrink-0';

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
                  ? 'bg-green-dark text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
