// components/DeliverySettings.tsx
import React, { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import {
  $deliverySettings,
  fetchDeliverySettings,
  updateDeliverySettings,
} from '../models/settings';
import { $currentUser } from '../models/users';

export const DeliverySettings: React.FC = () => {
  const [settings, currentUser, handleFetchSettings, handleUpdateSettings] =
    useUnit([
      $deliverySettings,
      $currentUser,
      fetchDeliverySettings,
      updateDeliverySettings,
    ]);

  const [isLoading, setIsLoading] = useState(false);
  const [timeSettings, setTimeSettings] = useState({
    deliveryTimeStart: '',
    deliveryTimeEnd: '',
  });

  // Загружаем настройки из БД при монтировании
  useEffect(() => {
    handleFetchSettings();
  }, [handleFetchSettings]);

  // Когда настройки загрузились из БД - заполняем поля
  useEffect(() => {
    if (settings.deliveryTimeStart && settings.deliveryTimeEnd) {
      setTimeSettings({
        deliveryTimeStart: settings.deliveryTimeStart,
        deliveryTimeEnd: settings.deliveryTimeEnd,
      });
    }
  }, [settings]);

  // Переключение доставки
  const toggleDelivery = async (deliveryEnabled: boolean) => {
    setIsLoading(true);
    try {
      await handleUpdateSettings({ deliveryEnabled });
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Сохранение времени
  const saveTimeSettings = async () => {
    setIsLoading(true);
    try {
      await handleUpdateSettings(timeSettings);
      alert('Время сохранено!');
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-medium">Доступ запрещен</p>
          <p className="text-red-500 text-sm mt-1">
            Требуются права администратора
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          Управление доставкой
        </h1>

        {/* Табы для статуса доставки */}
        <Tabs selectedIndex={settings.deliveryEnabled ? 0 : 1}>
          <TabList className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <Tab
              onClick={() => toggleDelivery(true)}
              className="flex-1 py-2 px-3 text-center cursor-pointer rounded-md ui-selected:bg-white ui-selected:text-green-600 ui-selected:font-medium ui-selected:shadow-sm ui-not-selected:text-gray-600 ui-not-selected:hover:text-gray-900"
            >
              ✅ Включена
            </Tab>
            <Tab
              onClick={() => toggleDelivery(false)}
              className="flex-1 py-2 px-3 text-center cursor-pointer rounded-md ui-selected:bg-white ui-selected:text-red-600 ui-selected:font-medium ui-selected:shadow-sm ui-not-selected:text-gray-600 ui-not-selected:hover:text-gray-900"
            >
              ❌ Выключена
            </Tab>
          </TabList>

          <TabPanel>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">Доставка активна</p>
            </div>
          </TabPanel>
          <TabPanel>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Доставка отключена</p>
            </div>
          </TabPanel>
        </Tabs>

        {/* Поля для времени */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Начало доставки
            </label>
            <input
              type="time"
              value={timeSettings.deliveryTimeStart}
              onChange={e =>
                setTimeSettings(prev => ({
                  ...prev,
                  deliveryTimeStart: e.target.value,
                }))
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Конец доставки
            </label>
            <input
              type="time"
              value={timeSettings.deliveryTimeEnd}
              onChange={e =>
                setTimeSettings(prev => ({
                  ...prev,
                  deliveryTimeEnd: e.target.value,
                }))
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            onClick={saveTimeSettings}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить время'}
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            <p className="text-sm text-gray-600">Загрузка...</p>
          </div>
        )}

        {/* Текущие данные из БД */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">Данные из БД:</p>
          <p className="text-sm text-gray-600">
            Статус: {settings.deliveryEnabled ? 'Включена' : 'Выключена'}
          </p>
          <p className="text-sm text-gray-600">
            Время: {settings.deliveryTimeStart} - {settings.deliveryTimeEnd}
          </p>
        </div>
      </div>
    </div>
  );
};
