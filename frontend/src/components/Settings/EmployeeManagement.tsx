// components/Settings/EmployeeManagement.tsx
import React, { useEffect, useState } from 'react';
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
              {users.map(user => (
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
