import React, { useEffect, useMemo, useState } from 'react';
import { useUnit } from 'effector-react';
import {
  $users,
  loadUsers,
  topUpUserBalance,
  topUpUserBalanceFx,
  setUserBalance,
  setUserBalanceFx,
} from '../../models/users';
import Input from '../layout/Input/Input.tsx';
import Button from '../layout/Button/Button.tsx';

export const UserBalances: React.FC = () => {
  const {
    users,
    handleLoadUsers,
    handleTopUp,
    handleSetBalance,
    isTopUpPending,
    isSetBalancePending,
  } = useUnit({
    users: $users,
    handleLoadUsers: loadUsers,
    handleTopUp: topUpUserBalance,
    handleSetBalance: setUserBalance,
    isTopUpPending: topUpUserBalanceFx.pending,
    isSetBalancePending: setUserBalanceFx.pending,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [targetBalances, setTargetBalances] = useState<Record<string, string>>({});

  useEffect(() => {
    handleLoadUsers();
  }, [handleLoadUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      return (
        fullName.includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        (user.mail?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [users, searchQuery]);

  const handleAmountChange = (userId: string, value: string) => {
    if (/^\d*(?:[\.,]\d{0,2})?$/.test(value)) {
      setAmounts(prev => ({
        ...prev,
        [userId]: value.replace(',', '.'),
      }));
    }
  };

  const handleTargetBalanceChange = (userId: string, value: string) => {
    if (/^\d*(?:[\.,]\d{0,2})?$/.test(value)) {
      setTargetBalances(prev => ({
        ...prev,
        [userId]: value.replace(',', '.'),
      }));
    }
  };

  const handleTopUpClick = (userId: string) => {
    const rawValue = amounts[userId];
    const parsedAmount = Number(rawValue);

    if (!rawValue || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Введите положительную сумму пополнения');
      return;
    }

    handleTopUp({ id: userId, amount: parsedAmount });
    setAmounts(prev => ({ ...prev, [userId]: '' }));
  };

  const handleSetBalanceClick = (userId: string) => {
    const rawValue = targetBalances[userId];
    const parsedAmount = Number(rawValue);

    if (rawValue === undefined || rawValue === '') {
      alert('Введите значение баланса');
      return;
    }

    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      alert('Баланс должен быть неотрицательным числом');
      return;
    }

    handleSetBalance({ id: userId, amount: parsedAmount });
    setTargetBalances(prev => ({ ...prev, [userId]: '' }));
  };

  return (
    <div className="space-y-6">
      <Input
        placeholder="Поиск по имени, телефону или email"
        value={searchQuery}
        onChange={setSearchQuery}
        icon="🔍"
      />

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Пользователи не найдены</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map(user => (
            <div
              key={user._id}
              className="p-4 border border-gray-200 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-sm text-gray-500">
                  {user.phone} • {user.mail || 'почта не указана'}
                </p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  {user.role}
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                <div className="text-sm text-gray-500">Текущий баланс</div>
                <div className="text-2xl font-bold text-green-dark">
                  {(user.balance ?? 0).toLocaleString('ru-RU')} ₽
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-[420px]">
                <div>
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                    Пополнить на сумму
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Сумма пополнения"
                      value={amounts[user._id] ?? ''}
                      onChange={value => handleAmountChange(user._id, value)}
                      className="h-12"
                    />
                    <Button
                      onClick={() => handleTopUpClick(user._id)}
                      disabled={isTopUpPending}
                      variant="primary"
                      className="h-12"
                    >
                      💸 Пополнить
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                    Установить точный баланс
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Новый баланс"
                      value={targetBalances[user._id] ?? ''}
                      onChange={value => handleTargetBalanceChange(user._id, value)}
                      className="h-12"
                    />
                    <Button
                      onClick={() => handleSetBalanceClick(user._id)}
                      disabled={isSetBalancePending}
                      variant="secondary"
                      className="h-12"
                    >
                      🎯 Установить
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserBalances;
