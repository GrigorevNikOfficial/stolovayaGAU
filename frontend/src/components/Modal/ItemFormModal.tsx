// components/ItemFormModal/ItemFormModal.tsx
import React, { useState, useEffect } from 'react';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';
import Select from '../layout/Select/Select.tsx';

interface ItemFormModalProps {
  item?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any, imageFile?: File | null) => void;
  categories?: Array<{ value: string; label: string }>;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  categories = [],
}) => {
  const [formData, setFormData] = useState({
    uniq_nom: '', // Добавляем поле uniq_nom
    name: '',
    price: '',
    category_slug: '',
    description: '',
    calories: '',
    number_pribors: '',
    preparation_time: '',
    is_active: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Заполняем форму данными при редактировании
  useEffect(() => {
    if (item) {
      setFormData({
        uniq_nom: item.uniq_nom || '', // Заполняем uniq_nom
        name: item.name || '',
        price: item.price?.toString() || '',
        category_slug: item.category_slug || '',
        description: item.description || '',
        calories: item.calories?.toString() || '',
        number_pribors: item.number_pribors?.toString() || '',
        preparation_time: item.preparation_time?.toString() || '',
        is_active: item.is_active !== undefined ? item.is_active : true,
      });
      setImagePreview(item.image_url || item.image?.url || '');
    } else {
      // Сброс формы для создания
      setFormData({
        uniq_nom: '', // Сбрасываем uniq_nom
        name: '',
        price: '',
        category_slug: '',
        description: '',
        calories: '',
        number_pribors: '',
        preparation_time: '',
        is_active: true,
      });
      setSelectedImage(null);
      setImagePreview('');
    }
  }, [item, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Создаем превью
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация - добавляем uniq_nom в обязательные поля
    if (
      !formData.uniq_nom ||
      !formData.name ||
      !formData.price ||
      !formData.category_slug
    ) {
      alert(
        'Заполните обязательные поля: уникальный номер, название, цена, категория'
      );
      return;
    }

    // Подготовка данных
    const submitData = {
      uniq_nom: formData.uniq_nom, // Добавляем uniq_nom
      name: formData.name,
      price: Number(formData.price),
      category_slug: formData.category_slug,
      description: formData.description,
      calories: formData.calories ? Number(formData.calories) : undefined,
      number_pribors: formData.number_pribors
        ? Number(formData.number_pribors)
        : undefined,
      preparation_time: formData.preparation_time
        ? Number(formData.preparation_time)
        : undefined,
      is_active: formData.is_active,
    };

    console.log('Submitting item data:', submitData);
    console.log('Image file:', selectedImage);

    onSave(submitData, selectedImage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {item ? 'Редактировать товар' : 'Создать новый товар'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-300"
            >
              ×
            </button>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Изображение */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Изображение товара
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-2xl">🍽️</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, JPEG до 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Основные поля */}
            <div className="grid grid-cols-1 gap-4">
              {/* Добавляем поле uniq_nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Уникальный номер (uniq_nom) *
                </label>
                <Input
                  type="text"
                  value={formData.uniq_nom}
                  onChange={value => handleInputChange('uniq_nom', value)}
                  placeholder="Введите уникальный номер товара"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название товара *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={value => handleInputChange('name', value)}
                  placeholder="Введите название товара"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цена *
                  </label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={value => handleInputChange('price', value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Категория *
                  </label>
                  <Select
                    options={categories}
                    value={formData.category_slug}
                    onChange={value =>
                      handleInputChange('category_slug', value)
                    }
                    placeholder="Выберите категорию"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание *
                </label>
                <textarea
                  value={formData.description}
                  onChange={e =>
                    handleInputChange('description', e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-medium focus:border-transparent transition-all duration-300"
                  rows={3}
                  placeholder="Описание товара..."
                  required
                />
              </div>

              {/* Дополнительные поля */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Калории
                  </label>
                  <Input
                    type="number"
                    value={formData.calories}
                    onChange={value => handleInputChange('calories', value)}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Время приготовления (мин)
                  </label>
                  <Input
                    type="number"
                    value={formData.preparation_time}
                    onChange={value =>
                      handleInputChange('preparation_time', value)
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество приборов
                  </label>
                  <Input
                    type="number"
                    value={formData.number_pribors}
                    onChange={value =>
                      handleInputChange('number_pribors', value)
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e =>
                      handleInputChange(
                        'is_active',
                        e.target.checked.toString()
                      )
                    }
                    className="mr-3 w-5 h-5 text-green-dark rounded focus:ring-green-medium"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Товар активен
                  </span>
                </label>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                size="md"
              >
                Отмена
              </Button>
              <Button type="submit" variant="primary" size="md">
                {item ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ItemFormModal;
