import React, { useEffect, useMemo, useState } from 'react';
import { useUnit } from 'effector-react';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';
import {
  $isSubmittingTopUp,
  $myTopUpRequests,
  $myTopUpRequestsLoading,
  createTopUpRequestFx,
  loadMyTopUpRequests,
  submitTopUpRequest,
} from '../../models/topups.ts';
import StatusBadge from '../Settings/StatusBadge.tsx';

interface TopUpRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const statusOrder: Record<string, number> = {
  pending: 1,
  approved: 2,
  rejected: 3,
};

const formatCurrency = (value: number) =>
  `${value.toLocaleString('ru-RU', { minimumFractionDigits: 0 })} ₽`;

export const TopUpRequestModal: React.FC<TopUpRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [requests, isSubmitting, isLoading, sendRequest, loadRequests] =
    useUnit([
      $myTopUpRequests,
      $isSubmittingTopUp,
      $myTopUpRequestsLoading,
      submitTopUpRequest,
      loadMyTopUpRequests,
    ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    loadRequests();
  }, [isOpen, loadRequests]);

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setNote('');
      setError(null);
      return;
    }

    const unsubscribe = createTopUpRequestFx.done.watch(() => {
      setAmount('');
      setNote('');
      setError(null);
      onClose();
    });

    return () => unsubscribe();
  }, [isOpen, onClose]);

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      const statusDiff =
        (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [requests]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Введите сумму больше нуля');
      return;
    }

    sendRequest({ amount: parsedAmount, note: note.trim() || undefined });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Пополнить баланс</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сумма пополнения
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={setAmount}
                placeholder="Например, 500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий (необязательно)
              </label>
              <textarea
                value={note}
                onChange={event => setNote(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-medium focus:border-transparent"
                rows={3}
                placeholder="Укажите дополнительную информацию для администратора"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose} type="button">
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Отправляем…' : 'Отправить заявку'}
              </Button>
            </div>
          </form>

          <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Мои заявки
            </h3>

            {isLoading ? (
              <div className="text-sm text-gray-500">Загружаем заявки…</div>
            ) : sortedRequests.length === 0 ? (
              <div className="text-sm text-gray-500">
                У вас еще нет заявок на пополнение.
              </div>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {sortedRequests.map(request => (
                  <div
                    key={request._id}
                    className="p-3 border border-gray-100 rounded-2xl bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString(
                          'ru-RU',
                          {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </span>
                      <StatusBadge status={request.status} />
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(request.amount_requested)}
                    </div>
                    {typeof request.amount_approved === 'number' &&
                      request.status === 'approved' && (
                        <div className="text-xs text-gray-500">
                          Одобрено: {formatCurrency(request.amount_approved)}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUpRequestModal;
