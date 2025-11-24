// components/Stock/StockManagement.tsx
import { useUnit } from 'effector-react';
import React, { useEffect, useState } from 'react';
import { $points, loadPoints } from '../../models/points.ts';
import {
  $stockWithDetails,
  $stockError,
  loadStockWithDetails,
  updateStock,
  createStock,
} from '../../models/stock.ts';
import { $items, loadItems } from '../../models/items.ts';
import type { Point } from '../../types/points.ts';
import type {
  StockWithDetails,
  UpdateStockRequest,
  CreateStockRequest,
} from '../../types/stock.ts';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';
import Select from '../layout/Select/Select.tsx';
import { showToast } from '../layout/Toast/stores/toastStore.ts';

export const StockManagement: React.FC = () => {
  const [points, stockWithDetails, stockError, items] = useUnit([
    $points,
    $stockWithDetails,
    $stockError,
    $items,
  ]);

  const [
    handleLoadPoints,
    handleLoadStock,
    handleLoadItems,
    handleUpdateStock,
    handleCreateStock,
  ] = useUnit([
    loadPoints,
    loadStockWithDetails,
    loadItems,
    updateStock,
    createStock,
  ]);

  const [selectedPoint, setSelectedPoint] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStock, setEditingStock] = useState<StockWithDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Форма для добавления/редактирования
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
  });

  useEffect(() => {
    handleLoadPoints();
    handleLoadItems();
  }, [handleLoadPoints, handleLoadItems]);

  useEffect(() => {
    if (selectedPoint) {
      setIsLoading(true);
      handleLoadStock({ pointId: selectedPoint })
        .then(() => setIsLoading(false))
        .catch(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [selectedPoint, handleLoadStock]);

  // Фильтрация товаров для выбора (те, которых еще нет на складе)
  const availableItems = items.filter(item => {
    if (!selectedPoint) return true;
    const existingStock = stockWithDetails.find(
      stock => stock.productId === item._id && stock.pointId === selectedPoint
    );
    return !existingStock;
  });

  // Фильтрация stock по поиску
  const filteredStock = stockWithDetails.filter(
    stock =>
      stock.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.product?.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const handleSaveStock = async () => {
    if (!selectedPoint || !formData.productId || !formData.quantity) {
      showToast({ message: 'Заполните все обязательные поля', type: 'error' });
      return;
    }

    try {
      if (editingStock) {
        // Редактирование существующего stock
        await handleUpdateStock({
          id: editingStock._id,
          data: { quantity: Number(formData.quantity) },
        });
        showToast({ message: 'Количество обновлено', type: 'success' });
      } else {
        // Создание нового stock
        await handleCreateStock({
          pointId: selectedPoint,
          productId: formData.productId,
          quantity: Number(formData.quantity),
          reserved: 0,
        });
        showToast({ message: 'Товар добавлен на склад', type: 'success' });
      }

      setShowAddModal(false);
      setEditingStock(null);
      setFormData({ productId: '', quantity: '' });
    } catch (error: any) {
      showToast({
        message: error.message || 'Ошибка сохранения',
        type: 'error',
      });
    }
  };

  const handleEditClick = (stock: StockWithDetails) => {
    setEditingStock(stock);
    setFormData({
      productId: stock.productId,
      quantity: stock.quantity.toString(),
    });
    setShowAddModal(true);
  };

  const handleAddClick = () => {
    setEditingStock(null);
    setFormData({ productId: '', quantity: '' });
    setShowAddModal(true);
  };

  const getStockStatus = (quantity: number, reserved: number) => {
    const available = quantity - reserved;
    if (available <= 0)
      return { status: 'out-of-stock', text: 'Нет в наличии' };
    if (available <= 5) return { status: 'low-stock', text: 'Мало' };
    if (available <= 20) return { status: 'medium-stock', text: 'В наличии' };
    return { status: 'high-stock', text: 'Много' };
  };

  const selectedPointInfo = points.find(p => p._id === selectedPoint);

  return (
    <div className="space-y-6">
      {/* Заголовок и выбор точки */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Учет товаров
          </h2>
          <p className="text-gray-600">
            Управление остатками товаров по точкам
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="min-w-[300px]">
            <Select
              value={selectedPoint}
              onChange={setSelectedPoint}
              options={[
                { value: '', label: 'Выберите точку...', disabled: true },
                ...points.map(point => ({
                  value: point._id,
                  label: `${point.name} (${point.type === 'canteen' ? 'Столовая' : 'Буфет'})`,
                })),
              ]}
              placeholder="Выберите точку..."
            />
          </div>

          {selectedPoint && (
            <Button onClick={handleAddClick} variant="primary" size="md">
              + Добавить товар
            </Button>
          )}
        </div>
      </div>

      {/* Информация о выбранной точке */}
      {selectedPointInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                {selectedPointInfo.name}
              </h3>
              <p className="text-sm text-blue-700">
                {selectedPointInfo.location} • {selectedPointInfo.phone}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  selectedPointInfo.type === 'canteen'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {selectedPointInfo.type === 'canteen' ? 'Столовая' : 'Буфет'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Поиск */}
      {selectedPoint && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <Input
            type="text"
            placeholder="Поиск товаров..."
            value={searchQuery}
            onChange={setSearchQuery}
            icon="🔍"
          />
        </div>
      )}

      {/* Таблица stock */}
      {selectedPoint && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-dark"></div>
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-300 text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-lg font-medium mb-2">
                {searchQuery ? 'Товары не найдены' : 'Нет товаров на складе'}
              </p>
              <p className="text-gray-400 text-sm">
                {searchQuery
                  ? 'Попробуйте изменить поисковый запрос'
                  : 'Добавьте товары на склад этой точки'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Товар
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Категория
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      На складе
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Зарезервировано
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Доступно
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
                  {filteredStock.map(stock => {
                    const status = getStockStatus(
                      stock.quantity,
                      stock.reserved
                    );
                    const statusClasses = {
                      'out-of-stock': 'bg-red-100 text-red-800 border-red-200',
                      'low-stock':
                        'bg-orange-100 text-orange-800 border-orange-200',
                      'medium-stock':
                        'bg-blue-100 text-blue-800 border-blue-200',
                      'high-stock':
                        'bg-green-100 text-green-800 border-green-200',
                    };

                    return (
                      <tr key={stock._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {stock.product?.image?.url ? (
                              <img
                                src={stock.product.image.url}
                                alt={stock.product.name}
                                className="w-10 h-10 rounded-lg object-cover mr-3"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
                                <span className="text-gray-400">🍽️</span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {stock.product?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {stock.product?.price} ₽
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {stock.product?.category_slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stock.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                          {stock.reserved}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          {stock.available}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusClasses[status.status]}`}
                          >
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(stock)}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Изменить
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Сообщение если точка не выбрана */}
      {!selectedPoint && (
        <div className="text-center py-12 bg-white rounded-xl">
          <div className="text-gray-300 text-6xl mb-4">🏪</div>
          <p className="text-gray-500 text-lg font-medium mb-2">
            Выберите точку для управления складом
          </p>
          <p className="text-gray-400 text-sm">
            Выберите точку из списка выше чтобы просмотреть и управлять товарами
          </p>
        </div>
      )}

      {/* Модальное окно добавления/редактирования */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {editingStock ? 'Изменить количество' : 'Добавить товар на склад'}
            </h3>

            <div className="space-y-4">
              {!editingStock && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Товар *
                  </label>
                  <Select
                    value={formData.productId}
                    onChange={value =>
                      setFormData({ ...formData, productId: value })
                    }
                    options={[
                      { value: '', label: 'Выберите товар...', disabled: true },
                      ...availableItems.map(item => ({
                        value: item._id,
                        label: `${item.name} - ${item.price} ₽`,
                      })),
                    ]}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Количество на складе *
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={value =>
                    setFormData({ ...formData, quantity: value })
                  }
                  placeholder="Введите количество"
                  required
                />
              </div>

              {editingStock && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    📦 Текущий остаток: <strong>{editingStock.quantity}</strong>
                    <br />
                    🛒 Зарезервировано: <strong>{editingStock.reserved}</strong>
                    <br />✅ Доступно: <strong>{editingStock.available}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStock(null);
                  }}
                  variant="outline"
                  size="md"
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSaveStock}
                  variant="primary"
                  size="md"
                  className="flex-1"
                  disabled={
                    !formData.quantity || (!editingStock && !formData.productId)
                  }
                >
                  {editingStock ? 'Сохранить' : 'Добавить'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
