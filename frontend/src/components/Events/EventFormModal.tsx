import React, { useEffect, useState } from 'react';
import Button from '../layout/Button/Button';
import Input from '../layout/Input/Input';
import Select from '../layout/Select/Select';
import type { CreateEventPayload, Event } from '../../api/events';

interface EventFormModalProps {
  event?: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateEventPayload) => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  event,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<CreateEventPayload>({
    title: '',
    description: '',
    type: 'seminar',
    startDate: '',
    endDate: '',
    location: '',
    capacity: 50,
    requiresApproval: false,
    tags: [],
    status: 'draft',
  });

  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        title: event.title,
        description: event.description,
        type: event.type,
        startDate: new Date(event.startDate).toISOString().slice(0, 16),
        endDate: new Date(event.endDate).toISOString().slice(0, 16),
        location: event.location,
        capacity: event.capacity,
        requiresApproval: event.requiresApproval,
        tags: event.tags,
        status: event.status === 'draft' || event.status === 'published' ? event.status : 'draft',
      });
      setTagsInput(event.tags.join(', '));
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
        status: 'draft',
      });
      setTagsInput('');
    }
  }, [event, isOpen]);

  const handleInputChange = (field: keyof CreateEventPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate || !formData.location) {
      return; // Form validation will handle showing errors
    }

    // Parse tags from input
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onSave({ ...formData, tags });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {event ? 'Редактировать событие' : 'Создать событие'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название события *
              </label>
              <Input
                value={formData.title}
                onChange={(value) => handleInputChange('title', value)}
                placeholder="Введите название события"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Введите описание события"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип события *
              </label>
              <Select
                value={formData.type}
                onChange={(value) => handleInputChange('type', value as any)}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата и время начала *
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата и время окончания *
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Место проведения *
              </label>
              <Input
                value={formData.location}
                onChange={(value) => handleInputChange('location', value)}
                placeholder="Введите место проведения"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Вместимость *
              </label>
              <Input
                type="number"
                value={formData.capacity.toString()}
                onChange={(value) => handleInputChange('capacity', parseInt(value) || 0)}
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Теги (через запятую)
              </label>
              <Input
                value={tagsInput}
                onChange={(value) => setTagsInput(value)}
                placeholder="программирование, хакатон, студенты"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <Select
                value={formData.status || 'draft'}
                onChange={(value) => handleInputChange('status', value as any)}
                options={[
                  { value: 'draft', label: 'Черновик' },
                  { value: 'published', label: 'Опубликовать' },
                ]}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requiresApproval"
                checked={formData.requiresApproval}
                onChange={(e) => handleInputChange('requiresApproval', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="requiresApproval" className="text-sm text-gray-700">
                Требуется подтверждение регистрации
              </label>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" className="flex-1">
                {event ? 'Сохранить' : 'Создать'}
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventFormModal;
