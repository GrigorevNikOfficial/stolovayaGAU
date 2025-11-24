import React, { useEffect, useState } from 'react';
import { pointsApi } from '../../api/points';
import { usersApi } from '../../api/users';
import type { Point } from '../../types/points';
import type { User } from '../../types/user';
import Button from '../layout/Button/Button';
import Input from '../layout/Input/Input';
import Select from '../layout/Select/Select';
import { showToast } from '../layout/Toast/stores/toastStore';

export const PointManagement: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isManagersLoading, setIsManagersLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'canteen' as 'canteen' | 'store',
    location: '',
    phone: '',
    managerId: '',
    isActive: true,
  });

  useEffect(() => {
    loadPoints();
    loadManagers();
  }, []);

  const loadPoints = async () => {
    try {
      setIsLoading(true);
      const data = await pointsApi.getPoints();
      setPoints(data.points);
    } catch (error: any) {
      showToast({
        message: error.message || 'Ошибка загрузки точек',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      setIsManagersLoading(true);
      const data = await usersApi.getUsers();
      // Фильтруем только менеджеров и администраторов
      const managers = data.users.filter(
        user =>
          user.role === 'canteenManager' ||
          user.role === 'storeManager' ||
          user.role === 'admin'
      );
      setManagers(managers);
    } catch (error: any) {
      showToast({
        message: error.message || 'Ошибка загрузки менеджеров',
        type: 'error',
      });
    } finally {
      setIsManagersLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pointsApi.createPoint(formData);
      showToast({ message: 'Точка успешно создана', type: 'success' });
      setShowCreateModal(false);
      setFormData({
        name: '',
        type: 'canteen',
        location: '',
        phone: '',
        managerId: '',
        isActive: true,
      });
      loadPoints();
    } catch (error: any) {
      showToast({
        message: error.message || 'Ошибка создания точки',
        type: 'error',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту точку?')) return;

    try {
      await pointsApi.deletePoint(id);
      showToast({ message: 'Точка удалена', type: 'success' });
      loadPoints();
    } catch (error: any) {
      showToast({ message: error.message || 'Ошибка удаления', type: 'error' });
    }
  };

  const handleToggleActive = async (point: Point) => {
    try {
      await pointsApi.updatePoint(point._id, { isActive: !point.isActive });
      showToast({
        message: `Точка ${!point.isActive ? 'активирована' : 'деактивирована'}`,
        type: 'success',
      });
      loadPoints();
    } catch (error: any) {
      showToast({
        message: error.message || 'Ошибка обновления',
        type: 'error',
      });
    }
  };

  const getTypeName = (type: string) => {
    const types: Record<string, string> = {
      canteen: 'Столовая',
      store: 'Буфет',
    };
    return types[type] || type;
  };

  const getManagerName = (managerId: string) => {
    const manager = managers.find(m => m._id === managerId);
    return manager
      ? `${manager.first_name} ${manager.last_name}`
      : 'Не назначен';
  };

  const getManagerRole = (managerId: string) => {
    const manager = managers.find(m => m._id === managerId);
    return manager ? manager.role : '';
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
            Управление точками
          </h2>
          <p className="text-gray-600">
            Создание и управление столовыми и буфетами
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          size="md"
        >
          + Добавить точку
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Тип
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Расположение
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Телефон
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Менеджер
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {points.map(point => (
                <tr key={point._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {point.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        point.type === 'canteen'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {getTypeName(point.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {point.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {point.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getManagerName(point.managerId)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getRoleName(getManagerRole(point.managerId))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        point.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {point.isActive ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleToggleActive(point)}
                      className={`${
                        point.isActive
                          ? 'text-orange-600 hover:text-orange-900'
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {point.isActive ? 'Деактивировать' : 'Активировать'}
                    </button>
                    <button
                      onClick={() => handleDelete(point._id)}
                      className="text-red-600 hover:text-red-900 ml-4"
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
            <h3 className="text-xl font-bold mb-4">Создать точку</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                type="text"
                placeholder="Название точки"
                value={formData.name}
                onChange={value => setFormData({ ...formData, name: value })}
                required
              />

              <Select
                value={formData.type}
                onChange={value =>
                  setFormData({
                    ...formData,
                    type: value as 'canteen' | 'store',
                  })
                }
                options={[
                  { value: 'canteen', label: 'Столовая' },
                  { value: 'store', label: 'Буфет' },
                ]}
                required
              />

              <Input
                type="text"
                placeholder="Расположение"
                value={formData.location}
                onChange={value =>
                  setFormData({ ...formData, location: value })
                }
                required
              />

              <Input
                type="tel"
                placeholder="Телефон"
                value={formData.phone}
                onChange={value => setFormData({ ...formData, phone: value })}
                required
              />

              <Select
                value={formData.managerId}
                onChange={value =>
                  setFormData({ ...formData, managerId: value })
                }
                options={[
                  { value: '', label: 'Выберите менеджера', disabled: true },
                  ...managers.map(manager => ({
                    value: manager._id,
                    label: `${manager.first_name} ${manager.last_name} (${getRoleName(manager.role)})`,
                  })),
                ]}
                required
                disabled={isManagersLoading}
              />

              {isManagersLoading && (
                <div className="text-sm text-gray-500">
                  Загрузка менеджеров...
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Активная точка
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  size="md"
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="flex-1"
                  disabled={!formData.managerId}
                >
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

export default PointManagement;
