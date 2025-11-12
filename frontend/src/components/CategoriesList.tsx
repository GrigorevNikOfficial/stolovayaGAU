import React, { useState, useEffect } from 'react';
import { useUnit } from 'effector-react';
import {
  $categories,
  $categoriesLoading,
  $categoriesError,
  loadCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../models/categories';
import { $currentUser } from '../models/users';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/category';

export const CategoriesList: React.FC = () => {
  const [categories, isLoading, error, currentUser] = useUnit([
    $categories,
    $categoriesLoading,
    $categoriesError,
    $currentUser,
  ]);

  const handleLoadCategories = useUnit(loadCategories);
  const handleCreateCategory = useUnit(createCategory);
  const handleUpdateCategory = useUnit(updateCategory);
  const handleDeleteCategory = useUnit(deleteCategory);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const isAdminOrCanteenManager =
    currentUser?.role === 'admin' || currentUser?.role === 'canteenManager' || currentUser?.role === 'cateenManager';

  useEffect(() => {
    handleLoadCategories();
  }, [handleLoadCategories]);

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

  const onCreateCategory = (categoryData: CreateCategoryRequest) => {
    handleCreateCategory(categoryData);
    setShowCreateModal(false);
  };

  const onUpdateCategory = (id: string, categoryData: UpdateCategoryRequest) => {
    handleUpdateCategory({ id, data: categoryData });
    setShowEditModal(false);
    setSelectedCategory(null);
  };

  const onDeleteCategory = (id: string) => {
    handleDeleteCategory(id);
    setShowDeleteModal(false);
    setSelectedCategory(null);
  };

  const handleMenuClick = (e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === categoryId ? null : categoryId);
  };

  const handleEditClick = (category: any) => {
    setSelectedCategory(category);
    setMenuOpen(null);
    setShowEditModal(true);
  };

  const handleDeleteClick = (category: any) => {
    setSelectedCategory(category);
    setMenuOpen(null);
    setShowDeleteModal(true);
  };

  if (!isAdminOrCanteenManager) {
    return null;
  }

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Категории</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          <span>Создать категорию</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow relative border border-gray-200"
            >
              {/* Троеточие для редактирования/удаления */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={(e) => handleMenuClick(e, category._id)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {menuOpen === category._id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                    <button
                      onClick={() => handleEditClick(category)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>

              <div className="pr-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">
                    Slug: {category.slug}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      category.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {category.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {categories.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Категории не найдены</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Создать первую категорию
          </button>
        </div>
      )}

      {/* Модальное окно для создания категории */}
      {showCreateModal && (
        <CategoryModal
          onClose={() => setShowCreateModal(false)}
          onSave={onCreateCategory}
        />
      )}

      {/* Модальное окно для редактирования категории */}
      {showEditModal && selectedCategory && (
        <CategoryModal
          category={selectedCategory}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
          onSave={(data) => onUpdateCategory(selectedCategory._id, data)}
        />
      )}

      {/* Модальное окно для подтверждения удаления */}
      {showDeleteModal && selectedCategory && (
        <DeleteConfirmModal
          categoryName={selectedCategory.name}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedCategory(null);
          }}
          onConfirm={() => onDeleteCategory(selectedCategory._id)}
        />
      )}
    </div>
  );
};

// Компонент модального окна для создания/редактирования категории
const CategoryModal: React.FC<{
  category?: any;
  onClose: () => void;
  onSave: (data: CreateCategoryRequest | UpdateCategoryRequest) => void;
}> = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    is_active: category?.is_active !== undefined ? category.is_active : true,
    sort_order: category?.sort_order || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      is_active: formData.is_active,
      sort_order: Number(formData.sort_order),
    };

    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">
          {category ? 'Редактировать категорию' : 'Создать новую категорию'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug (уникальный идентификатор) *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="napiti"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Порядок сортировки
            </label>
            <input
              type="number"
              min="0"
              value={formData.sort_order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sort_order: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Активна
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
              {category ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Компонент модального окна для подтверждения удаления
const DeleteConfirmModal: React.FC<{
  categoryName: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ categoryName, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Подтверждение удаления</h2>
        <p className="mb-6">
          Вы уверены, что хотите удалить категорию <strong>{categoryName}</strong>?
          Это действие нельзя отменить.
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

