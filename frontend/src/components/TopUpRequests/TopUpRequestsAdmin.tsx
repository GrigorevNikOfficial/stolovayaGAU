import React, { useEffect, useMemo, useState } from 'react';
import { useUnit } from 'effector-react';
import Button from '../layout/Button/Button.tsx';
import StatusBadge from '../Settings/StatusBadge.tsx';
import {
  $adminTopUpRequests,
  $adminTopUpRequestsLoading,
  handleTopUpRequestDecision,
  loadAdminTopUpRequests,
} from '../../models/topups.ts';
import type { TopUpRequest, TopUpRequestStatus } from '../../types/topup';
import { TopUpDecisionModal } from './TopUpDecisionModal.tsx';

const formatCurrency = (value: number) =>
  `${value.toLocaleString('ru-RU', { minimumFractionDigits: 0 })} ₽`;

const filters: Array<{ id: 'all' | TopUpRequestStatus; label: string }> = [
  { id: 'pending', label: 'Новые' },
  { id: 'approved', label: 'Одобренные' },
  { id: 'rejected', label: 'Отклоненные' },
  { id: 'all', label: 'Все' },
];

export const TopUpRequestsAdmin: React.FC = () => {
  const [requests, isLoading, loadRequests, decide] = useUnit([
    $adminTopUpRequests,
    $adminTopUpRequestsLoading,
    loadAdminTopUpRequests,
    handleTopUpRequestDecision,
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | TopUpRequestStatus>('pending');
  const [selectedRequest, setSelectedRequest] = useState<TopUpRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (activeFilter === 'all') {
      loadRequests();
      return;
    }
    loadRequests({ status: activeFilter });
  }, [activeFilter, loadRequests]);

  const tableData = useMemo(() => {
    if (activeFilter === 'all') {
      return requests;
    }
    return requests.filter(request => request.status === activeFilter);
  }, [requests, activeFilter]);

  const openDecisionModal = (request: TopUpRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setDecisionType(action);
  };

  const closeDecisionModal = () => {
    setSelectedRequest(null);
    setDecisionType(null);
  };

  const handleDecisionSubmit = (payload: {
    id: string;
    status: 'approved' | 'rejected';
    amount?: number;
    note?: string;
  }) => {
    decide(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Заявки на пополнение</h2>
          <p className="text-sm text-gray-500">
            Управляйте запросами пользователей на пополнение баланса
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                activeFilter === filter.id
                  ? 'bg-green-dark text-white border-green-dark shadow-lg shadow-green-dark/20'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {filter.label}
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              activeFilter === 'all'
                ? loadRequests()
                : loadRequests({ status: activeFilter })
            }
          >
            Обновить
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    Загружаем заявки…
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    Заявки не найдены.
                  </td>
                </tr>
              ) : (
                tableData.map(request => (
                  <tr key={request._id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {request.user_info
                            ? `${request.user_info.first_name} ${request.user_info.last_name}`
                            : 'Неизвестный пользователь'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {request.user_info?.email || request.user_info?.phone || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-semibold">
                        {formatCurrency(request.amount_requested)}
                      </div>
                      {typeof request.amount_approved === 'number' && request.status !== 'pending' && (
                        <div className="text-xs text-gray-500">
                          Одобрено: {formatCurrency(request.amount_approved)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {request.status === 'pending' ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openDecisionModal(request, 'approve')}
                          >
                            Одобрить
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDecisionModal(request, 'reject')}
                          >
                            Отклонить
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Обработано</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TopUpDecisionModal
        isOpen={Boolean(selectedRequest && decisionType)}
        request={selectedRequest}
        action={decisionType}
        onClose={closeDecisionModal}
        onSubmit={handleDecisionSubmit}
      />
    </div>
  );
};

export default TopUpRequestsAdmin;
