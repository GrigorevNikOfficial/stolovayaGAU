// components/DeliverySettings/DeliverySettings.tsx
import { useUnit } from 'effector-react';
import React, { useEffect, useState } from 'react';
import {
    $deliverySettings,
    fetchDeliverySettings,
    updateDeliverySettings,
} from '../../models/settings';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';

export const DeliverySettings: React.FC = () => {
  const [settings, handleFetchSettings, handleUpdateSettings] = useUnit([
    $deliverySettings,
    fetchDeliverySettings,
    updateDeliverySettings,
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [timeSettings, setTimeSettings] = useState({
    deliveryTimeStart: '',
    deliveryTimeEnd: '',
    pickupTimeStart: '',
    pickupTimeEnd: '',
    dineInTimeStart: '',
    dineInTimeEnd: '',
    serviceFeeType: 'percent' as 'percent' | 'fixed',
    serviceFeeValue: 0,
  });

  // Загружаем настройки из БД при монтировании
  useEffect(() => {
    handleFetchSettings();
  }, [handleFetchSettings]);

  // Когда настройки загрузились из БД - заполняем поля
  useEffect(() => {
    if (settings.deliveryTimeStart) {
      setTimeSettings({
        deliveryTimeStart: settings.deliveryTimeStart || '',
        deliveryTimeEnd: settings.deliveryTimeEnd || '',
        pickupTimeStart: settings.pickupTimeStart || '08:00',
        pickupTimeEnd: settings.pickupTimeEnd || '22:00',
        dineInTimeStart: settings.dineInTimeStart || '08:00',
        dineInTimeEnd: settings.dineInTimeEnd || '22:00',
        serviceFeeType: settings.serviceFeeType || 'percent',
        serviceFeeValue: settings.serviceFeeValue || 0,
      });
    }
  }, [settings]);

  // Переключение доставки
  const toggleDelivery = async (deliveryEnabled: boolean) => {
    setIsLoading(true);
    try {
      await handleUpdateSettings({ 
        deliveryEnabled,
        ...timeSettings
      });
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Сохранение времени
  const saveTimeSettings = async () => {
    if (!timeSettings.deliveryTimeStart || !timeSettings.deliveryTimeEnd ||
        !timeSettings.pickupTimeStart || !timeSettings.pickupTimeEnd ||
        !timeSettings.dineInTimeStart || !timeSettings.dineInTimeEnd) {
      alert('Пожалуйста, заполните все поля времени');
      return;
    }

    setIsLoading(true);
    try {
      await handleUpdateSettings({
        ...timeSettings,
        deliveryEnabled: settings.deliveryEnabled,
      });
      alert('Настройки времени сохранены!');
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-gray-100">
      {/* Статус доставки */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100 mb-4">
          Управление заказами
        </h2>
        <p className="text-gray-400 mb-6">
          Настройка времени работы для разных способов получения заказов
        </p>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Статус доставки
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Button
              onClick={() => toggleDelivery(true)}
              variant={settings.deliveryEnabled ? 'primary' : 'outline'}
              size="md"
              className="flex-1"
              disabled={isLoading}
            >
              <span className="flex items-center gap-2">✅ Включена</span>
            </Button>
            <Button
              onClick={() => toggleDelivery(false)}
              variant={!settings.deliveryEnabled ? 'secondary' : 'outline'}
              size="md"
              className="flex-1"
              disabled={isLoading}
            >
              <span className="flex items-center gap-2">❌ Выключена</span>
            </Button>
          </div>

          {/* Сообщение о статусе */}
          <div
            className={`p-4 rounded-xl border ${
              settings.deliveryEnabled
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-red-500/10 border-red-500/40'
            }`}
          >
            <p
              className={`font-medium ${
                settings.deliveryEnabled ? 'text-emerald-200' : 'text-red-200'
              }`}
            >
              {settings.deliveryEnabled
                ? '✅ Доставка активна - пользователи могут выбирать доставку'
                : '❌ Доставка отключена - пользователи не смогут выбирать доставку'}
            </p>
          </div>
        </div>
      </div>

      {/* Время работы доставки */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          ⏰ Время работы
        </h3>
        
        {/* Доставка */}
        <div className="mb-6 p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
          <h4 className="font-semibold text-gray-100 mb-3">🚚 Доставка</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Начало
              </label>
              <Input
                type="time"
                value={timeSettings.deliveryTimeStart}
                onChange={value =>
                  setTimeSettings(prev => ({
                    ...prev,
                    deliveryTimeStart: value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Конец
              </label>
              <Input
                type="time"
                value={timeSettings.deliveryTimeEnd}
                onChange={value =>
                  setTimeSettings(prev => ({
                    ...prev,
                    deliveryTimeEnd: value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Самовывоз */}
        <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <h4 className="font-semibold text-gray-100 mb-3">📦 Самовывоз</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Начало
              </label>
              <Input
                type="time"
                value={timeSettings.pickupTimeStart}
                onChange={value =>
                  setTimeSettings(prev => ({
                    ...prev,
                    pickupTimeStart: value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Конец
              </label>
              <Input
                type="time"
                value={timeSettings.pickupTimeEnd}
                onChange={value =>
                  setTimeSettings(prev => ({
                    ...prev,
                    pickupTimeEnd: value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* В зале */}
        <div className="mb-6 p-4 rounded-xl border border-purple-500/30 bg-purple-500/10">
          <h4 className="font-semibold text-gray-100 mb-3">🍽️ В зале</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Начало
              </label>
              <Input
                type="time"
                value={timeSettings.dineInTimeStart}
                onChange={value =>
                  setTimeSettings(prev => ({
                    ...prev,
                    dineInTimeStart: value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Конец
              </label>
              <Input
                type="time"
                value={timeSettings.dineInTimeEnd}
                onChange={value =>
                  setTimeSettings(prev => ({
                    ...prev,
                    dineInTimeEnd: value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <Button
          onClick={saveTimeSettings}
          disabled={isLoading}
          variant="primary"
          size="md"
          className="w-full"
        >
          {isLoading ? 'Сохранение...' : '💾 Сохранить все настройки времени'}
        </Button>
      </div>

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-dark mr-3"></div>
          <p className="text-sm text-gray-400">Обновление настроек...</p>
        </div>
      )}

      {/* Текущие данные из БД */}
      <div className="p-6 bg-[#1f2022] rounded-2xl border border-[#2f3032]">
        <h4 className="text-lg font-semibold text-gray-100 mb-4">
          Текущие настройки из базы данных
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-300">Статус доставки:</span>
            <span
              className={`ml-2 font-medium ${
                settings.deliveryEnabled ? 'text-emerald-300' : 'text-red-300'
              }`}
            >
              {settings.deliveryEnabled ? '✅ Включена' : '❌ Выключена'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-300">Время работы:</span>
            <span className="ml-2 text-gray-400">
              {settings.deliveryTimeStart || 'Не установлено'} -{' '}
              {settings.deliveryTimeEnd || 'Не установлено'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverySettings;
