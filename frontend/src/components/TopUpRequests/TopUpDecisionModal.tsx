import React, { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';
import StatusBadge from '../Settings/StatusBadge.tsx';
import type { TopUpRequest } from '../../types/topup';
import { $isProcessingTopUp, processTopUpRequestFx } from '../../models/topups.ts';

interface TopUpDecisionModalProps {
  request: TopUpRequest | null;
  action: 'approve' | 'reject' | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    id: string;
    status: 'approved' | 'rejected';
    amount?: number;
    note?: string;
  }) => void;
}

const formatCurrency = (value: number) =>
  `${value.toLocaleString('ru-RU', { minimumFractionDigits: 0 })} ₽`;

export const TopUpDecisionModal: React.FC<TopUpDecisionModalProps> = ({
  request,
  action,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const isProcessing = useUnit($isProcessingTopUp);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !request) {
      setAmount('');
      setNote('');
      setError(null);
      return;
    }

    if (action === 'approve') {
      setAmount(String(request.amount_requested ?? ''));
    } else {
      setAmount('');
    }
    setNote('');
    setError(null);
  }, [isOpen, request, action]);

  useEffect(() => {
    const unsubscribe = processTopUpRequestFx.done.watch(() => {
      setAmount('');
      setNote('');
      setError(null);
      onClose();
    });

    return () => unsubscribe();
  }, [onClose]);

  if (!isOpen || !request || !action) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (action === 'approve') {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setError('Введите корректную сумму пополнения');
        return;
      }
      onSubmit({
        id: request._id,
        status: 'approved',
        amount: parsedAmount,
        note: note.trim() || undefined,
      });
    } else {
      onSubmit({
        id: request._id,
        status: 'rejected',
        note: note.trim() || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {action === 'approve' ? 'Одобрение заявки' : 'Отклонение заявки'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-gray-500">Пользователь</p>
                <p className="font-semibold text-gray-900">
                  {request.user_info
                    ? `${request.user_info.first_name} ${request.user_info.last_name}`
                    : 'Неизвестный пользователь'}
                </p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <div className="text-sm text-gray-500">
              Запрошено: {formatCurrency(request.amount_requested)}
            </div>
            {typeof request.amount_approved === 'number' && request.status !== 'pending' && (
              <div className="text-sm text-gray-500">
                Одобрено ранее: {formatCurrency(request.amount_approved)}
              </div>
            )}
          </div>

          {action === 'approve' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сумма для зачисления
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={setAmount}
                placeholder="Укажите сумму"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий для пользователя (необязательно)
            </label>
            <textarea
              value={note}
              onChange={event => setNote(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-green-medium focus:border-transparent"
              rows={3}
              placeholder={
                action === 'approve'
                  ? 'Например, "Пополнение зачислено"'
                  : 'Укажите причину отклонения'
              }
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing
                ? 'Сохраняем…'
                : action === 'approve'
                  ? 'Одобрить и зачислить'
                  : 'Отклонить заявку'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopUpDecisionModal;
