import { useUnit } from 'effector-react';
import React, { useEffect, useState } from 'react';
import {
    $cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
} from '../../models/cart.ts';
import {
    $categoriesForSelect,
    loadCategories,
} from '../../models/categories.ts';
import {
    $items,
    $itemsError,
    createItem,
    deleteItem,
    loadItems,
    updateItem,
} from '../../models/items.ts';
import { $currentUser } from '../../models/users.ts';
import type { CreateItemRequest, UpdateItemRequest } from '../../types/item.ts';
import Button from '../layout/Button/Button.tsx';
import ImageBox from '../layout/ImageBox.tsx';
import Input from '../layout/Input/Input.tsx';
import Select from '../layout/Select/Select.tsx';
import { showToast } from '../layout/Toast/stores/toastStore.ts';
import ItemFormModal from '../Modal/ItemFormModal.tsx';
import ItemModal from '../Modal/ItemModal.tsx';
export const ItemsList: React.FC = () => {
  console.log('ItemsList: компонент рендерится');

  const [items, itemsError, currentUser, categoriesForSelect, cart] = useUnit([
    $items,
    $itemsError,
    $currentUser,
    $categoriesForSelect,
    $cart,
  ]);

  const handleLoadItems = useUnit(loadItems);
  const handleAddToCart = useUnit(addToCart);
  const handleUpdateQuantity = useUnit(updateCartItemQuantity);
  const handleRemoveFromCart = useUnit(removeFromCart);
  const handleLoadCategories = useUnit(loadCategories);
  const handleCreateItem = useUnit(createItem);
  const handleUpdateItem = useUnit(updateItem);
  const handleDeleteItem = useUnit(deleteItem);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [sortOption, setSortOption] = useState<'default' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'>('default');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<any>(null);

  const isAdminOrCanteenManager =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'canteenManager' ||
    currentUser?.role === 'cateenManager';

  useEffect(() => {
    console.log('ItemsList: начата загрузка товаров');
    console.log('ItemsList: currentUser =', currentUser);
    setIsLoading(true);
    handleLoadItems({});
    handleLoadCategories();
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [handleLoadItems, handleLoadCategories]);

  // Логируем загруженные товары
  useEffect(() => {
    console.log('ItemsList: items =', items);
    console.log('ItemsList: items.length =', items?.length);
    console.log('ItemsList: itemsError =', itemsError);
  }, [items, itemsError]);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpen(null);
    };
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpen]);

  const minPriceValue = priceRange.min !== '' ? Number(priceRange.min) : null;
  const maxPriceValue = priceRange.max !== '' ? Number(priceRange.max) : null;

  // Фильтрация и сортировка товаров
  const filteredItems = Array.isArray(items)
    ? items.filter(item => {
        const matchesSearch =
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description &&
            item.description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()));
        const matchesCategory =
          !selectedCategory || item.category_slug === selectedCategory;
        const matchesPrice =
          (minPriceValue === null || item.price >= minPriceValue) &&
          (maxPriceValue === null || item.price <= maxPriceValue);
        const isAvailable = item.is_available !== false;
        const matchesAvailability =
          availabilityFilter === 'all' ||
          (availabilityFilter === 'available' && isAvailable) ||
          (availabilityFilter === 'unavailable' && !isAvailable);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesPrice &&
          matchesAvailability
        );
      })
    : [];

  const sortedItems = [...filteredItems];
  switch (sortOption) {
    case 'price_asc':
      sortedItems.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      sortedItems.sort((a, b) => b.price - a.price);
      break;
    case 'name_asc':
      sortedItems.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'ru', {
          sensitivity: 'base',
        })
      );
      break;
    case 'name_desc':
      sortedItems.sort((a, b) =>
        (b.name || '').localeCompare(a.name || '', 'ru', {
          sensitivity: 'base',
        })
      );
      break;
    default:
      break;
  }

  const visibleItems = sortedItems;

  console.log('ItemsList: filteredItems.length =', visibleItems.length);

  // Получение количества товара в корзине
  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find(cartItem => cartItem.item._id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const onCreateItem = (
    itemData: CreateItemRequest,
    imageFile?: File | null
  ) => {
    handleCreateItem({ data: itemData, imageFile: imageFile ?? undefined });
    setShowCreateModal(false);
  };

  const onUpdateItem = (
    id: string,
    itemData: UpdateItemRequest,
    imageFile?: File | null
  ) => {
    handleUpdateItem({ id, data: itemData, imageFile: imageFile ?? undefined });
    setShowEditModal(false);
    setSelectedItem(null);
  };

  const onDeleteItem = (id: string) => {
    handleDeleteItem(id);
    setShowDeleteModal(false);
    setSelectedItem(null);
  };

  const handleMenuClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === itemId ? null : itemId);
  };

  const handleEditClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setSelectedItem(item);
    setMenuOpen(null);
    setShowEditModal(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setSelectedItem(item);
    setMenuOpen(null);
    setShowDeleteModal(true);
  };

  const handleItemClick = (item: any) => {
    setSelectedItemForModal(item);
    setItemModalOpen(true);
  };

  const handleAddToCartClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (item.is_available === false) {
      return;
    }
    handleAddToCart({
      _id: item._id,
      uniq_nom: item.uniq_nom || item._id,
      name: item.name,
      price: item.price,
      description: item.description,
      category_slug: item.category_slug,
      calories: item.calories,
      number_pribors: item.number_pribors,
      image_url: item.image_url,
      preparation_time: item.preparation_time,
    });

    showToast({
      message: 'Товар добавлен в корзину',
      type: 'success' as const,
    });
    console.log(1);
  };

  const handleIncreaseQuantity = (
    e: React.MouseEvent,
    item: { _id: string; is_available?: boolean }
  ) => {
    e.stopPropagation();
    if (item.is_available === false) {
      return;
    }
    const currentQuantity = getItemQuantity(item._id);
    handleUpdateQuantity({
      id: item._id,
      quantity: currentQuantity + 1,
    });
  };

  const handleDecreaseQuantity = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
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
    <div className="fade-in">
      {/* Сообщение об ошибке */}
      {itemsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-6 transition-all duration-300">
          {itemsError}
        </div>
      )}

      {/* Поиск и фильтрация */}
      <div className="mb-8 space-y-4">
        {/* Поле поиска */}
        {/* Поле поиска */}
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
        </div>

        {/* Табы категорий */}
        <div className="w-full">
          <div className="flex flex-wrap gap-2 hide-scrollbar overflow-x-auto pb-2">
            {/* Кнопка "Все категории" */}
            <button
              onClick={() => setSelectedCategory('')}
              className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                selectedCategory === ''
                  ? 'bg-green-dark text-white shadow-lg shadow-green-dark/25'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              Все категории
            </button>

            {/* Категории */}
            {categoriesForSelect.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  selectedCategory === category.value
                    ? 'bg-green-dark text-white shadow-lg shadow-green-dark/25'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Дополнительные фильтры */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ценовой диапазон (₽)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                placeholder="От"
                value={priceRange.min}
                onChange={value =>
                  setPriceRange(prev => ({ ...prev, min: value }))
                }
              />
              <Input
                type="number"
                min="0"
                placeholder="До"
                value={priceRange.max}
                onChange={value =>
                  setPriceRange(prev => ({ ...prev, max: value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус наличия
            </label>
            <Select
              value={availabilityFilter}
              onChange={value =>
                setAvailabilityFilter(value as 'all' | 'available' | 'unavailable')
              }
              options={[
                { value: 'all', label: 'Все товары' },
                { value: 'available', label: 'Только доступные' },
                { value: 'unavailable', label: 'Недоступные' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Сортировка
            </label>
            <Select
              value={sortOption}
              onChange={value =>
                setSortOption(
                  value as 'default' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'
                )
              }
              options={[
                { value: 'default', label: 'Без сортировки' },
                { value: 'price_asc', label: 'По цене ↑' },
                { value: 'price_desc', label: 'По цене ↓' },
                { value: 'name_asc', label: 'По алфавиту A→Я' },
                { value: 'name_desc', label: 'По алфавиту Я→A' },
              ]}
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => {
                setPriceRange({ min: '', max: '' });
                setAvailabilityFilter('all');
                setSortOption('default');
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        </div>
      </div>

      {/* Сетка товаров - 2 колонки на мобильных, 5 на десктопе */}
      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 gap-3">
          {[...Array(10)].map((_, index) => (
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
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 gap-3">
          {/* Карточка для создания нового товара */}
          {isAdminOrCanteenManager && (
            <div
              onClick={() => setShowCreateModal(true)}
              className="bg-white rounded-2xl p-3 border-2 border-dashed border-gray-300 hover:border-green-medium hover:shadow-lg transition-all duration-300 ease-out cursor-pointer flex items-center justify-center min-h-[180px] group"
            >
              <div className="text-center">
                <div className="text-3xl text-gray-400 mb-2 group-hover:text-green-medium transition-colors duration-300">
                  +
                </div>
                <h3 className="text-xs font-semibold text-gray-700 group-hover:text-green-dark">
                  Добавить блюдо
                </h3>
              </div>
            </div>
          )}

          {visibleItems.map(item => {
            const quantity = getItemQuantity(item._id);
            const isInCart = quantity > 0;
            const isAvailable = item.is_available !== false;
            const availabilityBadgeClasses = isAvailable
              ? 'bg-green-light text-green-darker border-green-lighter'
              : 'bg-gray-100 text-gray-500 border-gray-200';

            return (
              <div
                key={item._id}
                onClick={() => handleItemClick(item)}
                className="relative bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 ease-out cursor-pointer group"
              >
                {/* Троеточие для админов */}
                {isAdminOrCanteenManager && (
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={e => handleMenuClick(e, item._id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 border border-gray-200 text-[11px] font-semibold text-gray-600 shadow-sm hover:border-green-medium hover:text-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-light transition-all"
                    >
                      <span className="text-base leading-none">⋮</span>
                      <span>Меню</span>
                    </button>
                    {menuOpen === item._id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl z-20 border border-gray-200 backdrop-blur-sm overflow-hidden">
                        <button
                          onClick={e => handleEditClick(e, item)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-light/60 hover:text-green-darker transition-colors"
                        >
                          ✏️ Редактировать
                        </button>
                        <button
                          onClick={e => handleDeleteClick(e, item)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          🗑️ Удалить
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Изображение товара */}
                <div className="mb-3 w-full">
                  <ImageBox
                    src={item.image_url || item.image?.url}
                    alt={item.name}
                    aspect={3 / 2}
                    imgClassName="shadow-sm group-hover:shadow-md transition-shadow duration-300"
                  />
                </div>

                {/* Информация о товаре */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem]">
                    {item.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-green-dark">
                      {item.price} ₽
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${availabilityBadgeClasses}`}
                    >
                      {isAvailable ? 'Доступно' : 'Недоступно'}
                    </span>
                  </div>

                  {/* Кнопка добавления в корзину */}
                  {currentUser &&
                    (currentUser.role === 'admin' ||
                      currentUser.role === 'user') && (
                      <div className="mt-2">
                        {!isInCart ? (
                          <Button
                            onClick={
                              isAvailable
                                ? e => handleAddToCartClick(e, item)
                                : undefined
                            }
                            disabled={!isAvailable}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs py-1.5 px-2 truncate"
                          >
                            {isAvailable ? '🛒 В корзину' : 'Недоступно'}
                          </Button>
                        ) : (
                          <div className="flex items-center justify-between bg-green-light rounded-lg p-1">
                            <button
                              onClick={e => handleDecreaseQuantity(e, item._id)}
                              className="w-6 h-6 rounded-full bg-white text-green-dark flex items-center justify-center text-sm font-bold hover:bg-green-medium hover:text-white transition-all duration-200"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold text-green-darker mx-1 min-w-[20px] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={e => handleIncreaseQuantity(e, item)}
                              disabled={!isAvailable}
                              className="w-6 h-6 rounded-full bg-white text-green-dark flex items-center justify-center text-sm font-bold hover:bg-green-medium hover:text-white transition-all duration-200"
                            >
                              +
                            </button>
                          </div>
                        )}
                        {!isAvailable && isInCart && (
                          <p className="text-[11px] text-red-500 mt-1 text-center">
                            Товар недоступен, удалите его из корзины
                          </p>
                        )}
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Сообщение о пустом результате */}
      {!isLoading && visibleItems.length === 0 && (
        <div className="text-center py-16 fade-in">
          <div className="text-6xl text-gray-300 mb-4">🍽️</div>
          <p className="text-gray-500 text-xl font-medium mb-3">
            Товары не найдены
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {searchQuery ||
            selectedCategory ||
            priceRange.min ||
            priceRange.max ||
            availabilityFilter !== 'all'
              ? 'Попробуйте изменить параметры поиска'
              : 'Проверьте подключение к бэкенду или наличие товаров в базе'}
          </p>
          <Button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setPriceRange({ min: '', max: '' });
              setAvailabilityFilter('all');
              setSortOption('default');
              handleLoadItems({});
            }}
            variant="outline"
            size="md"
          >
            Сбросить фильтры
          </Button>
        </div>
      )}

      {/* Модальное окно товара */}
      <ItemModal
        item={selectedItemForModal}
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onEdit={
          isAdminOrCanteenManager
            ? item => {
                setSelectedItem(item);
                setShowEditModal(true);
              }
            : undefined
        }
        onDelete={
          isAdminOrCanteenManager
            ? item => {
                setSelectedItem(item);
                setShowDeleteModal(true);
              }
            : undefined
        }
      />

      {showCreateModal && (
        <ItemFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={(data, imageFile) =>
            onCreateItem(data as CreateItemRequest, imageFile)
          }
          categories={categoriesForSelect}
        />
      )}

      {showEditModal && selectedItem && (
        <ItemFormModal
          item={selectedItem}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          onSave={(data, imageFile) =>
            onUpdateItem(selectedItem._id, data as UpdateItemRequest, imageFile)
          }
          categories={categoriesForSelect}
        />
      )}
      {showDeleteModal && selectedItem && (
        <DeleteConfirmModal
          itemName={selectedItem.name}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedItem(null);
          }}
          onConfirm={() => onDeleteItem(selectedItem._id)}
        />
      )}
    </div>
  );
};

const DeleteConfirmModal: React.FC<{
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ itemName, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl my-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-600">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Подтверждение удаления
          </h2>
          <p className="text-gray-600 mb-6">
            Вы уверены, что хотите удалить блюдо{' '}
            <strong>"{itemName}"</strong>? Это действие нельзя отменить.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={onClose} variant="outline" size="md">
            Отмена
          </Button>
          <Button
            onClick={onConfirm}
            variant="secondary"
            size="md"
            className="bg-red-500 hover:bg-red-600 border-red-500"
          >
            Удалить
          </Button>
        </div>
      </div>
    </div>
  );
};
