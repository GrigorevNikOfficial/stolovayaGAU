import React, { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';
import StatusBadge from '../Settings/StatusBadge.tsx';
import type { TopUpRequest } from '../../types/topup';
import {
  $isProcessingTopUp,
  handleTopUpRequestDecision,
} from '../../models/topups.ts';

const formatCurrency = (value: number) =>
  `${value.toLocaleString('ru-RU', { minimumFractionDigits: 0 })} ₽`;

type DecisionAction = 'approve' | 'reject';

interface TopUpDecisionModalProps {
  isOpen: boolean;
  request: TopUpRequest | null;
  action: DecisionAction | null;
  onClose: () => void;
  onCompleted?: () => void;
}

const TopUpDecisionModal: React.FC<TopUpDecisionModalProps> = ({
  isOpen,
  request,
  action,
  onClose,
  onCompleted,
}) => {
  const { isProcessing, processRequest } = useUnit({
    isProcessing: $isProcessingTopUp,
    processRequest: handleTopUpRequestDecision,
  });

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isApproveAction = action === 'approve';

  useEffect(() => {
    if (!isOpen || !request) {
      setAmount('');
      setNote('');
      setError(null);
      setSubmitted(false);
      return;
    }

    setAmount(isApproveAction ? String(request.amount_requested ?? '') : '');
    setNote('');
    setError(null);
    setSubmitted(false);
  }, [isOpen, request, isApproveAction]);

  useEffect(() => {
    if (submitted && !isProcessing) {
      setSubmitted(false);
      onCompleted?.();
      onClose();
    }
  }, [submitted, isProcessing, onClose, onCompleted]);

  const handleBackdropClick = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!request || !action) {
      return;
    }

    setError(null);

    const trimmedNote = note.trim();

    if (isApproveAction) {
      const numericAmount = parseFloat(amount);
      if (Number.isNaN(numericAmount) || numericAmount <= 0) {
        setError('Укажите корректную сумму для зачисления');
        return;
      }

      processRequest({
        id: request._id,
        status: 'approved',
        amount: numericAmount,
        note: trimmedNote || undefined,
      });
    } else {
      if (!trimmedNote) {
        setError('Добавьте комментарий для пользователя');
        return;
      }

      processRequest({
        id: request._id,
        status: 'rejected',
        note: trimmedNote,
      });
    }

    setSubmitted(true);
  };

  if (!isOpen || !request || !action) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleBackdropClick} />
      <div className="relative w-full max-w-xl rounded-[32px] border border-border-soft bg-white text-text-primary shadow-[0_25px_80px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h3 className="text-xl font-semibold text-brand-indigo">
            {isApproveAction ? 'Одобрение заявки' : 'Отклонение заявки'}
          </h3>
          <button
            onClick={handleBackdropClick}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-subtle text-text-secondary transition-all hover:border-emerald-300 hover:text-emerald-600"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="rounded-2xl border border-border-soft bg-surface-muted px-4 py-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Пользователь</p>
                <p className="font-semibold text-text-primary">
                  {request.user_info
                    ? `${request.user_info.first_name} ${request.user_info.last_name}`
                    : 'Неизвестный пользователь'}
                </p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <div className="text-sm text-text-secondary">
              Запрошено: {formatCurrency(request.amount_requested)}
            </div>
            {typeof request.amount_approved === 'number' && request.status !== 'pending' && (
              <div className="text-sm text-text-secondary">
                Одобрено ранее: {formatCurrency(request.amount_approved)}
              </div>
            )}
          </div>

          {isApproveAction && (
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-text-muted">
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
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-text-muted">
              Комментарий для пользователя
            </label>
            <textarea
              value={note}
              onChange={event => setNote(event.target.value)}
              className="w-full rounded-2xl border border-border-soft bg-white px-4 py-3 text-sm text-text-primary focus:border-brand-indigo focus:outline-none focus:ring-2 focus:ring-brand-indigo/20"
              rows={3}
              placeholder={
                isApproveAction
                  ? 'Например, "Пополнение зачислено"'
                  : 'Укажите причину отклонения'
              }
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={handleBackdropClick}>
              Отмена
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing
                ? 'Сохраняем…'
                : isApproveAction
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
