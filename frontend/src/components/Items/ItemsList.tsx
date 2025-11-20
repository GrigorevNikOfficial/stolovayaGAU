import React, { useState, useEffect } from 'react';
import { useUnit } from 'effector-react';
import {
  $items,
  $itemsError,
  loadItems,
  createItem,
  updateItem,
  deleteItem,
} from '../../models/items.ts';
import {
  addToCart,
  $cart,
  updateCartItemQuantity,
  removeFromCart,
} from '../../models/cart.ts';
import { $currentUser } from '../../models/users.ts';
import {
  loadCategories,
  $categoriesForSelect,
} from '../../models/categories.ts';
import type { CreateItemRequest, UpdateItemRequest } from '../../types/item.ts';
import Button from '../layout/Button/Button.tsx';
import ItemModal from '../Modal/ItemModal.tsx';
import Input from '../layout/Input/Input.tsx';
import ItemFormModal from '../Modal/ItemFormModal.tsx';

export const ItemsList: React.FC = () => {
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
    setIsLoading(true);
    handleLoadItems({});
    handleLoadCategories();
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [handleLoadItems, handleLoadCategories]);

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

  // Фильтрация товаров
  const filteredItems = Array.isArray(items)
    ? items.filter(item => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory =
          !selectedCategory || item.category_slug === selectedCategory;
        return matchesSearch && matchesCategory;
      })
    : [];

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

  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setMenuOpen(null);
    setShowEditModal(true);
  };

  const handleDeleteClick = (item: any) => {
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
  };

  const handleIncreaseQuantity = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const currentQuantity = getItemQuantity(itemId);
    handleUpdateQuantity({
      id: itemId,
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

  const itemsArray = Array.isArray(items) ? items : [];

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

          {filteredItems.map((item, index) => {
            const quantity = getItemQuantity(item._id);
            const isInCart = quantity > 0;

            return (
              <div
                key={item._id}
                onClick={() => handleItemClick(item)}
                className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 ease-out cursor-pointer group"
              >
                {/* Троеточие для админов */}
                {isAdminOrCanteenManager && (
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={e => handleMenuClick(e, item._id)}
                      className="w-5 h-5 rounded-full bg-white/80 hover:bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 backdrop-blur-sm transition-all duration-300 text-xs"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    {menuOpen === item._id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl z-20 border border-gray-200 backdrop-blur-sm">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-green-light hover:text-green-darker transition-colors duration-300 first:rounded-t-lg last:rounded-b-lg"
                        >
                          ✏️ Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="block w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors duration-300 first:rounded-t-lg last:rounded-b-lg"
                        >
                          🗑️ Удалить
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Изображение товара */}
                <div className="relative mb-3">
                  {item.image_url || item.image?.url ? (
                    <img
                      src={item.image_url || item.image?.url}
                      alt={item.name}
                      className="w-full h-28 object-cover rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300"
                    />
                  ) : (
                    <div className="w-full h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl text-gray-300">🍽️</span>
                    </div>
                  )}
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
                  </div>

                  {/* Кнопка добавления в корзину */}
                  {currentUser &&
                    (currentUser.role === 'admin' ||
                      currentUser.role === 'user') && (
                      <div className="mt-2">
                        {!isInCart ? (
                          <Button
                            onClick={e => handleAddToCartClick(e, item)}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs py-1.5 px-2 truncate"
                          >
                            🛒 В корзину
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
                              onClick={e => handleIncreaseQuantity(e, item._id)}
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
      )}

      {/* Сообщение о пустом результате */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-16 fade-in">
          <div className="text-6xl text-gray-300 mb-4">🍽️</div>
          <p className="text-gray-500 text-xl font-medium mb-3">
            Товары не найдены
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {searchQuery || selectedCategory
              ? 'Попробуйте изменить параметры поиска'
              : 'Проверьте подключение к бэкенду или наличие товаров в базе'}
          </p>
          <Button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
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
        isInCart={
          selectedItemForModal
            ? getItemQuantity(selectedItemForModal._id) > 0
            : false
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

// Компоненты модальных окон остаются без изменений...
