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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Управление сотрудниками
          </h2>
          <p className="text-gray-600">
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
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Баланс</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.mail}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'canteenManager' || user.role === 'cateenManager' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'storeManager' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.balance}₽</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="text-red-600 hover:text-red-900"
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
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
