// components/Settings/OrderSettings.tsx
import React, { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settings';
import Button from '../layout/Button/Button';
import Input from '../layout/Input/Input';
import Select from '../layout/Select/Select';
import { showToast } from '../layout/Toast/stores/toastStore';

export const OrderSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    serviceFeeType: 'percent' as 'percent' | 'fixed',
    serviceFeeValue: 0,
    deliveryEnabled: false,
    deliveryTimeStart: '',
    deliveryTimeEnd: '',
    pickupTimeStart: '',
    pickupTimeEnd: '',
    dineInTimeStart: '',
    dineInTimeEnd: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await settingsApi.getDeliverySettings();
      setSettings({
        serviceFeeType: data.serviceFeeType || 'percent',
        serviceFeeValue: data.serviceFeeValue || 0,
        deliveryEnabled: data.deliveryEnabled ?? false,
        deliveryTimeStart: data.deliveryTimeStart || '',
        deliveryTimeEnd: data.deliveryTimeEnd || '',
        pickupTimeStart: data.pickupTimeStart || '08:00',
        pickupTimeEnd: data.pickupTimeEnd || '22:00',
        dineInTimeStart: data.dineInTimeStart || '08:00',
        dineInTimeEnd: data.dineInTimeEnd || '22:00',
      });
    } catch (error: any) {
      showToast({ message: error.message || 'Ошибка загрузки настроек', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await settingsApi.updateDeliverySettings(settings);
      showToast({ message: 'Настройки успешно сохранены', type: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Ошибка сохранения настроек', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-dark"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-text-primary">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Сервисный сбор
        </h2>
        <p className="text-text-secondary">
          Настройка дополнительного сбора, который будет добавляться к каждому заказу
        </p>
      </div>

      <div className="bg-white border border-border-soft rounded-3xl p-6 space-y-6 shadow-brand-card">
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Сервисный сбор
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Тип сбора
              </label>
              <Select
                value={settings.serviceFeeType}
                onChange={value => setSettings({ ...settings, serviceFeeType: value as 'percent' | 'fixed' })}
                options={[
                  { value: 'percent', label: 'Процент от суммы' },
                  { value: 'fixed', label: 'Фиксированная сумма' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Значение {settings.serviceFeeType === 'percent' ? '(%)' : '(₽)'}
              </label>
              <Input
                type="number"
                value={settings.serviceFeeValue.toString()}
                onChange={value => setSettings({ ...settings, serviceFeeValue: parseFloat(value) || 0 })}
                placeholder={settings.serviceFeeType === 'percent' ? 'Например: 5' : 'Например: 50'}
              />
              <p className="text-sm text-text-secondary mt-2">
                {settings.serviceFeeType === 'percent' 
                  ? 'Процент будет добавлен к итоговой сумме заказа'
                  : 'Фиксированная сумма будет добавлена к каждому заказу'}
              </p>
            </div>

            {settings.serviceFeeValue > 0 && (
              <div className="bg-brand-indigo/5 border border-brand-indigo/20 rounded-2xl p-4">
                <p className="text-sm text-brand-indigo">
                  <strong>Пример:</strong> При заказе на 1000₽ итоговая сумма составит:{' '}
                  <strong>
                    {settings.serviceFeeType === 'percent'
                      ? `${(1000 + (1000 * settings.serviceFeeValue) / 100).toFixed(2)}₽ (сбор ${settings.serviceFeeValue}%)`
                      : `${(1000 + settings.serviceFeeValue).toFixed(2)}₽ (сбор ${settings.serviceFeeValue}₽)`}
                  </strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          onClick={loadSettings}
          variant="outline"
          size="md"
          disabled={isSaving}
        >
          Сбросить
        </Button>
        <Button
          onClick={handleSave}
          variant="primary"
          size="md"
          disabled={isSaving}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </div>
    </div>
  );
};

export default OrderSettings;
