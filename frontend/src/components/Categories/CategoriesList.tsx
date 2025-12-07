import { useUnit } from 'effector-react';
import React, { useEffect, useState } from 'react';
import {
  $categories,
  $categoriesError,
  $categoriesLoading,
  createCategory,
  deleteCategory,
  loadCategories,
  updateCategory,
} from '../../models/categories.ts';
import { $currentUser } from '../../models/users.ts';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../types/category.ts';
import Button from '../layout/Button/Button.tsx';
import { BookIcon, CheckIcon, CloseIcon } from '../icons/ServiceIcons';

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
  const [isLoadingState, setIsLoadingState] = useState(true);

  const isAdminOrCanteenManager =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'canteenManager' ||
    currentUser?.role === 'cateenManager';

  // Эффект для управления overflow body при открытии модалок
  useEffect(() => {
    if (showCreateModal || showEditModal || showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateModal, showEditModal, showDeleteModal]);

  useEffect(() => {
    handleLoadCategories();
    const timer = setTimeout(() => setIsLoadingState(false), 500);
    return () => clearTimeout(timer);
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

  const onUpdateCategory = (
    id: string,
    categoryData: UpdateCategoryRequest
  ) => {
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
    <div className="fade-in text-text-primary">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 transition-all duration-300">
          {error}
        </div>
      )}

      {/* Заголовок и кнопка создания */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Управление категориями
          </h2>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          size="md"
          className="flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          <span>Создать категорию</span>
        </Button>
      </div>

      {/* Сетка категорий */}
      {isLoading || isLoadingState ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-border-subtle shadow-sm animate-pulse"
            >
              <div className="h-6 bg-surface-muted rounded mb-3 w-3/4"></div>
              <div className="h-4 bg-surface-muted rounded mb-4 w-full"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-surface-muted rounded w-20"></div>
                <div className="h-6 bg-surface-muted rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={category._id}
              className="relative bg-white rounded-2xl p-6 border border-border-soft shadow-brand-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Верхняя градиентная полоска */}
              <div className="gradient-top h-1 rounded-t-lg mb-4 -mx-6 -mt-6"></div>

              {/* Меню действий */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={e => handleMenuClick(e, category._id)}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-border-soft shadow-sm flex items-center justify-center text-text-secondary hover:text-brand-indigo backdrop-blur-sm transition-all duration-300 hover:scale-110"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {menuOpen === category._id && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-brand-card z-20 border border-border-soft">
                    <button
                      onClick={() => handleEditClick(category)}
                      className="block w-full text-left px-4 py-3 text-sm text-text-primary hover:bg-brand-seashell transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      ✏️ Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category)}
                      className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                )}
              </div>

              {/* Контент категории */}
              <div className="pr-8">
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-text-secondary text-sm mb-4 leading-relaxed line-clamp-2">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-text-secondary font-mono bg-surface-muted px-2 py-1 rounded border border-border-subtle">
                    {category.slug}
                  </span>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                      category.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-surface-muted text-text-muted border-border-soft'
                    }`}
                  >
                    {category.is_active ? (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        Активна
                      </>
                    ) : (
                      <>
                        <CloseIcon className="w-4 h-4" />
                        Неактивна
                      </>
                    )}
                  </span>
                </div>
                {category.sort_order !== undefined && (
                  <div className="mt-3 text-xs text-text-muted">
                    Порядок: {category.sort_order}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {categories.length === 0 && !isLoading && !isLoadingState && (
        <div className="text-center py-16 fade-in">
          <div className="flex items-center justify-center text-text-muted mb-4">
            <BookIcon className="w-16 h-16" />
          </div>
          <p className="text-text-secondary text-xl font-medium mb-3">
            Категории не найдены
          </p>
          <p className="text-text-muted text-sm mb-6">
            Создайте первую категорию для организации вашего меню
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="md"
          >
            Создать первую категорию
          </Button>
        </div>
      )}

      {/* Модальные окна */}
      {showCreateModal && (
        <CategoryModal
          onClose={() => setShowCreateModal(false)}
          onSave={data => onCreateCategory(data as CreateCategoryRequest)}
        />
      )}

      {showEditModal && selectedCategory && (
        <CategoryModal
          category={selectedCategory}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
          onSave={data => onUpdateCategory(selectedCategory._id, data)}
        />
      )}

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

// Обновленный компонент модального окна с прокруткой внутри
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
    <div className="fixed inset-0 bg-brand-indigo/10 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border border-border-soft rounded-3xl p-8 max-w-md w-full shadow-brand-card my-8 text-text-primary">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">
            {category ? 'Редактировать категорию' : 'Создать новую категорию'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-muted hover:bg-white border border-border-soft flex items-center justify-center transition-all duration-200"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Название *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-border-soft bg-surface-muted text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all duration-200"
              placeholder="Например: Напитки"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Slug (уникальный идентификатор) *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-3 border border-border-soft bg-surface-muted text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all duration-200"
              placeholder="napiti"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-border-soft bg-surface-muted text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all duration-200"
              rows={3}
              placeholder="Описание категории..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Порядок сортировки
            </label>
            <input
              type="number"
              min="0"
              value={formData.sort_order}
              onChange={e =>
                setFormData({
                  ...formData,
                  sort_order: Number(e.target.value),
                })
              }
              className="w-full px-4 py-3 border border-border-soft bg-surface-muted text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="flex items-center text-text-secondary">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={e =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="mr-3 w-5 h-5 text-brand-indigo rounded focus:ring-brand-indigo bg-white border-border-soft"
              />
              <span className="text-sm font-medium">Активна</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" size="md">
              Отмена
            </Button>
            <Button type="submit" variant="primary" size="md">
              {category ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Обновленный компонент подтверждения удаления
const DeleteConfirmModal: React.FC<{
  categoryName: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ categoryName, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
         <div className="bg-white border border-border-soft rounded-3xl p-8 max-w-md w-full shadow-brand-card my-8 text-text-primary">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-300">⚠️</span>
          </div>
             <h2 className="text-xl font-bold text-text-primary mb-2">
            Подтверждение удаления
          </h2>
             <p className="text-text-secondary mb-6">
            Вы уверены, что хотите удалить категорию{' '}
            <strong>"{categoryName}"</strong>? Это действие нельзя отменить.
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
