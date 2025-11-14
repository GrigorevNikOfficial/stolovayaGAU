import React, { useState, useEffect } from 'react';
import { useUnit } from 'effector-react';
import {
  $items,
  $itemsError,
  loadItems,
  createItem,
  updateItem,
  deleteItem,
} from '../models/items';
import { addToCart } from '../models/cart';
import { $currentUser } from '../models/users';
import {
  $categories,
  loadCategories,
  $categoriesForSelect,
} from '../models/categories';
import type { CreateItemRequest, UpdateItemRequest } from '../types/item';

export const ItemsList: React.FC = () => {
  const [items, itemsError, currentUser, categories, categoriesForSelect] =
    useUnit([
      $items,
      $itemsError,
      $currentUser,
      $categories,
      $categoriesForSelect,
    ]);

  const handleLoadItems = useUnit(loadItems);
  const handleAddToCart = useUnit(addToCart);
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

  const isAdminOrCanteenManager =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'canteenManager' ||
    currentUser?.role === 'cateenManager';

  useEffect(() => {
    console.log('ItemsList: начата загрузка товаров');
    handleLoadItems({});
    handleLoadCategories();
  }, [handleLoadItems, handleLoadCategories]);

  useEffect(() => {
    console.log('ItemsList: получены товары', items);
  }, [items]);

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

  const onCreateItem = (itemData: CreateItemRequest) => {
    handleCreateItem(itemData);
    setShowCreateModal(false);
  };

  const onUpdateItem = (id: string, itemData: UpdateItemRequest) => {
    handleUpdateItem({ id, data: itemData });
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

  // Проверяем что items - массив перед использованием map
  const itemsArray = Array.isArray(items) ? items : [];

  console.log('ItemsList: отрисовываем товары', itemsArray);

  return (
    <div>
      {/* Сообщение об ошибке */}
      {itemsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {itemsError}
        </div>
      )}

      {/* Поиск и фильтрация */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="w-64">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Все категории</option>
              {categoriesForSelect.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Сетка товаров */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Карточка для создания нового товара (только для admin и canteenManager) */}
        {isAdminOrCanteenManager && (
          <div
            onClick={() => setShowCreateModal(true)}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-gray-300 hover:border-indigo-500 flex items-center justify-center min-h-[400px]"
          >
            <div className="text-center p-6">
              <div className="text-6xl text-gray-400 mb-4">+</div>
              <h3 className="text-lg font-semibold text-gray-700">
                Добавить новое блюдо
              </h3>
            </div>
          </div>
        )}

        {filteredItems.map(item => (
          <div
            key={item._id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative"
          >
            {/* Троеточие для admin и canteenManager */}
            {isAdminOrCanteenManager && (
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={e => handleMenuClick(e, item._id)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {menuOpen === item._id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            )}

            {(item.image_url || item.image?.url) && (
              <img
                src={item.image_url || item.image?.url}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.name}
              </h3>

              {item.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-gray-900">
                  {item.price} ₽
                </span>
                {item.category_slug && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.category_slug}
                  </span>
                )}
              </div>

              {/* Дополнительная информация */}
              <div className="space-y-1 text-xs text-gray-500 mb-4">
                {item.calories && <div>Калории: {item.calories}</div>}
                {item.preparation_time && (
                  <div>Время приготовления: {item.preparation_time} мин</div>
                )}
                {item.number_pribors && (
                  <div>Приборы: {item.number_pribors}</div>
                )}
              </div>

              {currentUser &&
                (currentUser.role === 'admin' ||
                  currentUser.role === 'user') && (
                  <button
                    onClick={() =>
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
                      })
                    }
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors font-medium"
                  >
                    Добавить в заказ
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Товары не найдены</p>
          <p className="text-sm text-gray-400 mt-2">
            {searchQuery || selectedCategory
              ? 'Попробуйте изменить параметры поиска'
              : 'Проверьте подключение к бэкенду или наличие товаров в базе'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
              handleLoadItems({});
            }}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Сбросить фильтры
          </button>
        </div>
      )}

      {/* Модальное окно для создания товара */}
      {showCreateModal && (
        <ItemModal
          onClose={() => setShowCreateModal(false)}
          onSave={onCreateItem}
          categories={categoriesForSelect}
        />
      )}

      {/* Модальное окно для редактирования товара */}
      {showEditModal && selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          onSave={data => onUpdateItem(selectedItem._id, data)}
          categories={categoriesForSelect}
        />
      )}

      {/* Модальное окно для подтверждения удаления */}
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

// Компонент модального окна для создания/редактирования товара
const ItemModal: React.FC<{
  item?: any;
  onClose: () => void;
  onSave: (data: CreateItemRequest | UpdateItemRequest) => void;
  categories: Array<{ value: string; label: string }>;
}> = ({ item, onClose, onSave, categories }) => {
  const [formData, setFormData] = useState({
    uniq_nom: item?.uniq_nom || '',
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category_slug: item?.category_slug || '',
    calories: item?.calories || '',
    number_pribors: item?.number_pribors || '',
    preparation_time: item?.preparation_time || 5,
    is_available: item?.is_available !== undefined ? item.is_available : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      uniq_nom: formData.uniq_nom,
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      category_slug: formData.category_slug,
      is_available: formData.is_available,
    };

    if (formData.calories) submitData.calories = Number(formData.calories);
    if (formData.number_pribors)
      submitData.number_pribors = Number(formData.number_pribors);
    if (formData.preparation_time)
      submitData.preparation_time = Number(formData.preparation_time);

    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {item ? 'Редактировать товар' : 'Создать новый товар'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Уникальный номер *
            </label>
            <input
              type="text"
              required
              value={formData.uniq_nom}
              onChange={e =>
                setFormData({ ...formData, uniq_nom: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Цена (₽) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={e =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Категория *
              </label>
              <select
                required
                value={formData.category_slug}
                onChange={e =>
                  setFormData({ ...formData, category_slug: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Выберите категорию</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Калории
              </label>
              <input
                type="number"
                min="0"
                value={formData.calories}
                onChange={e =>
                  setFormData({
                    ...formData,
                    calories: e.target.value ? Number(e.target.value) : '',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Приборы
              </label>
              <input
                type="number"
                min="0"
                value={formData.number_pribors}
                onChange={e =>
                  setFormData({
                    ...formData,
                    number_pribors: e.target.value
                      ? Number(e.target.value)
                      : '',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Время приготовления (мин)
              </label>
              <input
                type="number"
                min="0"
                value={formData.preparation_time}
                onChange={e =>
                  setFormData({
                    ...formData,
                    preparation_time: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={e =>
                  setFormData({ ...formData, is_available: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Доступен для заказа
              </span>
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {item ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Компонент модального окна для подтверждения удаления
const DeleteConfirmModal: React.FC<{
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ itemName, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Подтверждение удаления</h2>
        <p className="mb-6">
          Вы уверены, что хотите удалить товар <strong>{itemName}</strong>? Это
          действие нельзя отменить.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};
