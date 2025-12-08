import React, { useEffect, useMemo, useState } from 'react';
import { useUnit } from 'effector-react';
import {
  $users,
  loadUsers,
  setUserBalance,
  setUserBalanceFx,
  topUpUserBalance,
  topUpUserBalanceFx,
} from '../../models/users';
import Input from '../layout/Input/Input.tsx';
import Button from '../layout/Button/Button.tsx';
import { formatBalance } from '../../utils/formatBalance';

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
      const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.toLowerCase();
      const phone = user.phone?.toLowerCase() ?? '';
      const email = user.mail?.toLowerCase() ?? '';

      return (
        fullName.includes(query) ||
        phone.includes(query) ||
        email.includes(query)
      );
    });
  }, [users, searchQuery]);

  const handleAmountChange = (userId: string, value: string) => {
    setAmounts(prev => ({ ...prev, [userId]: value }));
  };

  const handleTargetBalanceChange = (userId: string, value: string) => {
    setTargetBalances(prev => ({ ...prev, [userId]: value }));
  };

  const handleTopUpClick = (userId: string) => {
    const amount = parseFloat(amounts[userId] ?? '');
    if (Number.isNaN(amount) || amount <= 0) {
      return;
    }

    handleTopUp({ id: userId, amount });
    setAmounts(prev => ({ ...prev, [userId]: '' }));
  };

  const handleSetBalanceClick = (userId: string) => {
    const amount = parseFloat(targetBalances[userId] ?? '');
    if (Number.isNaN(amount) || amount < 0) {
      return;
    }

    handleSetBalance({ id: userId, amount });
    setTargetBalances(prev => ({ ...prev, [userId]: '' }));
  };

  return (
    <div className="space-y-6">
      <Input
        placeholder="Поиск по имени, телефону или email"
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">Пользователи не найдены</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map(user => (
            <div
              key={user._id}
                  className="p-4 border border-border-soft bg-white rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-text-primary shadow-brand-card"
            >
              <div className="flex-1">
                    <p className="text-lg font-semibold text-text-primary">
                  {user.first_name} {user.last_name}
                </p>
                    <p className="text-sm text-text-secondary">
                  {user.phone} • {user.mail || 'почта не указана'}
                </p>
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-muted text-text-secondary border border-border-subtle">
                  {user.role}
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                    <div className="text-xs text-text-muted uppercase tracking-wide">Текущий баланс</div>
                <div className="text-2xl font-bold text-brand-indigo">
                  {formatBalance(user.balance, { compact: true })}
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-[420px]">
                <div>
                  <div className="text-[11px] text-text-muted mb-1 uppercase tracking-[0.2em]">
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
                      Пополнить
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-text-muted mb-1 uppercase tracking-[0.2em]">
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
                      variant="outline"
                      className="h-12"
                    >
                      Установить
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
