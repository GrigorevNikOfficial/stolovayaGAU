// components/Settings/EmployeeManagement.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { usersApi } from '../../api/users';
import type { User } from '../../types/user';
import { phoneToApiFormat } from '../../utils/phone';
import Button from '../layout/Button/Button';
import Input from '../layout/Input/Input';
import Select from '../layout/Select/Select';
import { showToast } from '../layout/Toast/stores/toastStore';

export const EmployeeManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    mail: '',
    password: '',
    role: 'user',
  });
  const [activeRoleFilter, setActiveRoleFilter] = useState<
    'all' | 'admin' | 'user' | 'storeManager' | 'canteenManager'
  >('all');
  const [sortOption, setSortOption] = useState<
    'name-asc' | 'name-desc' | 'balance-desc' | 'balance-asc'
  >('name-asc');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getUsers();
      setUsers(data.users);
    } catch (error: any) {
      showToast({ message: error.message || 'Ошибка загрузки пользователей', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const preparedPhone = phoneToApiFormat(formData.phone);

      if (!preparedPhone) {
        showToast({ message: 'Введите телефон в формате +7 (999) 123 45-67', type: 'error' });
        return;
      }

      await usersApi.createEmployee({ ...formData, phone: preparedPhone });
      showToast({ message: 'Сотрудник успешно создан', type: 'success' });
      setShowCreateModal(false);
      setFormData({ first_name: '', last_name: '', phone: '', mail: '', password: '', role: 'user' });
      loadUsers();
    } catch (error: any) {
      showToast({ message: error.message || 'Ошибка создания сотрудника', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    
    try {
      await usersApi.deleteUser(id);
      showToast({ message: 'Пользователь удален', type: 'success' });
      loadUsers();
    } catch (error: any) {
      showToast({ message: error.message || 'Ошибка удаления', type: 'error' });
    }
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      user: 'Пользователь',
      admin: 'Администратор',
      canteenManager: 'Админ столовой',
      cateenManager: 'Админ столовой',
      storeManager: 'Админ буфета',
    };
    return roles[role] || role;
  };

  const roleTabs = [
    { id: 'all', label: 'Все' },
    { id: 'admin', label: 'Администратор' },
    { id: 'user', label: 'Пользователь' },
    { id: 'storeManager', label: 'Админ буфета' },
    { id: 'canteenManager', label: 'Админ столовой' },
  ] as const;

  const filteredUsers = useMemo(() => {
    const roleMap: Record<string, string[]> = {
      all: [],
      admin: ['admin'],
      user: ['user'],
      storeManager: ['storeManager'],
      canteenManager: ['canteenManager', 'cateenManager'],
    };

    const base =
      activeRoleFilter === 'all'
        ? users
        : users.filter(user => roleMap[activeRoleFilter].includes(user.role));

    const sorted = [...base].sort((a, b) => {
      const fullNameA = `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim();
      const fullNameB = `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim();
      const balanceA = a.balance ?? 0;
      const balanceB = b.balance ?? 0;

      switch (sortOption) {
        case 'name-desc':
          return fullNameB.localeCompare(fullNameA, 'ru');
        case 'balance-desc':
          return balanceB - balanceA;
        case 'balance-asc':
          return balanceA - balanceB;
        case 'name-asc':
        default:
          return fullNameA.localeCompare(fullNameB, 'ru');
      }
    });

    return sorted;
  }, [users, activeRoleFilter, sortOption]);

  return (
    <div className="space-y-6 text-text-primary">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Управление сотрудниками
          </h2>
          <p className="text-text-secondary">
            Создание и управление учетными записями сотрудников
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="primary" size="md">
          + Добавить сотрудника
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-dark"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-border-soft rounded-3xl p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between shadow-brand-card">
            <div className="flex flex-wrap gap-2">
              {roleTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRoleFilter(tab.id)}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium border transition-all ${
                    activeRoleFilter === tab.id
                      ? 'bg-brand-indigo text-white border-brand-indigo shadow-brand-card'
                      : 'border-border-subtle text-text-secondary hover:text-brand-indigo hover:border-brand-indigo/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="w-full lg:w-64">
              <Select
                value={sortOption}
                onChange={value =>
                  setSortOption(value as typeof sortOption)
                }
                placeholder="Сортировка"
                options={[
                  { value: 'name-asc', label: 'Имя (А → Я)' },
                  { value: 'name-desc', label: 'Имя (Я → А)' },
                  { value: 'balance-desc', label: 'Баланс (по убыв.)' },
                  { value: 'balance-asc', label: 'Баланс (по возр.)' },
                ]}
              />
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-border-soft shadow-brand-card overflow-hidden">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Имя</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Телефон</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Роль</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Баланс</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border-subtle">
              {filteredUsers.map(user => (
                <tr key={user._id} className="hover:bg-surface-muted transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-text-primary">
                      {user.first_name} {user.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{user.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{user.mail}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'canteenManager' || user.role === 'cateenManager' ? 'bg-sky-100 text-sky-700' :
                      user.role === 'storeManager' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-surface-muted text-text-secondary'
                    }`}>
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{user.balance}₽</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-border-soft rounded-3xl p-6 max-w-md w-full mx-4 text-text-primary shadow-brand-card">
            <h3 className="text-xl font-bold mb-4">Создать сотрудника</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                type="text"
                placeholder="Имя"
                value={formData.first_name}
                onChange={value => setFormData({ ...formData, first_name: value })}
              />
              <Input
                type="text"
                placeholder="Фамилия"
                value={formData.last_name}
                onChange={value => setFormData({ ...formData, last_name: value })}
              />
              <Input
                type="tel"
                placeholder="Телефон (+7 (999) 123 45-67)"
                value={formData.phone}
                onChange={value => setFormData({ ...formData, phone: value })}
              />
              <Input
                type="email"
                placeholder="Email"
                value={formData.mail}
                onChange={value => setFormData({ ...formData, mail: value })}
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={formData.password}
                onChange={value => setFormData({ ...formData, password: value })}
              />
              <Select
                value={formData.role}
                onChange={value => setFormData({ ...formData, role: value })}
                options={[
                  { value: 'user', label: 'Пользователь' },
                  { value: 'canteenManager', label: 'Админ столовой' },
                  { value: 'storeManager', label: 'Админ буфета' },
                  { value: 'admin', label: 'Администратор системы' },
                ]}
              />
              <div className="flex gap-3 pt-4">
                <Button type="button" onClick={() => setShowCreateModal(false)} variant="outline" size="md" className="flex-1">
                  Отмена
                </Button>
                <Button type="submit" variant="primary" size="md" className="flex-1">
                  Создать
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
