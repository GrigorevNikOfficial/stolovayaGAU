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
      <div className="absolute inset-0 bg-slate-900/25 backdrop-blur" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-[32px] border border-border-soft bg-white text-text-primary shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between border-b border-border-soft px-6 py-5">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.3em] text-text-muted">баланс</p>
            <h2 className="text-2xl font-semibold text-brand-indigo">Пополнить баланс</h2>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-2xl border border-border-soft text-text-secondary transition-colors hover:border-brand-indigo/50 hover:text-brand-indigo"
            aria-label="Закрыть окно пополнения"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 gap-0 p-6 md:grid-cols-[1.1fr_0.9fr] md:gap-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-text-muted">
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
              <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-text-muted">
                Комментарий (необязательно)
              </label>
              <textarea
                value={note}
                onChange={event => setNote(event.target.value)}
                className="w-full rounded-2xl border border-border-soft bg-white/95 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-indigo/30"
                rows={3}
                placeholder="Укажите дополнительную информацию для администратора"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
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

          <div className="border-t border-border-soft pt-4 md:border-t-0 md:border-l md:pl-6">
            <h3 className="mb-4 text-lg font-semibold text-brand-indigo">Мои заявки</h3>

            {isLoading ? (
              <div className="text-sm text-text-secondary">Загружаем заявки…</div>
            ) : sortedRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-soft bg-white/90 px-4 py-4 text-sm text-text-secondary">
                У вас еще нет заявок на пополнение.
              </div>
            ) : (
              <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-1">
                {sortedRequests.map(request => (
                  <div key={request._id} className="rounded-2xl border border-border-soft bg-white px-4 py-3 shadow-sm">
                    <div className="mb-1 flex items-center justify-between text-sm text-text-secondary">
                      <span>
                        {new Date(request.created_at).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <StatusBadge status={request.status} />
                    </div>
                    <div className="text-lg font-semibold text-text-primary">
                      {formatCurrency(request.amount_requested)}
                    </div>
                    {typeof request.amount_approved === 'number' && request.status === 'approved' && (
                      <div className="text-xs text-emerald-600">
                        Одобрено: {formatCurrency(request.amount_approved)}
                      </div>
                    )}
                    {request.note ? (
                      <p className="mt-2 text-xs text-text-secondary">Комментарий: {request.note}</p>
                    ) : null}
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
