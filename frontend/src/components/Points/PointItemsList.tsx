// components/Points/PointItemsList.tsx
import { useUnit } from 'effector-react';
import React, { useEffect, useState } from 'react';
import { $points, loadPoints } from '../../models/points.ts';
import { $stockWithDetails, loadStockWithDetails } from '../../models/stock.ts';
import {
  $cart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
} from '../../models/cart.ts';
import { $currentUser } from '../../models/users.ts';
import type { Point } from '../../types/points.ts';
import type { StockWithDetails } from '../../types/stock.ts';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';
import Select from '../layout/Select/Select.tsx';
import { showToast } from '../layout/Toast/stores/toastStore.ts';

export const PointItemsList: React.FC = () => {
  const [points, stockWithDetails, cart, currentUser] = useUnit([
    $points,
    $stockWithDetails,
    $cart,
    $currentUser,
  ]);

  const [
    handleLoadPoints,
    handleLoadStock,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
  ] = useUnit([
    loadPoints,
    loadStockWithDetails,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
  ]);

  const [selectedPoint, setSelectedPoint] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Активные точки (столовые и буфеты)
  const activePoints = points.filter(point => point.isActive);

  useEffect(() => {
    handleLoadPoints();
  }, [handleLoadPoints]);

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

  // Получение количества товара в корзине
  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find(cartItem => cartItem.item._id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Фильтрация и группировка товаров
  const availableItems = stockWithDetails.filter(
    stock => stock.available > 0 && stock.product?.is_available !== false
  );

  // Фильтрация по поиску и категории
  const filteredItems = availableItems.filter(stock => {
    const matchesSearch =
      stock.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.product?.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || stock.product?.category_slug === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Группировка по категориям
  const categories = [
    ...new Set(
      availableItems.map(stock => stock.product?.category_slug).filter(Boolean)
    ),
  ];

  const groupedItems = filteredItems.reduce(
    (acc, stock) => {
      const category = stock.product?.category_slug || 'Без категории';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(stock);
      return acc;
    },
    {} as Record<string, typeof filteredItems>
  );

  // Функция для отображения статуса наличия
  const getAvailabilityText = (available: number) => {
    if (available > 20)
      return { text: 'В наличии много', class: 'text-green-600' };
    if (available > 10) return { text: 'В наличии', class: 'text-blue-600' };
    if (available > 5) return { text: 'Мало', class: 'text-orange-600' };
    return { text: 'Заканчивается', class: 'text-red-600' };
  };

  const handleAddToCartClick = (stock: StockWithDetails) => {
    if (!stock.product) return;

    handleAddToCart({
      _id: stock.product._id,
      uniq_nom: stock.product.uniq_nom || stock.product._id,
      name: stock.product.name,
      price: stock.product.price,
      description: stock.product.description,
      category_slug: stock.product.category_slug,
      calories: stock.product.calories,
      number_pribors: stock.product.number_pribors,
      image_url: stock.product.image_url,
      preparation_time: stock.product.preparation_time,
    });

    showToast({
      message: 'Товар добавлен в корзину',
      type: 'success',
    });
  };

  const handleIncreaseQuantity = (itemId: string) => {
    const currentQuantity = getItemQuantity(itemId);
    handleUpdateQuantity({
      id: itemId,
      quantity: currentQuantity + 1,
    });
  };

  const handleDecreaseQuantity = (itemId: string) => {
    const currentQuantity = getItemQuantity(itemId);
    if (currentQuantity === 1) {
      handleRemoveFromCart(itemId);
    } else {
      handleUpdateQuantity({
        id: itemId,
        quantity: currentQuantity - 1,
      });
    }
  };

  const selectedPointInfo = points.find(p => p._id === selectedPoint);

  return (
    <div className="space-y-6">
      {/* Выбор точки через селект */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Выберите точку для заказа
        </h2>

        <div className="max-w-md">
          <Select
            value={selectedPoint}
            onChange={setSelectedPoint}
            options={[
              { value: '', label: 'Выберите точку...', disabled: true },
              ...activePoints.map(point => ({
                value: point._id,
                label: `${point.name} (${point.type === 'canteen' ? 'Столовая' : 'Буфет'}) - ${point.location}`,
              })),
            ]}
            placeholder="Выберите точку..."
          />
        </div>

        {selectedPointInfo && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900">
                  {selectedPointInfo.name}
                </h3>
                <p className="text-sm text-green-700">
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
      </div>

      {/* Если точка выбрана - показываем товары */}
      {selectedPoint && (
        <>
          {/* Фильтры */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  icon="🔍"
                />
              </div>

              {categories.length > 0 && (
                <div className="w-full sm:w-64">
                  <Select
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={[
                      { value: '', label: 'Все категории' },
                      ...categories.map(cat => ({
                        value: cat as string,
                        label: cat as string,
                      })),
                    ]}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Информация о доступных товарах */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">
                  {selectedPointInfo?.name}
                </h3>
                <p className="text-sm text-blue-700">
                  Доступно товаров: {availableItems.length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-900">
                  Категорий: {categories.length}
                </p>
                <p className="text-xs text-blue-600">
                  {selectedPointInfo?.type === 'canteen' ? 'Столовая' : 'Буфет'}
                </p>
              </div>
            </div>
          </div>

          {/* Список товаров */}
          {isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 gap-3">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm animate-pulse"
                >
                  <div className="w-full h-28 bg-gray-200 rounded-xl mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="text-gray-300 text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-lg font-medium mb-2">
                {searchQuery || selectedCategory
                  ? 'Товары не найдены'
                  : 'Нет доступных товаров'}
              </p>
              <p className="text-gray-400 text-sm">
                {searchQuery || selectedCategory
                  ? 'Попробуйте изменить параметры поиска'
                  : 'В этой точке пока нет товаров в наличии'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, stocks]) => (
                <div
                  key={category}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="bg-gray-50 px-6 py-3 border-b">
                    <h3 className="font-semibold text-gray-900">{category}</h3>
                  </div>
                  <div className="grid grid-cols-2 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 gap-3 p-4">
                    {stocks.map(stock => {
                      const quantity = getItemQuantity(stock.productId);
                      const isInCart = quantity > 0;
                      const availability = getAvailabilityText(stock.available);

                      return (
                        <div
                          key={stock._id}
                          className="bg-gray-50 rounded-2xl p-3 border border-gray-200 hover:shadow-md transition-all duration-300"
                        >
                          {/* Изображение */}
                          <div className="relative mb-3">
                            {stock.product?.image_url ||
                            stock.product?.image?.url ? (
                              <img
                                src={
                                  stock.product.image_url ||
                                  stock.product.image?.url
                                }
                                alt={stock.product.name}
                                className="w-full h-28 object-cover rounded-xl"
                              />
                            ) : (
                              <div className="w-full h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                                <span className="text-2xl text-gray-400">
                                  🍽️
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Информация */}
                          <div className="space-y-2">
                            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem]">
                              {stock.product?.name}
                            </h3>

                            <div className="flex items-center justify-between">
                              <span className="text-base font-bold text-green-dark">
                                {stock.product?.price} ₽
                              </span>
                              <span
                                className={`text-[11px] font-semibold ${availability.class}`}
                              >
                                {availability.text}
                              </span>
                            </div>

                            {/* Кнопка добавления в корзину */}
                            {currentUser && (
                              <div className="mt-2">
                                {!isInCart ? (
                                  <Button
                                    onClick={() => handleAddToCartClick(stock)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs py-1.5 px-2"
                                  >
                                    🛒 В корзину
                                  </Button>
                                ) : (
                                  <div className="flex items-center justify-between bg-green-light rounded-lg p-1">
                                    <button
                                      onClick={() =>
                                        handleDecreaseQuantity(stock.productId)
                                      }
                                      className="w-6 h-6 rounded-full bg-white text-green-dark flex items-center justify-center text-sm font-bold hover:bg-green-medium hover:text-white transition-all duration-200"
                                    >
                                      -
                                    </button>
                                    <span className="text-sm font-bold text-green-darker mx-1 min-w-[20px] text-center">
                                      {quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleIncreaseQuantity(stock.productId)
                                      }
                                      className="w-6 h-6 rounded-full bg-white text-green-dark flex items-center justify-center text-sm font-bold hover:bg-green-medium hover:text-white transition-all duration-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Сообщение если точки не выбрана */}
      {!selectedPoint && (
        <div className="text-center py-12 bg-white rounded-xl">
          <div className="text-gray-300 text-6xl mb-4">🏪</div>
          <p className="text-gray-500 text-lg font-medium mb-2">
            Выберите точку для просмотра товаров
          </p>
          <p className="text-gray-400 text-sm">
            Выберите столовую или буфет из списка выше
          </p>
        </div>
      )}
    </div>
  );
};

export default PointItemsList;
