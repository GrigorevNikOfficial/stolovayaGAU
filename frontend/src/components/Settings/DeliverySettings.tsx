// components/DeliverySettings/DeliverySettings.tsx
import { useUnit } from 'effector-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
    $deliverySettings,
    fetchDeliverySettings,
    updateDeliverySettings,
} from '../../models/settings';
import type { DeliverySettings as DeliverySettingsType } from '../../types/settings.ts';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';

type TimeWindowKey = keyof Pick<
  DeliverySettingsType,
  | 'deliveryTimeStart'
  | 'deliveryTimeEnd'
  | 'pickupTimeStart'
  | 'pickupTimeEnd'
  | 'dineInTimeStart'
  | 'dineInTimeEnd'
>;

interface ScheduleDefinition {
  id: string;
  label: string;
  startKey: TimeWindowKey;
  endKey: TimeWindowKey;
  accent: string;
}

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

  const scheduleConfig: ScheduleDefinition[] = useMemo(
    () => [
      {
        id: 'delivery',
        label: '🚚 Доставка',
        startKey: 'deliveryTimeStart',
        endKey: 'deliveryTimeEnd',
        accent: 'bg-blue-50 border-blue-200',
      },
      {
        id: 'pickup',
        label: '📦 Самовывоз',
        startKey: 'pickupTimeStart',
        endKey: 'pickupTimeEnd',
        accent: 'bg-green-50 border-green-200',
      },
      {
        id: 'dineIn',
        label: '🍽️ В зале',
        startKey: 'dineInTimeStart',
        endKey: 'dineInTimeEnd',
        accent: 'bg-purple-50 border-purple-200',
      },
    ],
    []
  );

  const formatTimeRange = (start?: string, end?: string) =>
    start && end ? `${start} - ${end}` : 'Не задано';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Управление заказами
        </h2>
        <p className="text-gray-600">
          Настройка времени для доставки, самовывоза и обслуживания в зале
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
        <div className="space-y-4">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Статус доставки
                </h3>
                <p className="text-sm text-gray-500">
                  Быстро включайте или отключайте прием заказов с доставкой
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => toggleDelivery(true)}
                  variant={settings.deliveryEnabled ? 'primary' : 'outline'}
                  size="md"
                  className="flex-1 sm:flex-none"
                  disabled={isLoading}
                >
                  ✅ Включена
                </Button>
                <Button
                  onClick={() => toggleDelivery(false)}
                  variant={!settings.deliveryEnabled ? 'secondary' : 'outline'}
                  size="md"
                  className="flex-1 sm:flex-none"
                  disabled={isLoading}
                >
                  ❌ Выключена
                </Button>
              </div>
            </div>

            <div
              className={`mt-4 p-4 rounded-xl border ${
                settings.deliveryEnabled
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  settings.deliveryEnabled ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {settings.deliveryEnabled
                  ? 'Пользователи видят доставку как способ получения заказа'
                  : 'Доставка скрыта из интерфейса заказа'}
              </p>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Текущее расписание по данным из БД
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Статус доставки</p>
                <p
                  className={`text-lg font-semibold ${
                    settings.deliveryEnabled ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {settings.deliveryEnabled ? '✅ Включена' : '❌ Выключена'}
                </p>
              </div>
              {scheduleConfig.map(mode => {
                const startSetting = settings[mode.startKey];
                const endSetting = settings[mode.endKey];
                return (
                  <div
                    key={mode.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <p className="text-sm text-gray-500">{mode.label}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatTimeRange(startSetting, endSetting)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                ⏰ Время работы каналов
              </h3>
              <p className="text-sm text-gray-500">
                Укажите интервалы, в которые пользователи смогут оформлять
                заказы
              </p>
            </div>
            <Button
              onClick={saveTimeSettings}
              disabled={isLoading}
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Сохранение...' : '💾 Сохранить'}
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 sm:grid-cols-2 grid-cols-1">
            {scheduleConfig.map(mode => (
              <div
                key={mode.id}
                className={`p-5 rounded-2xl border ${mode.accent}`}
              >
                <h4 className="font-semibold text-gray-900 mb-4">
                  {mode.label}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                      Начало
                    </label>
                    <Input
                      type="time"
                      value={timeSettings[mode.startKey]}
                      onChange={value =>
                        setTimeSettings(prev => ({
                          ...prev,
                          [mode.startKey]: value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                      Конец
                    </label>
                    <Input
                      type="time"
                      value={timeSettings[mode.endKey]}
                      onChange={value =>
                        setTimeSettings(prev => ({
                          ...prev,
                          [mode.endKey]: value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center text-sm text-gray-500 gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-dark"></div>
              Обновляем настройки...
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DeliverySettings;
