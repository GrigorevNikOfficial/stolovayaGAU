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
import { CheckIcon, CloseIcon, ForkKnifeIcon, PackageIcon, TruckIcon } from '../icons/ServiceIcons';

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

  useEffect(() => {
    handleFetchSettings();
  }, [handleFetchSettings]);

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

  const handleTimeChange = (key: keyof typeof timeSettings, value: string) => {
    setTimeSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const statusOptions = [
    {
      id: 'enabled',
      label: 'Включена',
      icon: CheckIcon,
      active: true,
    },
    {
      id: 'disabled',
      label: 'Выключена',
      icon: CloseIcon,
      active: false,
    },
  ] as const;

  const scheduleBlocks = [
    {
      id: 'delivery',
      label: 'Доставка',
      startKey: 'deliveryTimeStart' as const,
      endKey: 'deliveryTimeEnd' as const,
      Icon: TruckIcon,
      tone: 'text-brand-indigo',
    },
    {
      id: 'pickup',
      label: 'Самовывоз',
      startKey: 'pickupTimeStart' as const,
      endKey: 'pickupTimeEnd' as const,
      Icon: PackageIcon,
      tone: 'text-emerald-600',
    },
    {
      id: 'dineIn',
      label: 'В зале',
      startKey: 'dineInTimeStart' as const,
      endKey: 'dineInTimeEnd' as const,
      Icon: ForkKnifeIcon,
      tone: 'text-amber-600',
    },
  ];

  const toggleDelivery = async (deliveryEnabled: boolean) => {
    setIsLoading(true);
    try {
      await handleUpdateSettings({
        deliveryEnabled,
        ...timeSettings,
      });
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTimeSettings = async () => {
    const requiredKeys: Array<keyof typeof timeSettings> = [
      'deliveryTimeStart',
      'deliveryTimeEnd',
      'pickupTimeStart',
      'pickupTimeEnd',
      'dineInTimeStart',
      'dineInTimeEnd',
    ];

    const hasEmptyField = requiredKeys.some(key => !timeSettings[key]);
    if (hasEmptyField) {
      alert('Пожалуйста, заполните все поля времени');
      return;
    }

    setIsLoading(true);
    try {
      await handleUpdateSettings({
        deliveryEnabled: Boolean(settings.deliveryEnabled),
        ...timeSettings,
      });
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-text-primary">
      <section className="rounded-[32px] border border-border-soft bg-white p-6 shadow-brand-card">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-brand-indigo">Управление заказами</h2>
          <p className="text-sm text-text-primary">
            Настройка времени работы для разных способов получения заказов
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {statusOptions.map(option => {
            const Icon = option.icon;
            const isActive = settings.deliveryEnabled === option.active;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleDelivery(option.active)}
                disabled={isLoading}
                aria-pressed={isActive}
                className={`group flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'border-emerald-400/70 bg-emerald-50 text-emerald-800 shadow-[0_15px_35px_rgba(16,185,129,0.2)]'
                    : 'border-border-subtle bg-surface-muted text-text-secondary hover:border-emerald-200 hover:text-emerald-700'
                } disabled:opacity-60`}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>

        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
            settings.deliveryEnabled
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border-rose-100 bg-rose-50 text-rose-700'
          }`}
        >
          {settings.deliveryEnabled
            ? 'Доставка включена — пользователи могут выбирать доставку'
            : 'Доставка отключена — пользователи не смогут выбирать доставку'}
        </div>
      </section>

      <section className="rounded-[32px] border border-border-soft bg-white p-6 shadow-brand-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-brand-indigo">Время работы</h3>
            <p className="text-sm text-text-primary">
              Гибко настраивайте расписание для разных способов получения заказа
            </p>
          </div>
          <Button
            onClick={saveTimeSettings}
            disabled={isLoading}
            variant="primary"
            size="md"
            className="min-w-[210px]"
          >
            {isLoading ? 'Сохраняем…' : 'Сохранить время'}
          </Button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {scheduleBlocks.map(({ id, label, startKey, endKey, Icon, tone }) => (
            <div
              key={id}
              className="rounded-2xl border border-border-soft bg-surface-muted/40 p-4 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Icon className={`h-4 w-4 ${tone}`} />
                {label}
              </div>
              <div className="grid gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Начало</p>
                  <Input
                    type="time"
                    value={timeSettings[startKey]}
                    onChange={value => handleTimeChange(startKey, value)}
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Конец</p>
                  <Input
                    type="time"
                    value={timeSettings[endKey]}
                    onChange={value => handleTimeChange(endKey, value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 text-sm text-text-primary">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-subtle border-t-brand-indigo" />
          Обновляем настройки…
        </div>
      )}
    </div>
  );
};

export default DeliverySettings;
