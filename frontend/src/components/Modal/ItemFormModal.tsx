// components/ItemFormModal/ItemFormModal.tsx
import React, { useEffect, useRef, useState } from 'react';
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
    uniq_nom: '',
    name: '',
    price: '',
    category_slug: '',
    description: '',
    calories: '',
    number_pribors: '',
    preparation_time: '',
    is_available: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        uniq_nom: item.uniq_nom || '',
        name: item.name || '',
        price: item.price?.toString() || '',
        category_slug: item.category_slug || '',
        description: item.description || '',
        calories: item.calories?.toString() || '',
        number_pribors: item.number_pribors?.toString() || '',
        preparation_time: item.preparation_time?.toString() || '',
        is_available: item.is_available !== undefined ? item.is_available : true,
      });
      setSelectedImage(null);
      setImagePreview(item.image_url || item.image?.url || '');
    } else {
      setFormData({
        uniq_nom: '',
        name: '',
        price: '',
        category_slug: '',
        description: '',
        calories: '',
        number_pribors: '',
        preparation_time: '',
        is_available: true,
      });
      setSelectedImage(null);
      setImagePreview('');
    }
  }, [item, isOpen]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = event => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.uniq_nom || !formData.name || !formData.price || !formData.category_slug) {
      alert('Заполните обязательные поля: уникальный номер, название, цена, категория');
      return;
    }

    const submitData = {
      uniq_nom: formData.uniq_nom,
      name: formData.name,
      price: Number(formData.price),
      category_slug: formData.category_slug,
      description: formData.description,
      calories: formData.calories ? Number(formData.calories) : undefined,
      number_pribors: formData.number_pribors ? Number(formData.number_pribors) : undefined,
      preparation_time: formData.preparation_time ? Number(formData.preparation_time) : undefined,
      is_available: formData.is_available,
    };

    onSave(submitData, selectedImage);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[#111213] border border-[#2b2c2d] rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.55)] max-w-2xl w-full max-h-[92vh] overflow-y-auto text-gray-100">
          <div className="flex items-center justify-between p-6 border-b border-[#2f3031]">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">
                {item ? 'Редактирование' : 'Новый товар'}
              </p>
              <h2 className="text-2xl font-bold text-white">{item ? 'Редактировать товар' : 'Создать товар'}</h2>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="w-10 h-10 rounded-2xl bg-[#1c1d1e] border border-[#343536] text-gray-400 hover:text-white hover:border-[#69e7b6] transition-all"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Изображение товара</label>
              <div
                className="relative w-full rounded-2xl border border-dashed border-[#3a3b3a] bg-[#1a1b1c] p-4 cursor-pointer group overflow-hidden"
                onClick={handleImageAreaClick}
              >
                <div className="relative w-full max-w-[160px] mx-auto">
                  <div className="relative w-full pb-[90%] rounded-2xl overflow-hidden border border-[#3a3b3a]">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-4xl text-gray-500">
                        <span>🍽️</span>
                        <p className="text-xs text-gray-400">Нажмите чтобы загрузить</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white">
                      Изменить изображение
                    </div>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <p className="text-xs text-gray-500 mt-4 text-center">PNG, JPG, JPEG до 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Уникальный номер (uniq_nom) *</label>
                <Input
                  type="text"
                  value={formData.uniq_nom}
                  onChange={value => handleInputChange('uniq_nom', value)}
                  placeholder="Введите уникальный номер товара"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Название товара *</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Цена *</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Категория *</label>
                  <Select
                    options={categories}
                    value={formData.category_slug}
                    onChange={value => handleInputChange('category_slug', value)}
                    placeholder="Выберите категорию"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Описание *</label>
                <textarea
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-3 border border-[#2f3031] rounded-xl bg-[#1b1c1d] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#106157] focus:border-transparent transition-all duration-300"
                  rows={3}
                  placeholder="Описание товара..."
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Калории</label>
                  <Input
                    type="number"
                    value={formData.calories}
                    onChange={value => handleInputChange('calories', value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Время приготовления (мин)</label>
                  <Input
                    type="number"
                    value={formData.preparation_time}
                    onChange={value => handleInputChange('preparation_time', value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Количество приборов</label>
                  <Input
                    type="number"
                    value={formData.number_pribors}
                    onChange={value => handleInputChange('number_pribors', value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Статус товара</label>
                <div className="flex rounded-2xl border border-[#2f3031] bg-[#18191a] p-1 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => handleInputChange('is_available', true)}
                    className={`flex-1 py-2 rounded-xl transition-all ${formData.is_available ? 'bg-[#106157] text-white' : 'text-gray-400'}`}
                  >
                    Доступен
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('is_available', false)}
                    className={`flex-1 py-2 rounded-xl transition-all ${!formData.is_available ? 'bg-[#3a3b3a] text-white' : 'text-gray-400'}`}
                  >
                    Недоступен
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-[#2f3031]">
              <Button type="button" onClick={onClose} variant="outline" size="md">
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
