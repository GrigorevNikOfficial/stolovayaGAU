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

const statusOrder: Record<string, number> = {
  pending: 1,
  approved: 2,
  rejected: 3,
};

const formatCurrency = (value: number) =>
  `${value.toLocaleString('ru-RU', { minimumFractionDigits: 0 })} ₽`;

interface TopUpRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopUpRequestModal: React.FC<TopUpRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [requests, isSubmitting, isLoading, sendRequest, loadRequests] = useUnit([
    $myTopUpRequests,
    $isSubmittingTopUp,
    $myTopUpRequestsLoading,
    submitTopUpRequest,
    loadMyTopUpRequests,
  ]);

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
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
      const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111213] border border-[#2b2c2d] rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.55)] max-w-3xl w-full max-h-[92vh] overflow-hidden text-gray-100">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2f3031]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">Баланс</p>
            <h2 className="text-2xl font-bold">Пополнить баланс</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-[#1c1d1e] border border-[#343536] text-gray-400 hover:text-white hover:border-[#69e7b6] transition-all"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-0 md:gap-6 p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
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
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                Комментарий (необязательно)
              </label>
              <textarea
                value={note}
                onChange={event => setNote(event.target.value)}
                className="w-full rounded-2xl border border-[#2f3031] bg-[#1b1c1d] text-gray-100 px-4 py-3 focus:ring-2 focus:ring-[#106157] focus:border-transparent"
                rows={3}
                placeholder="Укажите дополнительную информацию для администратора"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
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

          <div className="border-t md:border-t-0 md:border-l border-[#2f3031] pt-4 md:pt-0 md:pl-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Мои заявки
            </h3>

            {isLoading ? (
              <div className="text-sm text-gray-400">Загружаем заявки…</div>
            ) : sortedRequests.length === 0 ? (
              <div className="text-sm text-gray-400">
                У вас еще нет заявок на пополнение.
              </div>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {sortedRequests.map(request => (
                  <div
                    key={request._id}
                    className="p-3 border border-[#2f3031] rounded-2xl bg-[#1a1b1c]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">
                        {new Date(request.created_at).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <StatusBadge status={request.status} />
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatCurrency(request.amount_requested)}
                    </div>
                    {typeof request.amount_approved === 'number' &&
                      request.status === 'approved' && (
                        <div className="text-xs text-gray-400">
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
