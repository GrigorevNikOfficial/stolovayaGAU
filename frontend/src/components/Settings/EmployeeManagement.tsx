// components/Settings/EmployeeManagement.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { usersApi } from '../../api/users';
import type { User } from '../../types/user';
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
      await usersApi.createEmployee(formData);
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
    <div className="space-y-6 text-gray-100">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2">
            Управление сотрудниками
          </h2>
          <p className="text-gray-400">
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
          <div className="bg-[#18191b] border border-[#2f3032] rounded-2xl p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {roleTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRoleFilter(tab.id)}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium border transition-all ${
                    activeRoleFilter === tab.id
                      ? 'bg-[#106157] text-white border-[#106157] shadow-[0_0_12px_rgba(16,97,87,0.35)]'
                      : 'border-[#2f3032] text-gray-300 hover:text-white hover:border-[#106157]'
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

          <div className="bg-[#1f2022] rounded-xl border border-[#2f3032] shadow overflow-hidden">
          <table className="min-w-full divide-y divide-[#2f3032]">
            <thead className="bg-[#161718]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Имя</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Телефон</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Роль</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Баланс</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-[#1f2022] divide-y divide-[#2f3032]">
              {filteredUsers.map(user => (
                <tr key={user._id} className="hover:bg-[#242527] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-100">
                      {user.first_name} {user.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.mail}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-500/20 text-purple-200' :
                      user.role === 'canteenManager' || user.role === 'cateenManager' ? 'bg-blue-500/20 text-blue-200' :
                      user.role === 'storeManager' ? 'bg-green-500/20 text-green-200' :
                      'bg-gray-500/20 text-gray-200'
                    }`}>
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{user.balance}₽</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="text-red-300 hover:text-red-200 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1f2022] border border-[#2f3032] rounded-2xl p-6 max-w-md w-full mx-4 text-gray-100">
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
                placeholder="Телефон"
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
