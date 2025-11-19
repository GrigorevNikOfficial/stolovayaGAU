// components/DeliverySettings/DeliverySettings.tsx
import React, { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
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
    if (!timeSettings.deliveryTimeStart || !timeSettings.deliveryTimeEnd) {
      alert('Пожалуйста, заполните время начала и окончания доставки');
      return;
    }

    setIsLoading(true);
    try {
      await handleUpdateSettings(timeSettings);
      alert('Настройки времени сохранены!');
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Статус доставки */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Управление доставкой
        </h2>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <p
              className={`font-medium ${
                settings.deliveryEnabled ? 'text-green-800' : 'text-red-800'
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Время работы доставки
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Начало доставки
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
              placeholder="09:00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Конец доставки
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
              placeholder="18:00"
            />
          </div>
        </div>

        <Button
          onClick={saveTimeSettings}
          disabled={isLoading}
          variant="primary"
          size="md"
          className="w-full md:w-auto"
        >
          {isLoading ? 'Сохранение...' : '💾 Сохранить время доставки'}
        </Button>
      </div>

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-dark mr-3"></div>
          <p className="text-sm text-gray-600">Обновление настроек...</p>
        </div>
      )}

      {/* Текущие данные из БД */}
      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Текущие настройки из базы данных
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Статус доставки:</span>
            <span
              className={`ml-2 font-medium ${
                settings.deliveryEnabled ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {settings.deliveryEnabled ? '✅ Включена' : '❌ Выключена'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Время работы:</span>
            <span className="ml-2 text-gray-600">
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
