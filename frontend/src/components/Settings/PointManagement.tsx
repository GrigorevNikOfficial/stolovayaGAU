import React, { useEffect, useState } from 'react';
import { pointsApi } from '../../api/points';
import type { Point } from '../../types/points';
import Button from '../layout/Button/Button';
import Input from '../layout/Input/Input';
import Select from '../layout/Select/Select';
import { showToast } from '../layout/Toast/stores/toastStore';

type PointFormState = {
  name: string;
  type: 'canteen' | 'store';
  location: string;
  phone: string;
  isActive: boolean;
};

const createInitialFormState = (): PointFormState => ({
  name: '',
  type: 'canteen',
  location: '',
  phone: '',
  isActive: true,
});

export const PointManagement: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPoint, setEditingPoint] = useState<Point | null>(null);
  const [formData, setFormData] = useState<PointFormState>(createInitialFormState());
  const [editFormData, setEditFormData] = useState<PointFormState>(createInitialFormState());

  useEffect(() => {
    loadPoints();
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pointsApi.createPoint(formData);
      showToast({ message: 'Точка успешно создана', type: 'success' });
      closeCreateModal();
      loadPoints();
    } catch (error: any) {
      showToast({
        message: error.message || 'Ошибка создания точки',
        type: 'error',
      });
    }
  };

  const handleEditClick = (point: Point) => {
    setEditingPoint(point);
    setEditFormData({
      name: point.name,
      type: point.type,
      location: point.location,
      phone: point.phone,
      isActive: point.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPoint) return;

    try {
      await pointsApi.updatePoint(editingPoint._id, editFormData);
      showToast({ message: 'Точка успешно обновлена', type: 'success' });
      closeEditModal();
      loadPoints();
    } catch (error: any) {
      showToast({
        message: error.message || 'Ошибка обновления точки',
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

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPoint(null);
    setEditFormData(createInitialFormState());
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(createInitialFormState());
  };

  const openCreateModal = () => {
    setFormData(createInitialFormState());
    setShowCreateModal(true);
  };

  const getTypeName = (type: string) => {
    const types: Record<string, string> = {
      canteen: 'Столовая',
      store: 'Буфет',
    };
    return types[type] || type;
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
          onClick={openCreateModal}
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => handleEditClick(point)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Редактировать
                      </button>
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
                        className="text-red-600 hover:text-red-900"
                      >
                        Удалить
                      </button>
                    </div>
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
                  onClick={closeCreateModal}
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
                >
                  Создать
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              Редактировать точку {editingPoint ? `"${editingPoint.name}"` : ''}
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                type="text"
                placeholder="Название точки"
                value={editFormData.name}
                onChange={value =>
                  setEditFormData({ ...editFormData, name: value })
                }
                required
              />

              <Select
                value={editFormData.type}
                onChange={value =>
                  setEditFormData({
                    ...editFormData,
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
                value={editFormData.location}
                onChange={value =>
                  setEditFormData({ ...editFormData, location: value })
                }
                required
              />

              <Input
                type="tel"
                placeholder="Телефон"
                value={editFormData.phone}
                onChange={value =>
                  setEditFormData({ ...editFormData, phone: value })
                }
                required
              />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editFormData.isActive}
                  onChange={e =>
                    setEditFormData({
                      ...editFormData,
                      isActive: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="editIsActive"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Активная точка
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={closeEditModal}
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

export default PointManagement;
