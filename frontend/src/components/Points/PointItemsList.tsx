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
import {
  $selectedPoint,
  setSelectedPoint,
} from '../../models/selectedPoint.ts';
import PointSelector from './PointSelector.tsx';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';
import Select from '../layout/Select/Select.tsx';
import { showToast } from '../layout/Toast/stores/toastStore.ts';

export const PointItemsList: React.FC = () => {
  const [points, stockWithDetails, cart, currentUser, selectedPoint] = useUnit([
    $points,
    $stockWithDetails,
    $cart,
    $currentUser,
    $selectedPoint,
  ]);

  const [
    handleLoadPoints,
    handleLoadStock,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
    handleSetSelectedPoint,
  ] = useUnit([
    loadPoints,
    loadStockWithDetails,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    setSelectedPoint,
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activePoints = points.filter(point => point.isActive);

  // Получаем точку администратора
  const adminPoint = currentUser?.point_id;
  const isPointAdmin = Boolean(adminPoint);

  useEffect(() => {
    handleLoadPoints();
  }, [handleLoadPoints]);

  // Автоматически выбираем точку администратора при загрузке
  useEffect(() => {
    if (
      isPointAdmin &&
      adminPoint &&
      activePoints.length > 0 &&
      !selectedPoint
    ) {
      const pointExists = activePoints.find(p => p._id === adminPoint);
      if (pointExists) {
        console.log(
          'Auto-selecting admin point in PointItemsList:',
          adminPoint
        );
        handleSetSelectedPoint(adminPoint);
      }
    }
  }, [
    isPointAdmin,
    adminPoint,
    activePoints,
    selectedPoint,
    handleSetSelectedPoint,
  ]);

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

  // Функция получения количества товара в корзине
  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find(
      cartItem => cartItem.item && cartItem.item._id === itemId
    );
    return cartItem ? cartItem.quantity : 0;
  };

  // Фильтрация доступных товаров с проверкой
  const availableItems = stockWithDetails.filter(
    stock =>
      stock.available > 0 &&
      stock.product &&
      stock.product.is_available !== false
  );

  // Фильтрация по поиску и категории
  const filteredItems = availableItems.filter(stock => {
    if (!stock.product) return false;

    const matchesSearch =
      stock.product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.product.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || stock.product.category_slug === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Группировка по категориям
  const categories = [
    ...new Set(
      availableItems
        .map(stock => stock.product?.category_slug)
        .filter((cat): cat is string => Boolean(cat))
    ),
  ];

  const groupedItems = filteredItems.reduce(
    (acc, stock) => {
      if (!stock.product) return acc;

      const category = stock.product.category_slug || 'Без категории';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(stock);
      return acc;
    },
    {} as Record<string, typeof filteredItems>
  );

  // Улучшенная функция для отображения доступности
  const getAvailabilityDisplay = (available: number) => {
    if (available > 20) {
      return { text: 'Много', class: 'text-green-600', icon: '✅' };
    }
    if (available > 10) {
      return { text: 'В наличии', class: 'text-blue-600', icon: '📦' };
    }
    if (available > 5) {
      return {
        text: `Осталось ${available}`,
        class: 'text-orange-600',
        icon: '⚠️',
      };
    }
    if (available > 0) {
      return {
        text: `Осталось ${available}`,
        class: 'text-red-600',
        icon: '🚨',
      };
    }
    return { text: 'Нет в наличии', class: 'text-gray-500', icon: '❌' };
  };

  // Функция добавления в корзину
  const handleAddToCartClick = (stock: StockWithDetails) => {
    if (!stock.product) {
      console.error('Product is undefined for stock:', stock);
      showToast({
        message: 'Ошибка: товар не найден',
        type: 'error',
      });
      return;
    }

    // Создаем безопасный объект товара с полным типом Item
    const safeItem = {
      _id: stock.product._id || '',
      uniq_nom: stock.product.uniq_nom || stock.product._id || '',
      name: stock.product.name || 'Без названия',
      price: stock.product.price || 0,
      description: stock.product.description || '',
      category_slug: stock.product.category_slug || '',
      calories: stock.product.calories || 0,
      number_pribors: stock.product.number_pribors || 1,
      image_url: stock.product.image_url || '',
      preparation_time: stock.product.preparation_time || 0,
      is_available: stock.product.is_available !== false,
      // Добавляем обязательные поля из типа Item
      ingredients: stock.product.ingredients || [],
      allergens: stock.product.allergens || [],
      nutrition: stock.product.nutrition || {},
      sort_order: stock.product.sort_order || 0,
      created_at: stock.product.created_at || new Date().toISOString(),
      updated_at: stock.product.updated_at || new Date().toISOString(),
    };

    // Передаем объект с полем item как ожидает модель
    handleAddToCart({ item: safeItem });

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

  return (
    <div className="space-y-6">
      {/* Блок выбора точки без заголовка */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {/* Используем PointSelector без лишней информации */}
        <PointSelector showTitle={false} showAdminInfo={true} />
      </div>

      {/* Если точка выбрана - показываем товары */}
      {selectedPoint && (
        <>
          {/* Фильтры */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
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
                        value: cat,
                        label: cat,
                      })),
                    ]}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Список товаров */}
          {isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 gap-4">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse"
                >
                  <div className="w-full h-32 bg-gray-200 rounded-xl mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
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
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {category}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 gap-4 p-4">
                    {stocks.map(stock => {
                      if (!stock.product) return null;

                      const quantity = getItemQuantity(stock.product._id);
                      const isInCart = quantity > 0;
                      const availability = getAvailabilityDisplay(
                        stock.available
                      );

                      return (
                        <div
                          key={stock._id}
                          className="bg-gray-50 rounded-2xl p-4 border border-gray-200 hover:shadow-md hover:border-green-300 transition-all duration-300 hover:scale-105"
                        >
                          {/* Изображение */}
                          <div className="relative mb-3">
                            {stock.product.image_url ? (
                              <img
                                src={stock.product.image_url}
                                alt={stock.product.name}
                                className="w-full h-32 object-cover rounded-xl"
                              />
                            ) : (
                              <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                                <span className="text-3xl text-gray-400">
                                  🍽️
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Информация */}
                          <div className="space-y-3">
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem] mb-1">
                                {stock.product.name}
                              </h3>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-base font-bold text-green-600">
                                {stock.product.price} ₽
                              </span>
                              <span
                                className={`text-xs font-semibold ${availability.class}`}
                                title={`Доступно: ${stock.available} шт.`}
                              >
                                {availability.icon} {availability.text}
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
                                    className="w-full text-xs py-2 px-3 hover:bg-green-50 hover:border-green-300 transition-colors"
                                    disabled={stock.available === 0}
                                  >
                                    {stock.available === 0
                                      ? '❌ Нет в наличии'
                                      : '🛒 В корзину'}
                                  </Button>
                                ) : (
                                  <div className="flex items-center justify-between bg-green-100 rounded-lg p-2 border border-green-200">
                                    <button
                                      onClick={() =>
                                        handleDecreaseQuantity(
                                          stock.product!._id
                                        )
                                      }
                                      className="w-7 h-7 rounded-full bg-white text-green-700 flex items-center justify-center text-sm font-bold hover:bg-green-200 hover:text-green-900 transition-all duration-200 shadow-sm"
                                    >
                                      -
                                    </button>
                                    <span className="text-sm font-bold text-green-800 mx-2 min-w-[20px] text-center">
                                      {quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleIncreaseQuantity(
                                          stock.product!._id
                                        )
                                      }
                                      className="w-7 h-7 rounded-full bg-white text-green-700 flex items-center justify-center text-sm font-bold hover:bg-green-200 hover:text-green-900 transition-all duration-200 shadow-sm"
                                      disabled={quantity >= stock.available}
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
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="text-gray-300 text-6xl mb-4">🏪</div>
          <p className="text-gray-500 text-lg font-medium mb-2">
            {isPointAdmin
              ? 'Загрузка вашей точки...'
              : 'Выберите точку для просмотра товаров'}
          </p>
          <p className="text-gray-400 text-sm">
            {isPointAdmin
              ? 'Информация о вашей точке загружается...'
              : 'Выберите столовую или буфет из списка выше'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PointItemsList;
