import React, { useEffect, useRef, useState } from 'react';
import Button from '../layout/Button/Button';
import Input from '../layout/Input/Input';
import Select from '../layout/Select/Select';
import { eventsApi } from '../../api/events';
import type {
  CreateEventPayload,
  Event,
  UpdateEventPayload,
} from '../../api/events';

interface EventFormModalProps {
  event?: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: CreateEventPayload | UpdateEventPayload
  ) => void | Promise<void>;
}

type EventFormState = Omit<CreateEventPayload, 'status'> & {
  status: UpdateEventPayload['status'];
  imageKey?: UpdateEventPayload['imageKey'];
};

export const EventFormModal: React.FC<EventFormModalProps> = ({
  event,
  isOpen,
  onClose,
  onSave,
}) => {
  const toLocalInputValue = (isoString: string) => {
    const date = new Date(isoString);
    const tzOffset = date.getTimezoneOffset();
    date.setMinutes(date.getMinutes() - tzOffset);
    return date.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<EventFormState>({
    title: '',
    description: '',
    type: 'seminar',
    startDate: '',
    endDate: '',
    location: '',
    capacity: 50,
    requiresApproval: false,
    tags: [],
    status: 'registration_open',
    imageKey: undefined,
  });

  const [tagsInput, setTagsInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        title: event.title,
        description: event.description,
        type: event.type,
        startDate: toLocalInputValue(event.startDate),
        endDate: toLocalInputValue(event.endDate),
        location: event.location,
        capacity: event.capacity,
        requiresApproval: event.requiresApproval,
        tags: event.tags,
        status: event.status || 'registration_open',
        imageKey: event.image?.key,
      });
      setTagsInput(event.tags.join(', '));
      setImagePreview(event.image?.url || null);
    } else if (isOpen) {
      setFormData({
        title: '',
        description: '',
        type: 'seminar',
        startDate: '',
        endDate: '',
        location: '',
        capacity: 50,
        requiresApproval: false,
        tags: [],
        status: 'registration_open',
        imageKey: undefined,
      });
      setTagsInput('');
      setImagePreview(null);
    }
  }, [event, isOpen]);

  const handleInputChange = (field: keyof CreateEventPayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.description ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.location
    ) {
      return; // Form validation will handle showing errors
    }

    // Parse tags from input
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSave({ ...formData, tags });
  };

  const handleUploadImage = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const { key, url } = await eventsApi.uploadEventImage(file);
      setFormData(prev => ({ ...prev, imageKey: key }));
      setImagePreview(url);
    } catch (error) {
      console.error('Upload event image error', error);
      alert('Не удалось загрузить изображение');
    } finally {
      setUploading(false);
    }
  };

  const handleImageAreaClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[3px] transition-opacity" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-white via-white to-emerald-50/70 border border-emerald-100/80 rounded-[32px] shadow-[0_35px_90px_rgba(16,185,129,0.2)] max-w-3xl w-full max-h-[92vh] overflow-y-auto text-text-primary">
          <div className="flex items-center justify-between p-6 border-b border-emerald-100 bg-gradient-to-r from-white to-emerald-50/60">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-500 mb-1">
                {event ? 'Редактирование' : 'Новое событие'}
              </p>
              <h2 className="text-2xl font-bold text-brand-indigo">
                {event ? 'Редактировать событие' : 'Создать событие'}
              </h2>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="w-10 h-10 rounded-2xl border border-emerald-100 bg-white/80 text-emerald-700 hover:text-brand-indigo hover:border-brand-indigo/30 transition-all"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-[0.35em] text-text-secondary mb-2">
                Обложка события
              </label>
              <div
                className="relative w-full rounded-[28px] border border-dashed border-emerald-200 bg-white p-4 cursor-pointer group overflow-hidden shadow-sm"
                onClick={handleImageAreaClick}
              >
                <div className="relative w-full max-w-[200px] mx-auto">
                  <div className="relative w-full pb-[60%] rounded-2xl overflow-hidden border border-border-subtle bg-surface-base">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Превью события"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-secondary">
                        <span className="text-3xl">+</span>
                        <p className="text-xs text-text-muted">
                          Нажмите чтобы загрузить
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-emerald-700 font-semibold">
                      {uploading ? 'Загрузка...' : 'Изменить изображение'}
                    </div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => handleUploadImage(e.target.files?.[0])}
                  className="hidden"
                  disabled={uploading}
                />
                <p className="text-xs text-text-muted mt-4 text-center">
                  JPG/PNG/WebP до 5MB
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Название события *
                </label>
                <Input
                  value={formData.title}
                  onChange={value => handleInputChange('title', value)}
                  placeholder="Введите название события"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Описание *
                </label>
                <textarea
                  value={formData.description}
                  onChange={e =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder="Введите описание события"
                  className="w-full px-4 py-3 border border-border-subtle rounded-2xl bg-white text-text-primary shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-indigo/15 focus:border-brand-indigo transition-all duration-300"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Тип события *
                  </label>
                  <Select
                    value={formData.type}
                    onChange={value => handleInputChange('type', value as any)}
                    options={[
                      { value: 'seminar', label: 'Семинар' },
                      { value: 'hackathon', label: 'Хакатон' },
                      { value: 'party', label: 'Вечеринка' },
                      { value: 'workshop', label: 'Мастер-класс' },
                      { value: 'conference', label: 'Конференция' },
                      { value: 'other', label: 'Другое' },
                    ]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Статус
                  </label>
                  <Select
                    value={formData.status || 'draft'}
                    onChange={value =>
                      handleInputChange('status', value as any)
                    }
                    options={
                      event
                        ? [
                            { value: 'draft', label: 'Черновик' },
                            {
                              value: 'registration_open',
                              label: 'Регистрация открыта',
                            },
                            {
                              value: 'registration_closed',
                              label: 'Регистрация закрыта',
                            },
                            { value: 'ongoing', label: 'Идет' },
                            { value: 'completed', label: 'Завершено' },
                            { value: 'cancelled', label: 'Отменено' },
                          ]
                        : [
                            { value: 'draft', label: 'Черновик' },
                            {
                              value: 'registration_open',
                              label: 'Открыть регистрацию',
                            },
                          ]
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Дата и время начала *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={e =>
                      handleInputChange('startDate', e.target.value)
                    }
                    className="w-full px-4 py-3 border border-border-subtle rounded-2xl bg-white text-text-primary shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-indigo/15 focus:border-brand-indigo transition-all duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Дата и время окончания *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={e => handleInputChange('endDate', e.target.value)}
                    className="w-full px-4 py-3 border border-border-subtle rounded-2xl bg-white text-text-primary shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-indigo/15 focus:border-brand-indigo transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Место проведения *
                  </label>
                  <Input
                    value={formData.location}
                    onChange={value => handleInputChange('location', value)}
                    placeholder="Введите место проведения"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Вместимость *
                  </label>
                  <Input
                    type="number"
                    value={formData.capacity.toString()}
                    onChange={value =>
                      handleInputChange('capacity', parseInt(value) || 0)
                    }
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Теги (через запятую)
                  </label>
                  <Input
                    value={tagsInput}
                    onChange={value => setTagsInput(value)}
                    placeholder="программирование, хакатон, студенты"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Требуется подтверждение регистрации
                  </label>
                  <div className="flex rounded-2xl border border-border-subtle bg-white p-1 text-sm font-semibold shadow-sm">
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange('requiresApproval', false)
                      }
                      className={`flex-1 py-2 rounded-xl transition-all ${
                        !formData.requiresApproval
                          ? 'bg-emerald-50 text-emerald-900 shadow-[0_6px_20px_rgba(16,185,129,0.3)]'
                          : 'text-text-secondary'
                      }`}
                    >
                      Без подтверждения
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange('requiresApproval', true)
                      }
                      className={`flex-1 py-2 rounded-xl transition-all ${
                        formData.requiresApproval
                          ? 'bg-amber-50 text-amber-800 shadow-[0_6px_20px_rgba(251,191,36,0.3)]'
                          : 'text-text-secondary'
                      }`}
                    >
                      С подтверждением
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-emerald-100">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                size="md"
              >
                Отмена
              </Button>
              <Button type="submit" variant="primary" size="md">
                {event ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventFormModal;
