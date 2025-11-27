// components/Settings/EmployeeManagement.tsx
import { useUnit } from 'effector-react';
import React, { useEffect, useState } from 'react';
import { pointsApi } from '../../api/points';
import {
    $users,
    $usersError,
    $usersLoading,
    createEmployee,
    deleteUser,
    loadUsers,
    updateEmployee,
} from '../../models/users';
import type { Point } from '../../types/points';
import type { User } from '../../types/user';
import Button from '../layout/Button/Button';
import Input from '../layout/Input/Input';
import PhoneInput, {
    cleanPhoneNumber,
} from '../layout/PhoneInput/PhoneInput';
import Select from '../layout/Select/Select';
import { showToast } from '../layout/Toast/stores/toastStore';

export const EmployeeManagement: React.FC = () => {
  const [users, isLoading, error] = useUnit([
    $users,
    $usersLoading,
    $usersError,
  ]);

  const [
    handleLoadUsers,
    handleCreateEmployee,
    handleUpdateEmployee,
    handleDeleteUser,
  ] = useUnit([loadUsers, createEmployee, updateEmployee, deleteUser]);

  const [points, setPoints] = useState<Point[]>([]);
  const [isPointsLoading, setIsPointsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    mail: '',
    password: '',
    role: 'user' as 'user' | 'admin' | 'canteenManager' | 'storeManager',
    point_id: '',
  });

  useEffect(() => {
    handleLoadUsers();
    loadPoints();
  }, [handleLoadUsers]);

  const loadPoints = async () => {
    try {
      setIsPointsLoading(true);
      const data = await pointsApi.getPoints();
      setPoints(data.points);
    } catch (error: any) {
      console.error('Ошибка загрузки точек:', error);
    } finally {
      setIsPointsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Для менеджеров точек проверяем, что выбрана точка
      if (
        (formData.role === 'canteenManager' ||
          formData.role === 'storeManager') &&
        !formData.point_id
      ) {
        showToast({
          message: 'Для менеджера точки необходимо выбрать точку',
          type: 'error',
        });
        return;
      }

      await handleCreateEmployee({
        ...formData,
        phone: cleanPhoneNumber(formData.phone),
      });
      showToast({ message: 'Сотрудник успешно создан', type: 'success' });
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      showToast({
        message: error.message || 'Ошибка создания сотрудника',
        type: 'error',
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      // Для менеджеров точек проверяем, что выбрана точка
      if (
        (formData.role === 'canteenManager' ||
          formData.role === 'storeManager') &&
        !formData.point_id
      ) {
        showToast({
          message: 'Для менеджера точки необходимо выбрать точку',
          type: 'error',
        });
        return;
      }

      await handleUpdateEmployee({
        id: editingUser._id,
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: cleanPhoneNumber(formData.phone),
          mail: formData.mail,
          role: formData.role,
          point_id: formData.point_id,
        },
      });
      showToast({ message: 'Сотрудник успешно обновлен', type: 'success' });
      setShowEditModal(false);
      setEditingUser(null);
      resetForm();
    } catch (error: any) {
      showToast({
        message: error.message || 'Ошибка обновления сотрудника',
        type: 'error',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?'))
      return;

    try {
      await handleDeleteUser(id);
      showToast({ message: 'Пользователь удален', type: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Ошибка удаления', type: 'error' });
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      mail: user.mail,
      password: '', // Пароль не заполняем при редактировании
      role: user.role,
      point_id: user.point_id || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      mail: '',
      password: '',
      role: 'user',
      point_id: '',
    });
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

  const isPointRequiredForRole = (role: string) =>
    role === 'canteenManager' || role === 'storeManager';

  const getPointFieldTitle = (role: string) => {
    if (role === 'canteenManager') {
      return 'Назначьте столовую';
    }
    if (role === 'storeManager') {
      return 'Назначьте буфет';
    }
    return 'Назначьте точку (опционально)';
  };

  const getPointPlaceholder = (role: string) => {
    if (role === 'canteenManager') {
      return 'Выберите столовую...';
    }
    if (role === 'storeManager') {
      return 'Выберите буфет...';
    }
    return 'Без привязки';
  };

  // Получаем название точки по ID
  const getPointName = (pointId: string) => {
    const point = points.find(p => p._id === pointId);
    return point
      ? `${point.name} (${point.type === 'canteen' ? 'Столовая' : 'Буфет'})`
      : 'Не назначена';
  };

  // Фильтруем точки по роли
  const getFilteredPoints = (role: string) => {
    if (role === 'canteenManager') {
      return points.filter(point => point.type === 'canteen');
    } else if (role === 'storeManager') {
      return points.filter(point => point.type === 'store');
    }
    return points;
  };

  // Обработчик изменения роли - сбрасываем точку при смене роли
  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role: role as 'user' | 'admin' | 'canteenManager' | 'storeManager',
      point_id: '', // Сбрасываем точку при смене роли
    }));
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
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          size="md"
        >
          + Добавить сотрудника
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl">
          {error}
        </div>
      )}

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
                  Имя
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Телефон
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Точка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Баланс
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Действия
                </th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.mail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'canteenManager' ||
                              user.role === 'cateenManager'
                            ? 'bg-blue-100 text-blue-800'
                            : user.role === 'storeManager'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.point_id ? getPointName(user.point_id) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.balance}₽
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Редактировать
                    </button>
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

      {/* Модальное окно создания */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Создать сотрудника</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                type="text"
                placeholder="Имя"
                value={formData.first_name}
                onChange={value =>
                  setFormData({ ...formData, first_name: value })
                }
                required
              />
              <Input
                type="text"
                placeholder="Фамилия"
                value={formData.last_name}
                onChange={value =>
                  setFormData({ ...formData, last_name: value })
                }
                required
              />
              <PhoneInput
                value={formData.phone}
                onChange={value => setFormData({ ...formData, phone: value })}
              />
              <Input
                type="email"
                placeholder="Email"
                value={formData.mail}
                onChange={value => setFormData({ ...formData, mail: value })}
                required
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={formData.password}
                onChange={value =>
                  setFormData({ ...formData, password: value })
                }
                required
              />

              <Select
                value={formData.role}
                onChange={handleRoleChange}
                options={[
                  { value: 'user', label: 'Пользователь' },
                  { value: 'canteenManager', label: 'Администратор столовой' },
                  { value: 'storeManager', label: 'Администратор буфета' },
                  { value: 'admin', label: 'Системный администратор' },
                ]}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getPointFieldTitle(formData.role)}{' '}
                  {isPointRequiredForRole(formData.role) && '*'}
                </label>
                {isPointsLoading ? (
                  <div className="text-sm text-gray-500">Загрузка точек...</div>
                ) : (
                  <Select
                    value={formData.point_id}
                    onChange={value =>
                      setFormData({ ...formData, point_id: value })
                    }
                    options={[
                      {
                        value: '',
                        label: getPointPlaceholder(formData.role),
                        disabled: isPointRequiredForRole(formData.role),
                      },
                      ...getFilteredPoints(formData.role).map(point => ({
                        value: point._id,
                        label: `${point.name} (${point.location})`,
                      })),
                    ]}
                    required={isPointRequiredForRole(formData.role)}
                  />
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
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
                  disabled={
                    isPointRequiredForRole(formData.role) &&
                    !formData.point_id
                  }
                >
                  Создать
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Редактировать сотрудника</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <Input
                type="text"
                placeholder="Имя"
                value={formData.first_name}
                onChange={value =>
                  setFormData({ ...formData, first_name: value })
                }
                required
              />
              <Input
                type="text"
                placeholder="Фамилия"
                value={formData.last_name}
                onChange={value =>
                  setFormData({ ...formData, last_name: value })
                }
                required
              />
              <PhoneInput
                value={formData.phone}
                onChange={value => setFormData({ ...formData, phone: value })}
              />
              <Input
                type="email"
                placeholder="Email"
                value={formData.mail}
                onChange={value => setFormData({ ...formData, mail: value })}
                required
              />

              <Select
                value={formData.role}
                onChange={handleRoleChange}
                options={[
                  { value: 'user', label: 'Пользователь' },
                  { value: 'canteenManager', label: 'Администратор столовой' },
                  { value: 'storeManager', label: 'Администратор буфета' },
                  { value: 'admin', label: 'Системный администратор' },
                ]}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getPointFieldTitle(formData.role)}{' '}
                  {isPointRequiredForRole(formData.role) && '*'}
                </label>
                {isPointsLoading ? (
                  <div className="text-sm text-gray-500">Загрузка точек...</div>
                ) : (
                  <Select
                    value={formData.point_id}
                    onChange={value =>
                      setFormData({ ...formData, point_id: value })
                    }
                    options={[
                      {
                        value: '',
                        label: getPointPlaceholder(formData.role),
                        disabled: isPointRequiredForRole(formData.role),
                      },
                      ...getFilteredPoints(formData.role).map(point => ({
                        value: point._id,
                        label: `${point.name} (${point.location})`,
                      })),
                    ]}
                    required={isPointRequiredForRole(formData.role)}
                  />
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
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
                  disabled={
                    isPointRequiredForRole(formData.role) &&
                    !formData.point_id
                  }
                >
                  Сохранить
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
