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
import { $currentUser } from '../../models/users.ts';
import {
  $selectedPoint,
  setSelectedPoint,
} from '../../models/selectedPoint.ts';
import type { Point } from '../../types/points.ts';
import type {
  StockWithDetails,
  UpdateStockRequest,
  CreateStockRequest,
} from '../../types/stock.ts';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';
import Select from '../layout/Select/Select.tsx';
import PointSelector from '../Points/PointSelector.tsx';
import { showToast } from '../layout/Toast/stores/toastStore.ts';

export const StockManagement: React.FC = () => {
  const [
    points,
    stockWithDetails,
    stockError,
    items,
    currentUser,
    selectedPoint,
  ] = useUnit([
    $points,
    $stockWithDetails,
    $stockError,
    $items,
    $currentUser,
    $selectedPoint,
  ]);

  const [
    handleLoadPoints,
    handleLoadStock,
    handleLoadItems,
    handleUpdateStock,
    handleCreateStock,
    handleSetSelectedPoint,
  ] = useUnit([
    loadPoints,
    loadStockWithDetails,
    loadItems,
    updateStock,
    createStock,
    setSelectedPoint,
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStock, setEditingStock] = useState<StockWithDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
  });

  // Получаем точку администратора
  const adminPoint = currentUser?.point_id;
  const isPointAdmin = Boolean(adminPoint);

  useEffect(() => {
    handleLoadPoints();
    handleLoadItems();
  }, [handleLoadPoints, handleLoadItems]);

  // Автоматически выбираем точку администратора при загрузке
  useEffect(() => {
    if (isPointAdmin && adminPoint && points.length > 0 && !selectedPoint) {
      const pointExists = points.find(p => p._id === adminPoint);
      if (pointExists) {
        console.log(
          'Auto-selecting admin point in StockManagement:',
          adminPoint
        );
        handleSetSelectedPoint(adminPoint);
      }
    }
  }, [isPointAdmin, adminPoint, points, selectedPoint, handleSetSelectedPoint]);

  useEffect(() => {
    if (selectedPoint) {
      setIsLoading(true);
      handleLoadStock({ pointId: selectedPoint });
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [selectedPoint, handleLoadStock]);

  // Функция для быстрого создания stock для всех товаров
  const handleCreateStocksForAllItems = async () => {
    if (!selectedPoint) {
      showToast({ message: 'Выберите точку', type: 'error' });
      return;
    }

    try {
      const itemsWithoutStock = items.filter(item => {
        const existingStock = stockWithDetails.find(
          stock =>
            stock.productId === item._id && stock.pointId === selectedPoint
        );
        return !existingStock;
      });

      console.log(`Создаем stock для ${itemsWithoutStock.length} товаров`);

      for (const item of itemsWithoutStock) {
        await handleCreateStock({
          pointId: selectedPoint,
          productId: item._id,
          quantity: 100,
          reserved: 0,
        });
      }

      showToast({
        message: `Создано ${itemsWithoutStock.length} stock записей`,
        type: 'success',
      });

      // Перезагружаем данные
      handleLoadStock({ pointId: selectedPoint });
    } catch (error: any) {
      console.error('Bulk create error:', error);
      showToast({
        message: 'Ошибка при создании stock записей',
        type: 'error',
      });
    }
  };

  const handleSaveStock = async () => {
    if (!selectedPoint || !formData.productId || !formData.quantity) {
      showToast({ message: 'Заполните все обязательные поля', type: 'error' });
      return;
    }

    try {
      if (editingStock) {
        await handleUpdateStock({
          id: editingStock._id,
          data: { quantity: Number(formData.quantity) },
        });
        showToast({ message: 'Количество обновлено', type: 'success' });
      } else {
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

      if (selectedPoint) {
        handleLoadStock({ pointId: selectedPoint });
      }
    } catch (error: any) {
      console.error('Stock save error:', error);
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

  // Улучшенная функция для отображения статуса с конкретными числами
  const getStockStatus = (quantity: number, reserved: number) => {
    const available = quantity - reserved;

    if (available <= 0) {
      return {
        status: 'out-of-stock',
        text: 'Нет в наличии',
        description: 'Товар закончился',
        icon: '❌',
      };
    }

    if (available <= 5) {
      return {
        status: 'low-stock',
        text: `Осталось ${available}`,
        description: 'Мало товара',
        icon: '🚨',
      };
    }

    if (available <= 20) {
      return {
        status: 'medium-stock',
        text: `Осталось ${available}`,
        description: 'В наличии',
        icon: '⚠️',
      };
    }

    return {
      status: 'high-stock',
      text: `Много (${available})`,
      description: 'Много в наличии',
      icon: '✅',
    };
  };

  // Улучшенная функция для отображения доступности в таблице
  const renderAvailability = (stock: StockWithDetails) => {
    const status = getStockStatus(stock.quantity, stock.reserved);
    const statusClasses = {
      'out-of-stock': 'bg-red-100 text-red-800 border-red-200',
      'low-stock': 'bg-orange-100 text-orange-800 border-orange-200',
      'medium-stock': 'bg-blue-100 text-blue-800 border-blue-200',
      'high-stock': 'bg-green-100 text-green-800 border-green-200',
    };

    return (
      <div className="flex items-center space-x-2" title={status.description}>
        <span className="text-sm">{status.icon}</span>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusClasses[status.status]}`}
        >
          {status.text}
        </span>
      </div>
    );
  };

  const selectedPointInfo = points.find(p => p._id === selectedPoint);
  const availableItems = items.filter(item => {
    if (!selectedPoint) return true;
    const existingStock = stockWithDetails.find(
      stock => stock.productId === item._id && stock.pointId === selectedPoint
    );
    return !existingStock;
  });

  const filteredStock = stockWithDetails.filter(
    stock =>
      stock.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.product?.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Учет товаров
            {isPointAdmin && selectedPointInfo && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                • {selectedPointInfo.name}
              </span>
            )}
          </h2>
          <p className="text-gray-600">
            {isPointAdmin && selectedPointInfo
              ? `Управление остатками товаров в вашей точке`
              : 'Управление остатками товаров по точкам'}
          </p>
        </div>

        {selectedPoint && (
          <div className="flex gap-2">
            <Button onClick={handleAddClick} variant="primary" size="md">
              + Добавить товар
            </Button>
            <Button
              onClick={handleCreateStocksForAllItems}
              variant="outline"
              size="md"
            >
              📦 Заполнить склад
            </Button>
          </div>
        )}
      </div>

      {/* Используем новый компонент выбора точек */}
      {!isPointAdmin && (
        <PointSelector
          onPointSelect={handleSetSelectedPoint}
          showAdminInfo={false}
          title="Выберите точку для управления складом"
        />
      )}

      {isPointAdmin && selectedPointInfo && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-2xl">
                  {selectedPointInfo.type === 'canteen' ? '🍽️' : '🛍️'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-green-900 text-lg">
                  {selectedPointInfo.name}
                </h3>
                <p className="text-green-700 text-sm">
                  {selectedPointInfo.location}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {selectedPointInfo.type === 'canteen'
                      ? '🍽️ Столовая'
                      : '🛍️ Буфет'}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    👑 Ваша точка
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-600">
                📞 {selectedPointInfo.phone}
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedPointInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                {selectedPointInfo.name}
                {isPointAdmin && (
                  <span className="ml-2 text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                    Ваша точка
                  </span>
                )}
              </h3>
              <p className="text-sm text-blue-700">
                {selectedPointInfo.location} • 📞 {selectedPointInfo.phone}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                📦 Stock записей: {stockWithDetails.length} | 🛒 Товаров без
                stock: {availableItems.length} | 📊 Всего товаров:{' '}
                {items.length}
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

      {selectedPoint && (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <Input
              type="text"
              placeholder="Поиск товаров по названию или описанию..."
              value={searchQuery}
              onChange={setSearchQuery}
              icon="🔍"
            />
          </div>

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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Товар
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        На складе
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Зарезервировано
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Доступно
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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

                      return (
                        <tr
                          key={stock._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
                                {stock.product?.image_url ? (
                                  <img
                                    src={stock.product.image_url}
                                    alt={stock.product.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <span className="text-gray-400">🍽️</span>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {stock.product?.name || 'Неизвестный товар'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {stock.product?.price} ₽
                                </div>
                                {stock.product?.description && (
                                  <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                    {stock.product.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {stock.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                            {stock.reserved}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            {stock.available}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderAvailability(stock)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditClick(stock)}
                              className="text-green-600 hover:text-green-900 font-semibold hover:underline transition-colors"
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
        </>
      )}

      {!selectedPoint && (
        <div className="text-center py-12 bg-white rounded-xl">
          <div className="text-gray-300 text-6xl mb-4">🏪</div>
          <p className="text-gray-500 text-lg font-medium mb-2">
            {isPointAdmin
              ? 'Загрузка вашей точки...'
              : 'Выберите точку для управления складом'}
          </p>
          <p className="text-gray-400 text-sm">
            {isPointAdmin
              ? 'Информация о вашей точке загружается...'
              : 'Выберите точку из списка выше чтобы просмотреть и управлять товарами'}
          </p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto shadow-xl">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Доступно {availableItems.length} товаров без stock
                  </p>
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
