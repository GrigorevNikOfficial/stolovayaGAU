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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleBackdropClick} />
      <div className="relative bg-[#111213] border border-[#2b2c2d] rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.55)] max-w-xl w-full overflow-hidden text-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2f3031]">
          <h3 className="text-xl font-semibold text-white">
            {isApproveAction ? 'Одобрение заявки' : 'Отклонение заявки'}
          </h3>
          <button
            onClick={handleBackdropClick}
            className="w-10 h-10 rounded-2xl bg-[#1c1d1e] border border-[#343536] text-gray-400 hover:text-white hover:border-[#69e7b6] transition-all"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-2xl border border-[#2f3031] bg-[#1a1b1c] p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Пользователь</p>
                <p className="font-semibold text-white">
                  {request.user_info
                    ? `${request.user_info.first_name} ${request.user_info.last_name}`
                    : 'Неизвестный пользователь'}
                </p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <div className="text-sm text-gray-400">
              Запрошено: {formatCurrency(request.amount_requested)}
            </div>
            {typeof request.amount_approved === 'number' && request.status !== 'pending' && (
              <div className="text-sm text-gray-400">
                Одобрено ранее: {formatCurrency(request.amount_approved)}
              </div>
            )}
          </div>

          {isApproveAction && (
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
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
            <label className="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
              Комментарий для пользователя
            </label>
            <textarea
              value={note}
              onChange={event => setNote(event.target.value)}
              className="w-full rounded-2xl border border-[#2f3031] bg-[#1b1c1d] text-gray-100 px-4 py-3 focus:ring-2 focus:ring-[#106157] focus:border-transparent"
              rows={3}
              placeholder={
                isApproveAction
                  ? 'Например, "Пополнение зачислено"'
                  : 'Укажите причину отклонения'
              }
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
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
