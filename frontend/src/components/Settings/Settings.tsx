// components/Settings/Settings.tsx
import React, { useState } from 'react';
import { useUnit } from 'effector-react';
import { $currentUser } from '../../models/users';
import Tabs from '../layout/Tabs/Tabs.tsx';
import { DeliverySettings } from './DeliverySettings.tsx';
import { UserBalances } from './UserBalances.tsx';

export const Settings: React.FC = () => {
  const [currentUser] = useUnit([$currentUser]);
  const [activeTab, setActiveTab] = useState(0);

  // Табы настроек
  const settingsTabs = [
    {
      id: 'delivery',
      label: 'Доставка',
      icon: '🚚',
      roles: ['admin'],
    },
    {
      id: 'balances',
      label: 'Баланс пользователей',
      icon: '💰',
      roles: ['admin'],
    },
    {
      id: 'notifications',
      label: 'Уведомления',
      icon: '🔔',
      roles: ['admin'],
    },
    {
      id: 'general',
      label: 'Основные',
      icon: '⚙️',
      roles: ['admin'],
    },
  ];

  // Фильтруем табы по ролям
  const visibleTabs = settingsTabs.filter(tab =>
    tab.roles.includes(currentUser?.role || '')
  );

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-16 fade-in">
        <div className="text-6xl text-gray-300 mb-4">🚫</div>
        <p className="text-gray-500 text-xl font-medium mb-3">
          Доступ запрещен
        </p>
        <p className="text-gray-400 text-sm">
          Требуются права администратора для доступа к настройкам
        </p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Настройки системы
        </h1>
        <p className="text-gray-600">Управление параметрами работы столовой</p>
      </div>

      {/* Табы настроек */}
      <div className="mb-8">
        <Tabs
          tabs={visibleTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          orientation="horizontal"
          className="justify-start"
        />
      </div>

      {/* Контент активного таба */}
      {activeTab < visibleTabs.length && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {visibleTabs[activeTab].id === 'delivery' && <DeliverySettings />}

          {visibleTabs[activeTab].id === 'balances' && <UserBalances />}

          {visibleTabs[activeTab].id === 'notifications' && (
            <div className="text-center py-12">
              <div className="text-6xl text-gray-300 mb-4">🔔</div>
              <p className="text-gray-500 text-xl font-medium mb-3">
                Настройки уведомлений
              </p>
              <p className="text-gray-400 text-sm">Раздел в разработке</p>
            </div>
          )}

          {visibleTabs[activeTab].id === 'general' && (
            <div className="text-center py-12">
              <div className="text-6xl text-gray-300 mb-4">⚙️</div>
              <p className="text-gray-500 text-xl font-medium mb-3">
                Основные настройки
              </p>
              <p className="text-gray-400 text-sm">Раздел в разработке</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
