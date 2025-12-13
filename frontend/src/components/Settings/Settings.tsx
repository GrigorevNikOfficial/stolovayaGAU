// components/Settings/Settings.tsx
import { useUnit } from 'effector-react';
import React, { useState } from 'react';
import { $currentUser } from '../../models/users';
import Tabs from '../layout/Tabs/Tabs.tsx';
import { DeliverySettings } from './DeliverySettings.tsx';
import { EmployeeManagement } from './EmployeeManagement.tsx';
import { OrderSettings } from './OrderSettings.tsx';
import {
  LockIcon,
  PackageIcon,
  PieChartIcon,
  UsersIcon,
} from '../icons/ServiceIcons';

export const Settings: React.FC = () => {
  const [currentUser] = useUnit([$currentUser]);
  const [activeTab, setActiveTab] = useState(0);

  // Табы настроек
  const settingsTabs = [
    {
      id: 'delivery',
      label: 'Заказы',
      icon: <PackageIcon className="w-4 h-4" />,
      roles: ['admin'],
    },
    {
      id: 'orders',
      label: 'Сервисный сбор',
      icon: <PieChartIcon className="w-4 h-4" />,
      roles: ['admin'],
    },
    {
      id: 'employees',
      label: 'Сотрудники',
      icon: <UsersIcon className="w-4 h-4" />,
      roles: ['admin'],
    },
  ];

  // Фильтруем табы по ролям
  const visibleTabs = settingsTabs.filter(tab =>
    tab.roles.includes(currentUser?.role || '')
  );

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-16 fade-in text-text-secondary">
        <div className="flex items-center justify-center text-text-muted mb-4">
          <LockIcon className="w-14 h-14" />
        </div>
        <p className="text-text-primary text-xl font-medium mb-3">
          Доступ запрещен
        </p>
        <p className="text-text-secondary text-sm">
          Требуются права администратора для доступа к настройкам
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 fade-in text-text-primary">
      <Tabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        orientation="horizontal"
        variant="marketplace"
        justify="center"
        className="flex flex-wrap justify-center"
      />

      {activeTab < visibleTabs.length && (
        <div className="mt-6 rounded-2xl border border-border-soft bg-surface-muted/40 p-4 text-text-primary sm:p-6">
          {visibleTabs[activeTab].id === 'delivery' && <DeliverySettings />}

          {visibleTabs[activeTab].id === 'orders' && <OrderSettings />}

          {visibleTabs[activeTab].id === 'employees' && <EmployeeManagement />}
        </div>
      )}
    </div>
  );
};

export default Settings;
