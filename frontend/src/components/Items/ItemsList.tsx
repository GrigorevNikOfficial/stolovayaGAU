import { useUnit } from 'effector-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import Input from '../layout/Input/Input.tsx';
import Select from '../layout/Select/Select.tsx';
import ItemFormModal from '../Modal/ItemFormModal.tsx';
import ItemModal from '../Modal/ItemModal.tsx';
import { showToast } from '../layout/Toast/stores/toastStore.ts';

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
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>(
    'all'
  );
  const [sortOption, setSortOption] = useState<'default' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'>(
    'default'
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<any>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categorySectionsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const groupedContainerRef = useRef<HTMLDivElement | null>(null);

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
  }, [handleLoadItems, handleLoadCategories, currentUser]);

  useEffect(() => {
    console.log('ItemsList: items =', items);
    console.log('ItemsList: items.length =', items?.length);
    console.log('ItemsList: itemsError =', itemsError);
  }, [items, itemsError]);

  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null);
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpen]);

  const minPriceValue = priceRange.min !== '' ? Number(priceRange.min) : null;
  const maxPriceValue = priceRange.max !== '' ? Number(priceRange.max) : null;

  const filteredItems = Array.isArray(items)
    ? items.filter(item => {
        const matchesSearch =
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesPrice =
          (minPriceValue === null || item.price >= minPriceValue) &&
          (maxPriceValue === null || item.price <= maxPriceValue);
        const isAvailable = item.is_available !== false;
        const matchesAvailability =
          availabilityFilter === 'all' ||
          (availabilityFilter === 'available' && isAvailable) ||
          (availabilityFilter === 'unavailable' && !isAvailable);

        return matchesSearch && matchesPrice && matchesAvailability;
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

  const categoryLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    categoriesForSelect.forEach(category => map.set(category.value, category.label));
    return map;
  }, [categoriesForSelect]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, { label: string; items: any[] }>();

    visibleItems.forEach(item => {
      const slug = item.category_slug || 'uncategorized';
      const label =
        categoryLabelMap.get(slug) ||
        item?.category?.name ||
        item?.category?.title ||
        'Без категории';

      if (!groups.has(slug)) {
        groups.set(slug, { label, items: [] });
      }
      groups.get(slug)!.items.push(item);
    });

    const orderedSlugs = categoriesForSelect.map(category => category.value);

    const orderedGroups: Array<{ key: string; label: string; items: any[] }> = [];

    orderedSlugs.forEach(slug => {
      const group = groups.get(slug);
      if (group) {
        orderedGroups.push({
          key: slug,
          label: group.label || categoryLabelMap.get(slug) || 'Без категории',
          items: group.items,
        });
        groups.delete(slug);
      }
    });

    groups.forEach((group, slug) => {
      orderedGroups.push({ key: slug, label: group.label, items: group.items });
    });

    return orderedGroups;
  }, [visibleItems, categoriesForSelect, categoryLabelMap]);

  const handleCategoryTabClick = (slug: string) => {
    setSelectedCategory(slug);
    if (!slug) {
      groupedContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const target = categorySectionsRef.current[slug];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find(cartItem => cartItem.item._id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const onCreateItem = (itemData: CreateItemRequest, imageFile?: File | null) => {
    handleCreateItem({ data: itemData, imageFile: imageFile ?? undefined });
    setShowCreateModal(false);
  };

  const onUpdateItem = (id: string, itemData: UpdateItemRequest, imageFile?: File | null) => {
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

  const renderAddCard = () => {
    if (!isAdminOrCanteenManager) {
      return null;
    }

    return (
      <div
        onClick={() => setShowCreateModal(true)}
        className="bg-white rounded-2xl p-3 border border-dashed border-border-soft hover:border-brand-indigo hover:shadow-brand-card transition-all duration-300 ease-out cursor-pointer flex items-center justify-center min-h-[160px] group"
      >
        <div className="text-center">
          <div className="text-3xl text-text-muted mb-2 group-hover:text-brand-indigo transition-colors duration-300">
            +
          </div>
          <h3 className="text-xs font-semibold text-text-secondary group-hover:text-text-primary">
            Добавить блюдо
          </h3>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in text-text-primary">
      {itemsError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 transition-all duration-300">
          {itemsError}
        </div>
      )}

      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="flex-1 w-full">
            <Input
              type="text"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <div className="flex flex-col gap-3 w-full md:w-[260px]">
            <Button
              variant="outline"
              size="md"
              className="w-full min-h-[52px]"
              onClick={() => setFiltersOpen(prev => !prev)}
            >
              {filtersOpen ? 'Скрыть фильтры' : 'Фильтры'}
            </Button>
          </div>
        </div>

        {filtersOpen && (
          <div className="rounded-2xl border border-border-soft bg-white p-4 shadow-brand-card">
            <div className="flex flex-col lg:flex-row flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-text-muted mb-2">
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

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-300 mb-2">
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

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-text-muted mb-2">
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

              <div className="flex items-end min-w-[180px]">
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
        )}

        <div className="w-full">
          <div className="flex gap-2 hide-scrollbar overflow-x-auto pb-2 flex-nowrap md:flex-wrap">
            <button
              onClick={() => handleCategoryTabClick('')}
              className={`flex-shrink-0 px-4 py-3 rounded-2xl font-medium transition-all duration-200 border ${
                selectedCategory === ''
                  ? 'bg-brand-indigo text-white border-brand-indigo shadow-brand-card'
                  : 'bg-white text-text-secondary border-border-soft hover:text-text-primary hover:border-brand-indigo'
              }`}
            >
              Все категории
            </button>

            {categoriesForSelect.map(category => (
              <button
                key={category.value}
                onClick={() => handleCategoryTabClick(category.value)}
                className={`flex-shrink-0 px-4 py-3 rounded-2xl font-medium transition-all duration-200 border ${
                  selectedCategory === category.value
                    ? 'bg-brand-indigo text-white border-brand-indigo shadow-brand-card'
                    : 'bg-white text-text-secondary border-border-soft hover:text-text-primary hover:border-brand-indigo'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 gap-3">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className="bg-[#2d2d2c] rounded-2xl p-3 border-2 border-[#3a3b3a] shadow-sm animate-pulse"
            >
              <div className="w-full h-28 bg-[#3a3b3a] rounded-xl mb-3"></div>
              <div className="h-4 bg-[#3a3b3a] rounded mb-2"></div>
              <div className="h-6 bg-[#3a3b3a] rounded mb-3 w-3/4"></div>
              <div className="h-8 bg-[#3a3b3a] rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10" ref={groupedContainerRef}>
          {groupedItems.length === 0 && isAdminOrCanteenManager && (
            <div className="grid grid-cols-2 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 gap-3">
              {renderAddCard()}
            </div>
          )}

          {groupedItems.map((group, groupIndex) => (
            <div
              key={group.key || group.label}
              ref={el => {
                const key = group.key || group.label;
                if (!key) {
                  return;
                }
                if (el) {
                  categorySectionsRef.current[key] = el;
                } else {
                  delete categorySectionsRef.current[key];
                }
              }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">{group.label}</h3>
                <span className="text-sm text-text-muted">{group.items.length} шт.</span>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 gap-3">
                {groupIndex === 0 && renderAddCard()}
                {group.items.map(item => {
                  const quantity = getItemQuantity(item._id);
                  const isInCart = quantity > 0;
                  const isAvailable = item.is_available !== false;
                  const availabilityBadgeClasses = isAvailable
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-surface-muted text-text-muted border border-border-soft';

                  return (
                    <div
                      key={item._id}
                      onClick={() => handleItemClick(item)}
                      className="relative bg-white rounded-2xl p-3 border border-border-soft shadow-brand-card hover:shadow-lg hover:border-brand-indigo/40 transition-all duration-300 ease-out cursor-pointer group"
                    >
                      {isAdminOrCanteenManager && (
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            onClick={e => handleMenuClick(e, item._id)}
                            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-border-soft shadow-sm flex items-center justify-center text-text-secondary hover:text-brand-indigo backdrop-blur-sm transition-all duration-300 text-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {menuOpen === item._id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-2xl shadow-brand-card z-20 border border-border-soft">
                              <button
                                onClick={e => handleEditClick(e, item)}
                                className="block w-full text-left px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-brand-seashell transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl"
                              >
                                Редактировать
                              </button>
                              <button
                                onClick={e => handleDeleteClick(e, item)}
                                className="block w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl"
                              >
                                Удалить
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="relative mb-2.5 w-full overflow-hidden rounded-xl">
                        <div className="relative w-full pb-[100%]">
                          {item.image_url || item.image?.url ? (
                              <img
                              src={item.image_url || item.image?.url}
                              alt={item.name}
                              className="absolute inset-0 w-full h-full object-cover shadow-sm group-hover:shadow-md transition-shadow duration-300"
                            />
                          ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-surface-muted to-white flex items-center justify-center border border-border-soft">
                                <span className="text-2xl text-text-muted">🍽️</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-text-primary line-clamp-2 leading-snug min-h-[3rem] text-center">
                          {item.name}
                        </h3>

                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-brand-indigo">{item.price} ₽</span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${availabilityBadgeClasses}`}
                          >
                            {isAvailable ? 'Доступно' : 'Недоступно'}
                          </span>
                        </div>

                        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'user') && (
                          <div className="mt-2">
                            {!isInCart ? (
                              <Button
                                onClick={isAvailable ? e => handleAddToCartClick(e, item) : undefined}
                                disabled={!isAvailable}
                                variant="outline"
                                size="md"
                                className="w-full text-sm py-2 px-3 truncate"
                              >
                                {isAvailable ? '🛒 В корзину' : 'Недоступно'}
                              </Button>
                            ) : (
                              <div className="flex items-center justify-between bg-brand-seashell border border-brand-indigo/30 rounded-xl p-1.5">
                                <button
                                  onClick={e => handleDecreaseQuantity(e, item._id)}
                                  className="w-8 h-8 rounded-full bg-white text-brand-indigo border border-brand-indigo/40 flex items-center justify-center text-base font-bold hover:bg-brand-indigo hover:text-white transition-all duration-200"
                                >
                                  -
                                </button>
                                <span className="text-base font-bold text-text-primary mx-2 min-w-[28px] text-center">
                                  {quantity}
                                </span>
                                <button
                                  onClick={e => handleIncreaseQuantity(e, item)}
                                  disabled={!isAvailable}
                                  className="w-8 h-8 rounded-full bg-white text-brand-indigo border border-brand-indigo/40 flex items-center justify-center text-base font-bold hover:bg-brand-indigo hover:text-white transition-all duration-200"
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
            </div>
          ))}
        </div>
      )}

      {!isLoading && visibleItems.length === 0 && (
        <div className="text-center py-16 fade-in">
          <div className="text-6xl text-text-muted mb-4">🍽️</div>
          <p className="text-text-secondary text-xl font-medium mb-3">Товары не найдены</p>
          <p className="text-text-muted text-sm mb-6">
            {searchQuery ||
            priceRange.min ||
            priceRange.max ||
            availabilityFilter !== 'all' ||
            sortOption !== 'default'
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

      <ItemModal item={selectedItemForModal} isOpen={itemModalOpen} onClose={() => setItemModalOpen(false)} />

      {showCreateModal && (
        <ItemFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={(data, imageFile) => onCreateItem(data as CreateItemRequest, imageFile)}
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Подтверждение удаления</h2>
          <p className="text-gray-600 mb-6">
            Вы уверены, что хотите удалить блюдо <strong>"{itemName}"</strong>? Это действие нельзя отменить.
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
