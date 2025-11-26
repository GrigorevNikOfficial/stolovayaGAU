// components/layout/StatusBadge/StatusBadge.tsx
import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: { [key: string]: { label: string; className: string } } = {
  created: {
    label: 'Создан',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  cooking: {
    label: 'Готовится',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  waiting_delivery: {
    label: 'Ждёт отправления',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  in_transit: {
    label: 'В пути',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  ready_for_pickup: {
    label: 'Готов к получению',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  completed: {
    label: 'Завершён',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  cancelled: {
    label: 'Отменен',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  // Старые статусы для обратной совместимости
  pending: {
    label: 'Создан',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  confirmed: {
    label: 'Создан',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  ready: {
    label: 'Готов к получению',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  delivering: {
    label: 'В пути',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  delivered: {
    label: 'Завершён',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  approved: {
    label: 'Одобрено',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  rejected: {
    label: 'Отклонено',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
