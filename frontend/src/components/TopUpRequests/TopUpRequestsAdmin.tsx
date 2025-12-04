import React, { useEffect, useMemo, useState } from 'react';
import { useUnit } from 'effector-react';
import type { TopUpRequest, TopUpRequestStatus } from '../../types/topup';
import {
  $adminTopUpRequests,
  $adminTopUpRequestsLoading,
  loadAdminTopUpRequests,
} from '../../models/topups.ts';
import Button from '../layout/Button/Button.tsx';
import StatusBadge from '../Settings/StatusBadge.tsx';
import TopUpDecisionModal from './TopUpDecisionModal.tsx';

const formatCurrency = (value: number) =>
  `${value.toLocaleString('ru-RU', { minimumFractionDigits: 0 })} ₽`;

const filters = [
  { id: 'all', label: 'Все заявки' },
  { id: 'pending', label: 'Ожидают' },
  { id: 'approved', label: 'Одобрены' },
  { id: 'rejected', label: 'Отклонены' },
] as const;

type FilterId = (typeof filters)[number]['id'];

export const TopUpRequestsAdmin: React.FC = () => {
  const { requests, isLoading, loadRequests } = useUnit({
    requests: $adminTopUpRequests,
    isLoading: $adminTopUpRequestsLoading,
    loadRequests: loadAdminTopUpRequests,
  });

  const [activeFilter, setActiveFilter] = useState<FilterId>('pending');
  const [selectedRequest, setSelectedRequest] = useState<TopUpRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const tableData = useMemo(() => {
    if (activeFilter === 'all') {
      return [...requests];
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

  const handleRefresh = () => {
    if (activeFilter === 'all') {
      loadRequests();
    } else {
      loadRequests({ status: activeFilter as TopUpRequestStatus });
    }
  };

  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  return (
    <div className="space-y-6 text-text-primary">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Заявки на пополнение</h2>
          <p className="text-sm text-text-secondary">
            Управляйте запросами пользователей на пополнение баланса
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all border ${
                activeFilter === filter.id
                  ? 'bg-brand-indigo text-white border-brand-indigo shadow-brand-card'
                  : 'bg-white text-text-secondary border-border-subtle hover:border-brand-indigo/40'
              }`}
            >
              {filter.label}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Обновить
          </Button>
        </div>
      </div>

      <div className="bg-white border border-border-soft rounded-3xl shadow-brand-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-subtle text-text-primary">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-[0.2em]">
                  Пользователь
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-[0.2em]">
                  Сумма
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-[0.2em]">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-[0.2em]">
                  Дата
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-[0.2em]">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-text-secondary">
                    Загружаем заявки…
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-text-secondary">
                    Заявок нет
                  </td>
                </tr>
              ) : (
                tableData.map(request => (
                  <tr key={request._id} className="hover:bg-surface-muted">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">
                          {request.user_info
                            ? `${request.user_info.first_name} ${request.user_info.last_name}`
                            : 'Неизвестный пользователь'}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {request.user_info?.email || request.user_info?.phone || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      <div className="font-semibold text-text-primary">
                        {formatCurrency(request.amount_requested)}
                      </div>
                      {typeof request.amount_approved === 'number' && request.status !== 'pending' && (
                        <div className="text-xs text-text-secondary">
                          Одобрено: {formatCurrency(request.amount_approved)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
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
                        <span className="text-xs text-text-secondary">Обработано</span>
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
        onCompleted={handleRefresh}
      />
    </div>
  );
};

export default TopUpRequestsAdmin;
