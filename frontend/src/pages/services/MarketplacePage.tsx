import { useUnit } from 'effector-react';
import React from 'react';
import { marketplaceApi } from '../../api/services';
import { serviceRequestsApi } from '../../api/service-requests';
import { uploadsApi, type MarketplaceUploadResponse } from '../../api/uploads';
import Button from '../../components/layout/Button/Button';
import Input from '../../components/layout/Input/Input';
import Select from '../../components/layout/Select/Select';
import ServiceHeader from '../../components/layout/ServiceHeader/ServiceHeader.tsx';
import TopUpRequestModal from '../../components/Modal/TopUpRequestModal';
import { CheckIcon, EyeIcon, LeafIcon } from '../../components/icons/ServiceIcons.tsx';
import NotificationBell from '../../components/Notifications/NotificationBell.tsx';
import { showToast } from '../../components/layout/Toast/stores/toastStore';
import { $currentUser, getMeFx } from '../../models/users';
import { onSocketEvent } from '../../lib/socket';
import { formatBalance } from '../../utils/formatBalance';
import { isAuthPath, markAuthRedirect } from '../../utils/authRedirect';
import { getStoredServiceTags, SERVICE_TAG_STORAGE_KEY } from '../../utils/serviceTags';
import type {
  MarketplaceListingMode,
  ServiceListing,
  ServiceListPagination,
  ServiceListQuery,
  ServiceRequest,
  ServiceSort,
  UpdateServiceRequestStatusPayload,
} from '../../types/services';
import type { User } from '../../types/user';
type FiltersState = {
  search: string;
  category: string;
  pricingType: '' | ServiceListing['pricingType'];
  sort: ServiceSort;
  minPrice: string;
  maxPrice: string;
  includeInactive: boolean;
  page: number;
  mode: MarketplaceListingMode;
};

type UploadedAttachment = MarketplaceUploadResponse;

type CreateServiceFormFields = {
  title: string;
  description: string;
  pricingType: ServiceListing['pricingType'];
  price: string;
  tagsInput: string;
};

type CreateServiceFormValues = CreateServiceFormFields & {
  attachments: UploadedAttachment[];
};

type RequestStatusAction = UpdateServiceRequestStatusPayload['status'];

const DEFAULT_FILTERS: FiltersState = {
  search: '',
  category: '',
  pricingType: '',
  sort: 'newest',
  minPrice: '',
  maxPrice: '',
  includeInactive: false,
  page: 1,
  mode: 'request',
};

const MAX_MARKETPLACE_ATTACHMENTS = 5;

const priceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const sortRequestsByDateDesc = (list: ServiceRequest[]) =>
  [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

const upsertRequestInList = (list: ServiceRequest[], request: ServiceRequest) => {
  const next = [...list];
  const index = next.findIndex(item => item.id === request.id);

  if (index === -1) {
    next.unshift(request);
  } else {
    next[index] = request;
  }

  return sortRequestsByDateDesc(next);
};

const removeRequestById = (list: ServiceRequest[], id: string) =>
  list.filter(request => request.id !== id);

const resolveRequestMode = (request: ServiceRequest): MarketplaceListingMode =>
  request.type ?? request.service?.mode ?? 'request';

const isListingOwnerForRequest = (request: ServiceRequest, userId?: string) => {
  if (!userId) {
    return false;
  }
  const mode = resolveRequestMode(request);
  return mode === 'request'
    ? request.customer?.id === userId
    : request.provider?.id === userId;
};

const isRequestRelevantForScope = (
  request: ServiceRequest,
  scope: 'customer' | 'provider',
  userId?: string
) => {
  if (!userId) {
    return false;
  }

  return scope === 'customer'
    ? request.customer?.id === userId
    : request.provider?.id === userId;
};

const isPendingIncomingForUser = (request: ServiceRequest, userId?: string) =>
  Boolean(userId && request.status === 'pending' && isListingOwnerForRequest(request, userId));

type SocketRequestPayload = Partial<ServiceRequest> & { id?: string };

const sanitizeSocketRequest = (payload?: SocketRequestPayload | null): ServiceRequest | null => {
  if (!payload || typeof payload.id !== 'string' || !payload.status || payload.price === undefined) {
    return null;
  }

  // Socket payload already mirrors API response; fill safe defaults for strict fields.
  return {
    files: payload.files ?? [],
    ...payload,
  } as ServiceRequest;
};

const collectTagsFromListings = (list: ServiceListing[]): string[] => {
  const deduped = new Map<string, string>();
  list.forEach(service => {
    (service.tags ?? []).forEach(tag => {
      const trimmed = tag.trim();
      if (!trimmed) {
        return;
      }
      const key = trimmed.toLowerCase();
      if (!deduped.has(key)) {
        deduped.set(key, trimmed);
      }
    });
  });
  return Array.from(deduped.values());
};

const mapFiltersToQuery = (filters: FiltersState): ServiceListQuery => {
  const query: ServiceListQuery = {
    page: filters.page,
    sort: filters.sort,
  };

  if (filters.search.trim()) {
    query.search = filters.search.trim();
  }
  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.pricingType) {
    query.pricingType = filters.pricingType;
  }
  if (filters.minPrice) {
    const min = Number(filters.minPrice);
    if (!Number.isNaN(min)) {
      query.minPrice = min;
    }
  }
  if (filters.maxPrice) {
    const max = Number(filters.maxPrice);
    if (!Number.isNaN(max)) {
      query.maxPrice = max;
    }
  }
  if (filters.includeInactive) {
    query.includeInactive = true;
  }
  if (filters.mode) {
    query.mode = filters.mode;
  }

  return query;
};

type MarketplaceRole = 'guest' | User['role'];

type MarketplaceTabId = 'catalog_request' | 'catalog_offer' | 'manage' | 'requests';

type MarketplaceTab = {
  id: MarketplaceTabId;
  label: string;
  icon?: React.ReactNode;
  roles: MarketplaceRole[];
  badge?: number;
  mode?: MarketplaceListingMode;
  description?: string;
  disabled?: boolean;
};

const MARKETPLACE_TABS: MarketplaceTab[] = [
  {
    id: 'catalog_request',
    label: 'Заказы',
    description: 'Создавайте задачи с замороженным бюджетом',
    roles: ['guest', 'user', 'admin', 'canteenManager', 'cateenManager', 'storeManager'],
    mode: 'request',
  },
  {
    id: 'catalog_offer',
    label: 'Услуги',
    description: 'Предлагайте свои навыки коллегам',
    roles: ['guest', 'user', 'admin', 'canteenManager', 'cateenManager', 'storeManager'],
    mode: 'offer',
  },
  {
    id: 'manage',
    label: 'Создать',
    roles: ['user', 'admin', 'canteenManager', 'cateenManager', 'storeManager'],
  },
  {
    id: 'requests',
    label: 'Уведомления',
    roles: ['user', 'admin', 'canteenManager', 'cateenManager', 'storeManager'],
  },
];


const getMarketplaceTabs = (user: User | null): MarketplaceTab[] => {
  const role: MarketplaceRole = user?.role ?? 'guest';
  return MARKETPLACE_TABS.filter(tab => tab.roles.includes(role));
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-[32px] border border-border-soft bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.35)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          {title ? (
            <div>
              <h2 className="mt-1 text-2xl font-semibold text-brand-indigo">{title}</h2>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-soft text-text-secondary transition-colors hover:border-brand-indigo/50 hover:text-brand-indigo"
            aria-label="Закрыть модальное окно"
          >
            ×
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
};

const DEFAULT_CATEGORY_VALUE = 'general';

const formatFileSize = (bytes?: number) => {
  if (!bytes || Number.isNaN(bytes)) {
    return '';
  }
  if (bytes < 1024) {
    return `${bytes.toFixed(0)} Б`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} КБ`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

const resolveAttachmentName = (source: string, fallback: string) => {
  if (!source) {
    return fallback;
  }

  try {
    const url = new URL(source);
    const raw = url.pathname.split('/').pop() || fallback;
    const clean = raw.split('?')[0];
    const decoded = decodeURIComponent(clean);
    return decoded || fallback;
  } catch {
    const plain = source.split('/').pop() || fallback;
    try {
      return decodeURIComponent(plain.split('?')[0] || fallback);
    } catch {
      return plain || fallback;
    }
  }
};

type AttachmentFieldProps = {
  label: string;
  description: string;
  attachments: UploadedAttachment[];
  isUploading: boolean;
  onSelectFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (key: string) => void;
  maxAttachments?: number;
};

const AttachmentField: React.FC<AttachmentFieldProps> = ({
  label,
  description,
  attachments,
  isUploading,
  onSelectFiles,
  onRemoveAttachment,
  maxAttachments = MAX_MARKETPLACE_ATTACHMENTS,
}) => {
  const isLimitReached = attachments.length >= maxAttachments;
  const buttonLabel = isUploading
    ? 'Загружаем...'
    : isLimitReached
    ? 'Лимит файлов достигнут'
    : 'Прикрепить файлы';

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
      <label
        className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border-soft px-4 py-3 text-sm font-semibold transition-colors ${
          isLimitReached
            ? 'cursor-not-allowed bg-surface-muted/60 text-text-secondary'
            : 'bg-surface-muted text-brand-indigo hover:border-brand-indigo'
        } ${isUploading ? 'animate-pulse' : ''}`}
      >
        <input
          type="file"
          className="hidden"
          multiple
          onChange={onSelectFiles}
          disabled={isUploading || isLimitReached}
        />
        {buttonLabel}
      </label>
      {attachments.length > 0 ? (
        <ul className="space-y-2 text-sm text-text-secondary">
          {attachments.map(attachment => (
            <li
              key={attachment.key}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border-soft bg-white px-4 py-2"
            >
              <div className="flex flex-col">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-indigo hover:underline"
                >
                  {attachment.name || attachment.key}
                </a>
                {attachment.size ? (
                  <span className="text-xs text-text-muted">{formatFileSize(attachment.size)}</span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onRemoveAttachment(attachment.key)}
                className="text-xs font-semibold text-text-secondary hover:text-brand-indigo"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-text-secondary">Форматы: PDF, PNG, JPG, DOCX. До {maxAttachments} файлов.</p>
      )}
    </div>
  );
};

const PRICING_OPTIONS = [
  { label: 'Любой формат оплаты', value: '' },
  { label: 'Фиксированная стоимость', value: 'fixed' },
];

const SORT_OPTIONS = [
  { label: 'Сначала новые', value: 'newest' },
  { label: 'Сначала старые', value: 'oldest' },
  { label: 'Цена: по возрастанию', value: 'price_asc' },
  { label: 'Цена: по убыванию', value: 'price_desc' },
  { label: 'По рейтингу', value: 'rating' },
];

const MODE_BADGE_STYLES: Record<MarketplaceListingMode, string> = {
  request: 'bg-amber-50 text-amber-700 border-amber-200',
  offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const MODE_OWNER_LABEL: Record<MarketplaceListingMode, string> = {
  request: 'Автор задачи',
  offer: 'Исполнитель',
};

const MODE_PRIMARY_ACTION: Record<MarketplaceListingMode, string> = {
  request: 'Откликнуться',
  offer: 'Заказать услугу',
};

const DEFAULT_SERVICE_TAGS = [
  'дизайн',
  'фотография',
  'монтаж видео',
  'копирайтинг',
  'перевод',
  'репетиторство',
  'frontend',
  'backend',
  'презентации',
  'smm',
  'таргет',
  'аналитика данных',
  'excel',
  'python',
  'figma',
  'иллюстрация',
  '3d-моделирование',
  'черчение',
  'курсовая',
  'контрольная',
  'event',
  'маркетинг',
  'crm',
  'юридическая помощь',
  'финансы',
  'логистика',
  'ремонт техники',
  'доставка',
  'автосервис',
  'фандрайзинг',
  'психология',
];


const createInitialServiceFormFields = (): CreateServiceFormFields => ({
  title: '',
  description: '',
  pricingType: 'fixed',
  price: '',
  tagsInput: '',
});

const CreateServiceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateServiceFormValues) => void | Promise<void>;
  isSubmitting: boolean;
  mode: MarketplaceListingMode;
  availableTags: string[];
}> = ({ isOpen, onClose, onSubmit, isSubmitting, mode, availableTags = [] }) => {
  const [formState, setFormState] = React.useState<CreateServiceFormFields>(() => createInitialServiceFormFields());
  const [attachments, setAttachments] = React.useState<UploadedAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFormState(createInitialServiceFormFields());
      setAttachments([]);
    }
  }, [isOpen]);

  const updateField = (field: keyof CreateServiceFormFields, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      ...formState,
      attachments,
    });
  };

  const handleAttachmentsSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = event.target.files;
    if (!filesList?.length) {
      return;
    }

    const availableSlots = MAX_MARKETPLACE_ATTACHMENTS - attachments.length;
    if (availableSlots <= 0) {
      showToast({ message: `Можно прикрепить до ${MAX_MARKETPLACE_ATTACHMENTS} файлов`, type: 'error' });
      event.target.value = '';
      return;
    }

    const filesToUpload = Array.from(filesList).slice(0, availableSlots);
    setIsUploadingAttachment(true);
    try {
      const uploaded: UploadedAttachment[] = [];
      for (const file of filesToUpload) {
        const result = await uploadsApi.uploadMarketplaceAttachment(file);
        uploaded.push(result);
      }
      setAttachments(prev => [...prev, ...uploaded]);
    } catch (error: any) {
      showToast({ message: error.message || 'Не удалось загрузить файл', type: 'error' });
    } finally {
      setIsUploadingAttachment(false);
      event.target.value = '';
    }
  };

  const handleAttachmentRemove = (key: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.key !== key));
  };

  const parseTags = (rawValue: string): string[] =>
    rawValue
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

  const selectedTags = React.useMemo(() => parseTags(formState.tagsInput), [formState.tagsInput]);
  const normalizedSelected = React.useMemo(
    () => selectedTags.map(tag => tag.toLowerCase()),
    [selectedTags]
  );

  const activeTagQuery = React.useMemo(() => {
    const parts = formState.tagsInput.split(',');
    return parts[parts.length - 1]?.trim().toLowerCase() ?? '';
  }, [formState.tagsInput]);

  const tagSuggestions = React.useMemo(() => {
    const pool = availableTags || [];
    const base = pool.filter(tag => !normalizedSelected.includes(tag.toLowerCase()));
    if (!activeTagQuery) {
      return base.slice(0, 10);
    }
    return base.filter(tag => tag.toLowerCase().includes(activeTagQuery)).slice(0, 10);
  }, [availableTags, normalizedSelected, activeTagQuery]);

  const updateTagsField = (tags: string[]) => {
    updateField('tagsInput', tags.join(', '));
  };

  const handleAppendTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || normalizedSelected.includes(trimmed.toLowerCase())) {
      return;
    }
    updateTagsField([...selectedTags, trimmed]);
  };

  const handleRemoveTag = (tag: string) => {
    const next = selectedTags.filter(item => item.toLowerCase() !== tag.toLowerCase());
    updateTagsField(next);
  };

  const modeCopy =
    mode === 'request'
      ? {
          title: 'Создать заказ',
          info:
            'Мы спишем стоимость объявления с вашего баланса и заморозим её до завершения работ. Деньги перейдут исполнителю после подтверждения результата.',
          submit: 'Опубликовать заказ',
        }
      : {
          title: 'Опубликовать услугу',
          info:
            'Коллеги будут оставлять заявки на вашу услугу. Средства спишутся с заказчика и перейдут вам после завершения проекта.',
          submit: 'Опубликовать услугу',
        };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modeCopy.title}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          value={formState.title}
          onChange={value => updateField('title', value)}
          placeholder="Заголовок объявления"
        />
        <textarea
          value={formState.description}
          onChange={event => updateField('description', event.target.value)}
          placeholder="Опишите задачу, сроки и формат сотрудничества"
          className="min-h-[140px] w-full rounded-2xl border border-border-soft bg-surface-muted px-5 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-indigo"
        />
        <div className="rounded-3xl border border-border-soft bg-surface-muted px-5 py-4 text-sm text-text-secondary">
          {modeCopy.info}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            value={formState.pricingType}
            onChange={value => updateField('pricingType', value)}
            options={PRICING_OPTIONS.filter(option => option.value)}
          />
          <Input
            type="number"
            min="0"
            value={formState.price}
            onChange={value => updateField('price', value)}
            placeholder="Стоимость"
          />
        </div>

        <div className="space-y-3">
          <Input
            value={formState.tagsInput}
            onChange={value => updateField('tagsInput', value)}
            placeholder="Введите теги через запятую"
          />

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-white px-3 py-1 text-sm text-text-primary"
                >
                  #{tag}
                  <button
                    type="button"
                    aria-label={`Удалить тег ${tag}`}
                    onClick={() => handleRemoveTag(tag)}
                    className="text-text-secondary hover:text-brand-indigo"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {tagSuggestions.length > 0 && (
            <div>
              <div className="mt-2 flex flex-wrap gap-2">
                {tagSuggestions.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAppendTag(tag)}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <AttachmentField
          label="Материалы к объявлению"
          description="Прикрепите ТЗ, примеры работ или дополнительные инструкции (до 5 файлов)."
          attachments={attachments}
          isUploading={isUploadingAttachment}
          onSelectFiles={handleAttachmentsSelect}
          onRemoveAttachment={handleAttachmentRemove}
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="md" onClick={onClose} type="button">
            Отмена
          </Button>
          <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Публикуем...' : modeCopy.submit}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const RequestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  service: ServiceListing | null;
  onSubmit: (payload: { message?: string; files?: string[] }) => void | Promise<void>;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, service, onSubmit, isSubmitting }) => {
  const [formState, setFormState] = React.useState({
    message: '',
  });
  const [attachments, setAttachments] = React.useState<UploadedAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFormState({
        message: '',
      });
      setAttachments([]);
    }
  }, [isOpen, service]);

  const updateField = (field: keyof typeof formState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      message: formState.message.trim() || undefined,
      files: attachments.map(attachment => attachment.url),
    });
  };

  const handleAttachmentsSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = event.target.files;
    if (!filesList?.length) {
      return;
    }

    const availableSlots = MAX_MARKETPLACE_ATTACHMENTS - attachments.length;
    if (availableSlots <= 0) {
      showToast({ message: `Можно прикрепить до ${MAX_MARKETPLACE_ATTACHMENTS} файлов`, type: 'error' });
      event.target.value = '';
      return;
    }

    const filesToUpload = Array.from(filesList).slice(0, availableSlots);
    setIsUploadingAttachment(true);
    try {
      const uploaded: UploadedAttachment[] = [];
      for (const file of filesToUpload) {
        const result = await uploadsApi.uploadMarketplaceAttachment(file);
        uploaded.push(result);
      }
      setAttachments(prev => [...prev, ...uploaded]);
    } catch (error: any) {
      showToast({ message: error.message || 'Не удалось загрузить файл', type: 'error' });
    } finally {
      setIsUploadingAttachment(false);
      event.target.value = '';
    }
  };

  const handleAttachmentRemove = (key: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.key !== key));
  };

  const requestMode: MarketplaceListingMode = service?.mode ?? 'request';
  const ownerLabel = MODE_OWNER_LABEL[requestMode];
  const modalTitle = requestMode === 'offer' ? 'Заказ услуги' : 'Отклик на задачу';
  const paymentTitle = requestMode === 'offer' ? 'спишем при отправке' : 'оплата зарезервирована';
  const paymentDescription =
    requestMode === 'offer'
      ? 'Мы спишем средства с вашего баланса и переведём исполнителю после завершения.'
      : 'Бюджет удерживается на депозите заказчика, вы получите выплату после завершения.';
  const messagePlaceholder = requestMode === 'offer' ? 'Комментарий исполнителю' : 'Сообщение заказчику';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      {service ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-border-soft bg-surface-muted px-4 py-3 text-sm text-text-secondary">
            <p className="text-text-primary font-semibold">{service.title}</p>
            <p>
              {ownerLabel}: {service.owner?.firstName} {service.owner?.lastName}
            </p>
          </div>
          <textarea
            value={formState.message}
            onChange={event => updateField('message', event.target.value)}
            placeholder={messagePlaceholder}
            className="min-h-[120px] w-full rounded-2xl border border-border-soft bg-surface-muted px-5 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-indigo"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 rounded-2xl border border-border-soft bg-surface-muted px-4 py-3">
              <p className="text-xs uppercase tracking-[0.4em] text-text-muted">{paymentTitle}</p>
              <p className="mt-1 text-lg font-semibold text-brand-indigo">
                {service ? priceFormatter.format(service.price) : '—'}
              </p>
              <p className="mt-2 text-xs text-text-secondary">{paymentDescription}</p>
            </div>
          </div>
          <AttachmentField
            label="Материалы к заявке"
            description="Прикрепите бриф, договор или другие файлы (до 5 вложений)."
            attachments={attachments}
            isUploading={isUploadingAttachment}
            onSelectFiles={handleAttachmentsSelect}
            onRemoveAttachment={handleAttachmentRemove}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="md" onClick={onClose} type="button">
              Отмена
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Отправляем...' : MODE_PRIMARY_ACTION[requestMode]}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-text-secondary">Выберите услугу перед отправкой заявки.</p>
      )}
    </Modal>
  );
};

const ServiceDetailsModal: React.FC<{
  service: ServiceListing | null;
  isOpen: boolean;
  onClose: () => void;
  onRequest: (service: ServiceListing) => void;
}> = ({ service, isOpen, onClose, onRequest }) => {
  if (!isOpen || !service) {
    return null;
  }

  const ownerLabel = MODE_OWNER_LABEL[service.mode];
  const ctaLabel = MODE_PRIMARY_ACTION[service.mode];
  const flowHint =
    service.mode === 'request'
      ? 'Вы откликаетесь как исполнитель: оплата уже зарезервирована у автора объявления.'
      : 'Вы бронируете готовое предложение: средства спишутся с вашего баланса при подтверждении.';
  const modeBadgeText = service.mode === 'request' ? 'Запрос исполнителя' : 'Предложение специалиста';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Вы выбрали услугу">
      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-brand-lilac">подробности</p>
          <h3 className="mt-2 text-2xl font-semibold text-brand-indigo">{service.title}</h3>
          <span
            className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${MODE_BADGE_STYLES[service.mode]}`}
          >
            {modeBadgeText}
          </span>
          <p className="mt-2 text-sm text-text-secondary">{service.description}</p>
        </div>

        <div className="flex flex-wrap items-baseline justify-between rounded-2xl border border-border-soft bg-brand-indigo/5 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-brand-indigo/70">стоимость</p>
            <p className="text-3xl font-semibold text-brand-indigo">{priceFormatter.format(service.price)}</p>
            <p className="text-xs text-text-secondary">
              {service.pricingType === 'fixed' && 'Фиксированная стоимость'}
              {service.pricingType === 'hourly' && 'Оплата за каждый час'}
              {service.pricingType === 'package' && 'Гибкие пакеты'}
            </p>
          </div>
          <div className="text-right text-sm text-text-secondary">
            <p>Просмотров: {service.views}</p>
            <p>Выполнено заказов: {service.completedOrders}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailStat label="Рейтинг" value={`${service.rating.toFixed(1)} / 5`} />
          <DetailStat label="Отзывы" value={service.reviewsCount} />
          <DetailStat label="Доступность" value={service.availability?.days?.length || 0} />
          <DetailStat label="Обновлено" value={new Date(service.updatedAt).toLocaleDateString('ru-RU')} />
        </div>

        {service.tags.length > 0 && (
          <div className="rounded-2xl border border-border-soft bg-surface-muted px-4 py-3">
            <p className="text-xs uppercase tracking-[0.4em] text-text-muted">ключевые навыки</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-text-secondary">
              {service.tags.map(tag => (
                <span key={tag} className="rounded-full border border-border-soft px-3 py-1">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {service.attachments?.length ? (
          <div className="rounded-2xl border border-border-soft bg-surface-muted px-4 py-3">
            <p className="text-xs uppercase tracking-[0.4em] text-text-muted">материалы</p>
            <div className="mt-3 flex flex-col gap-2">
              {service.attachments.map((fileUrl, index) => (
                <a
                  key={`${fileUrl}-${index}`}
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-indigo hover:underline"
                >
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-indigo/10 text-brand-indigo"
                    aria-hidden
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12l7 7 7-7" />
                    </svg>
                  </span>
                  {resolveAttachmentName(fileUrl, `Вложение ${index + 1}`)}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-dashed border-border-soft bg-surface-muted/70 px-4 py-3 text-sm text-text-secondary">
          {flowHint}
        </div>

        {service.owner && (
          <div className="flex items-center gap-4 rounded-2xl border border-border-soft bg-surface-muted px-5 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-indigo/10 text-xl">
              {service.owner.firstName?.[0]}
              {service.owner.lastName?.[0]}
            </div>
            <div>
              <p className="text-sm text-text-secondary">{ownerLabel}</p>
              <p className="text-base font-semibold text-text-primary">
                {service.owner.firstName} {service.owner.lastName}
              </p>
              <p className="text-xs uppercase tracking-[0.35em] text-text-muted">{service.owner.role}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={() => {
              onRequest(service);
              onClose();
            }}
          >
            {ctaLabel}
          </Button>
          <Button variant="outline" size="md" className="flex-1" disabled>
            Добавить в избранное
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const ServiceCard: React.FC<{
  service: ServiceListing;
  isActive: boolean;
  onSelect: (service: ServiceListing) => void;
}> = ({ service, isActive, onSelect }) => {
  const modeBadgeText = service.mode === 'request' ? 'Нужен исполнитель' : 'Исполнитель готов';
  const ownerLabel = MODE_OWNER_LABEL[service.mode];

  return (
  <button
    type="button"
    onClick={() => onSelect(service)}
    className={`text-left rounded-3xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
      isActive ? 'border-brand-indigo shadow-brand-card' : 'border-border-soft'
    }`}
  >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{service.title}</h3>
          <p className="line-clamp-2 text-sm text-text-secondary">{service.description}</p>
          {service.owner ? (
            <p className="mt-1 text-xs text-text-muted">
              {ownerLabel}: {service.owner.firstName} {service.owner.lastName}
            </p>
          ) : null}
        </div>
      <span className="text-base font-semibold text-brand-indigo">
        {priceFormatter.format(service.price)}
      </span>
    </div>
    <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-muted">
      <span className={`rounded-full border px-3 py-1 ${MODE_BADGE_STYLES[service.mode]}`}>
        {modeBadgeText}
      </span>
      <span className="rounded-full border border-border-soft px-3 py-1">
        {service.pricingType === 'fixed' && 'Фиксированная стоимость'}
        {service.pricingType === 'hourly' && 'Почасовая ставка'}
        {service.pricingType === 'package' && 'Пакетная цена'}
      </span>
      {service.tags.slice(0, 2).map(tag => (
        <span key={tag} className="rounded-full border border-border-soft px-3 py-1">
          #{tag}
        </span>
      ))}
      <span className="rounded-full border border-border-soft px-3 py-1 inline-flex items-center gap-2">
        <EyeIcon className="w-4 h-4" />
        {service.views}
      </span>
      <span className="rounded-full border border-border-soft px-3 py-1 inline-flex items-center gap-2">
        <CheckIcon className="w-4 h-4" />
        {service.completedOrders}
      </span>
    </div>
  </button>
  );
};

const DetailStat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="rounded-2xl border border-border-soft bg-white/60 px-4 py-3">
    <p className="text-xs uppercase tracking-[0.35em] text-text-muted">{label}</p>
    <p className="text-lg font-semibold text-brand-indigo">{value}</p>
  </div>
);

const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="rounded-3xl border border-dashed border-border-soft bg-surface-muted px-6 py-12 text-center">
    <p className="flex justify-center" aria-hidden>
      <LeafIcon className="w-8 h-8 text-brand-indigo" />
    </p>
    <h3 className="mt-4 text-xl font-semibold text-text-primary">{title}</h3>
    <p className="mt-2 text-sm text-text-secondary">{description}</p>
  </div>
);

const REQUEST_STATUS_LABELS: Record<ServiceRequest['status'], string> = {
  pending: 'В ожидании',
  accepted: 'Принята',
  declined: 'Отклонена',
  in_progress: 'В работе',
  completed: 'Завершена',
  cancelled: 'Отменена',
};

const REQUEST_STATUS_STYLES: Record<ServiceRequest['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined: 'bg-rose-50 text-rose-700 border-rose-200',
  in_progress: 'bg-brand-almond text-brand-indigo border-brand-almond',
  completed: 'bg-slate-100 text-brand-indigo border-slate-200',
  cancelled: 'bg-slate-50 text-slate-500 border-slate-200',
};

const formatRequestDate = (iso?: string) => {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const RequestCard: React.FC<{
  request: ServiceRequest;
  scope: 'customer' | 'provider';
  onUpdateStatus: (requestId: string, status: RequestStatusAction) => void;
  onOpenChat: (chatId: string) => void;
  pendingActionId: string | null;
  currentUserId?: string;
}> = ({ request, scope, onUpdateStatus, onOpenChat, pendingActionId, currentUserId }) => {
  const requestMode = resolveRequestMode(request);
  const counterpart = scope === 'customer' ? request.provider : request.customer;
  const counterpartName = counterpart ? `${counterpart.firstName} ${counterpart.lastName}` : '—';
  const counterpartLabel = scope === 'customer' ? 'Исполнитель' : 'Заказчик';
  const isActionPending = pendingActionId === request.id;
  const isListingOwner = currentUserId ? isListingOwnerForRequest(request, currentUserId) : false;
  const isCollaborator = currentUserId
    ? requestMode === 'request'
      ? request.provider?.id === currentUserId
      : request.customer?.id === currentUserId
    : false;
  const canAccept = isListingOwner && request.status === 'pending';
  const canDecline = canAccept;
  const canCancel = isCollaborator && request.status === 'pending';
  const canComplete = currentUserId === request.customer?.id && ['accepted', 'in_progress'].includes(request.status);
  const canOpenChat = Boolean(request.chatId);
  const modeBadgeText = requestMode === 'request' ? 'Отклик на заказ' : 'Бронь услуги';

  const handleChatOpen = () => {
    if (request.chatId) {
      onOpenChat(request.chatId);
    }
  };

  return (
    <div className="rounded-3xl border border-border-soft bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-text-muted">услуга</p>
          <h4 className="mt-1 text-lg font-semibold text-text-primary">
            {request.service?.title ?? 'Без названия'}
          </h4>
          <p className="text-sm text-text-secondary">
            {counterpartLabel}: {counterpartName}
          </p>
          <p className="text-xs text-text-muted">Создана {formatRequestDate(request.createdAt)}</p>
        </div>
        <div className="text-right">
          <span
            className={`mb-2 inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold ${MODE_BADGE_STYLES[requestMode]}`}
          >
            {modeBadgeText}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${REQUEST_STATUS_STYLES[request.status]}`}
          >
            {REQUEST_STATUS_LABELS[request.status]}
          </span>
          <p className="mt-3 text-xl font-semibold text-brand-indigo">
            {priceFormatter.format(request.price || request.service?.price || 0)}
          </p>
        </div>
      </div>

      {request.message && (
        <p className="mt-3 rounded-2xl border border-border-soft bg-surface-muted px-4 py-3 text-sm text-text-secondary">
          {request.message}
        </p>
      )}

      {request.files?.length ? (
        <div className="mt-3 rounded-2xl border border-dashed border-border-soft bg-surface-muted/70 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.35em] text-text-muted">вложения</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {request.files.map((fileUrl, index) => (
              <a
                key={`${fileUrl}-${index}`}
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border-soft px-3 py-1 text-xs font-semibold text-brand-indigo hover:border-brand-indigo hover:bg-white"
              >
                {resolveAttachmentName(fileUrl, `Файл ${index + 1}`)}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {canAccept && (
          <Button
            size="sm"
            onClick={() => onUpdateStatus(request.id, 'accepted')}
            disabled={isActionPending}
          >
            {isActionPending ? 'Сохраняем…' : 'Принять'}
          </Button>
        )}
        {canDecline && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateStatus(request.id, 'declined')}
            disabled={isActionPending}
          >
            {isActionPending ? 'Сохраняем…' : 'Отклонить'}
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateStatus(request.id, 'cancelled')}
            disabled={isActionPending}
          >
            {isActionPending ? 'Сохраняем…' : 'Отменить'}
          </Button>
        )}
        {canComplete && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onUpdateStatus(request.id, 'completed')}
            disabled={isActionPending}
          >
            {isActionPending ? 'Сохраняем…' : 'Завершить'}
          </Button>
        )}
        {canOpenChat && (
          <Button size="sm" variant="outline" onClick={handleChatOpen}>
            Связаться с заказчиком
          </Button>
        )}
      </div>
    </div>
  );
};

export const MarketplacePage: React.FC = () => {
  const { currentUser, refreshCurrentUser } = useUnit({
    currentUser: $currentUser,
    refreshCurrentUser: getMeFx,
  });
  const currentUserId = currentUser?._id;
  const [activeTab, setActiveTab] = React.useState(0);
  const [filters, setFilters] = React.useState<FiltersState>(() => ({ ...DEFAULT_FILTERS }));
  const [services, setServices] = React.useState<ServiceListing[]>([]);
  const [pagination, setPagination] = React.useState<ServiceListPagination | null>(null);
  const [selectedService, setSelectedService] = React.useState<ServiceListing | null>(null);
  const [isServiceDetailsOpen, setIsServiceDetailsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetchingMyServices, setIsFetchingMyServices] = React.useState(false);
  const [myServices, setMyServices] = React.useState<ServiceListing[]>([]);
  const [requests, setRequests] = React.useState<ServiceRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = React.useState(false);
  const [requestScope, setRequestScope] = React.useState<'customer' | 'provider'>('customer');
  const [pendingRequestActionId, setPendingRequestActionId] = React.useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] = React.useState(false);
  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = React.useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
  const [requestModalService, setRequestModalService] = React.useState<ServiceListing | null>(null);
  const [isSubmittingRequestListing, setIsSubmittingRequestListing] = React.useState(false);
  const [isSubmittingOfferListing, setIsSubmittingOfferListing] = React.useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = React.useState(false);
  const [listReloadKey, setListReloadKey] = React.useState(0);
  const [myServicesReloadKey, setMyServicesReloadKey] = React.useState(0);
  const [requestsReloadKey, setRequestsReloadKey] = React.useState(0);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = React.useState(false);
  const [isGuestAlertVisible, setIsGuestAlertVisible] = React.useState(true);
  const [incomingRequests, setIncomingRequests] = React.useState<ServiceRequest[]>([]);
  const [isLoadingIncomingRequests, setIsLoadingIncomingRequests] = React.useState(false);
  const [areFiltersVisible, setAreFiltersVisible] = React.useState(false);
  const [customTags, setCustomTags] = React.useState<string[]>(() => getStoredServiceTags());

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== SERVICE_TAG_STORAGE_KEY) {
        return;
      }
      setCustomTags(getStoredServiceTags());
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleRealtimeRequestUpsert = React.useCallback(
    (payload: ServiceRequest | null) => {
      if (!payload || !currentUserId) {
        return;
      }

      setRequests(prev => {
        if (!isRequestRelevantForScope(payload, requestScope, currentUserId)) {
          return prev;
        }
        return upsertRequestInList(prev, payload);
      });

      setIncomingRequests(prev => {
        const filtered = removeRequestById(prev, payload.id);
        if (isPendingIncomingForUser(payload, currentUserId)) {
          return upsertRequestInList(filtered, payload);
        }
        return filtered;
      });
    },
    [currentUserId, requestScope]
  );

  const handleRealtimeRequestRemoval = React.useCallback((requestId?: string) => {
    if (!requestId) {
      return;
    }

    setRequests(prev => removeRequestById(prev, requestId));
    setIncomingRequests(prev => removeRequestById(prev, requestId));
  }, []);

  const availableTabs = React.useMemo(() => getMarketplaceTabs(currentUser), [currentUser]);
  React.useEffect(() => {
    if (availableTabs.length === 0) {
      return;
    }
    if (activeTab >= availableTabs.length) {
      setActiveTab(Math.max(0, availableTabs.length - 1));
    }
  }, [activeTab, availableTabs.length]);

  const safeActiveTabIndex = availableTabs.length === 0 ? 0 : Math.min(activeTab, availableTabs.length - 1);
  const activeTabId = availableTabs[safeActiveTabIndex]?.id ?? 'catalog_request';
  const isCatalogTab = activeTabId === 'catalog_request' || activeTabId === 'catalog_offer';
  const shouldShowGuestAlert = !currentUser && isGuestAlertVisible && isCatalogTab;

  const openRequestsInbox = React.useCallback(() => {
    const targetIndex = availableTabs.findIndex(tab => tab.id === 'requests');
    if (targetIndex !== -1) {
      setActiveTab(targetIndex);
      setRequestScope('customer');
    }
  }, [availableTabs, setActiveTab, setRequestScope]);

  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
    : '';
  const balanceLabel = currentUser ? formatBalance(currentUser.balance) : '';

  const handleNavigate = React.useCallback((path: string) => {
    if (isAuthPath(path)) {
      markAuthRedirect('/services/marketplace');
    }
    const nextUrl = new URL(path, window.location.origin);
    window.history.pushState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const handleHeaderTabChange = React.useCallback(
    (index: number) => {
      setActiveTab(index);
      const tab = availableTabs[index];
      if (tab?.mode && tab.mode !== filters.mode) {
        const nextMode: MarketplaceListingMode = tab.mode;
        setFilters(prev => ({
          ...prev,
          mode: nextMode,
          page: 1,
        }));
      }
    },
    [availableTabs, filters.mode, setFilters]
  );

  const handleTabSelectById = React.useCallback(
    (tabId: MarketplaceTabId) => {
      const nextIndex = availableTabs.findIndex(tab => tab.id === tabId);
      if (nextIndex !== -1) {
        handleHeaderTabChange(nextIndex);
      }
    },
    [availableTabs, handleHeaderTabChange]
  );


  const handleProfileNavigate = React.useCallback(() => {
    handleNavigate('/profile');
  }, [handleNavigate]);

  const handleOpenChat = React.useCallback(
    (chatId: string) => {
      if (!chatId) {
        return;
      }
      handleNavigate(`/services/chat?chatId=${chatId}`);
    },
    [handleNavigate]
  );

  const handleFilterChange = (field: keyof typeof DEFAULT_FILTERS, value: string | boolean | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field !== 'page' ? { page: 1 } : {}),
    }));
  };

  React.useEffect(() => {
    let isActive = true;
    setIsLoading(true);

    marketplaceApi
      .getServices(mapFiltersToQuery(filters))
      .then(response => {
        if (!isActive) return;
        setServices(response.data);
        setPagination(response.pagination);

        setSelectedService(prev => {
          if (prev && response.data.some(item => item.id === prev.id)) {
            return prev;
          }
          if (prev) {
            setIsServiceDetailsOpen(false);
          }
          return null;
        });
      })
      .catch(error => {
        if (!isActive) return;
        showToast({ message: error.message || 'Не удалось загрузить услуги', type: 'error' });
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [filters, listReloadKey]);

  React.useEffect(() => {
    if (!currentUser) {
      setMyServices([]);
      return;
    }

    let isActive = true;
    setIsFetchingMyServices(true);

    marketplaceApi
      .getMyServices()
      .then(response => {
        if (isActive) {
          setMyServices(response);
        }
      })
      .catch(error => {
        if (isActive) {
          showToast({ message: error.message || 'Не удалось загрузить ваши услуги', type: 'error' });
        }
      })
      .finally(() => {
        if (isActive) {
          setIsFetchingMyServices(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [currentUser, myServicesReloadKey]);

  React.useEffect(() => {
    if (!currentUser) {
      setRequests([]);
      return;
    }

    let isActive = true;
    setIsLoadingRequests(true);

    serviceRequestsApi
      .getRequests({ scope: requestScope })
      .then(response => {
        if (isActive) {
          setRequests(response.data);
        }
      })
      .catch(error => {
        if (isActive) {
          showToast({ message: error.message || 'Не удалось загрузить заявки', type: 'error' });
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingRequests(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [currentUser, requestScope, requestsReloadKey]);

  React.useEffect(() => {
    if (!currentUser) {
      setIncomingRequests([]);
      return;
    }

    let isActive = true;
    setIsLoadingIncomingRequests(true);

    Promise.all([
      serviceRequestsApi.getRequests({ scope: 'customer', status: 'pending', type: 'request' }),
      serviceRequestsApi.getRequests({ scope: 'provider', status: 'pending', type: 'offer' }),
    ])
      .then(([asCustomer, asProvider]) => {
        if (!isActive) {
          return;
        }
        const owningRequests = [
          ...asCustomer.data.filter(item => resolveRequestMode(item) === 'request'),
          ...asProvider.data.filter(item => resolveRequestMode(item) === 'offer'),
        ];
        const deduped = Array.from(new Map(owningRequests.map(item => [item.id, item])).values());
        setIncomingRequests(sortRequestsByDateDesc(deduped));
      })
      .catch(error => {
        if (isActive) {
          showToast({ message: error.message || 'Не удалось загрузить входящие заявки', type: 'error' });
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingIncomingRequests(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [currentUser, requestsReloadKey]);


  const refreshListings = React.useCallback(() => setListReloadKey(prev => prev + 1), []);
  const refreshMyServices = React.useCallback(() => setMyServicesReloadKey(prev => prev + 1), []);
  const refreshRequests = React.useCallback(() => setRequestsReloadKey(prev => prev + 1), []);

  React.useEffect(() => {
    const unsubscribes = [
      onSocketEvent('marketplace:listings:created', () => {
        refreshListings();
        refreshMyServices();
      }),
      onSocketEvent('marketplace:listings:updated', () => {
        refreshListings();
        refreshMyServices();
      }),
      onSocketEvent('marketplace:listings:deleted', (payload: { id?: string }) => {
        setSelectedService(prev => {
          if (payload?.id && prev?.id === payload.id) {
            setIsServiceDetailsOpen(false);
            return null;
          }
          return prev;
        });
        refreshListings();
        refreshMyServices();
      }),
      onSocketEvent('marketplace:requests:created', (payload: SocketRequestPayload) => {
        const normalized = sanitizeSocketRequest(payload);
        if (normalized) {
          handleRealtimeRequestUpsert(normalized);
        } else {
          refreshRequests();
        }
      }),
      onSocketEvent('marketplace:requests:updated', (payload: SocketRequestPayload) => {
        const normalized = sanitizeSocketRequest(payload);
        if (normalized) {
          handleRealtimeRequestUpsert(normalized);
        } else {
          refreshRequests();
        }
      }),
      onSocketEvent('marketplace:requests:deleted', (payload: { id?: string }) => {
        if (payload?.id) {
          handleRealtimeRequestRemoval(payload.id);
        } else {
          refreshRequests();
        }
      }),
    ];

    return () => {
      unsubscribes.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [
    refreshListings,
    refreshMyServices,
    refreshRequests,
    handleRealtimeRequestUpsert,
    handleRealtimeRequestRemoval,
  ]);

  const uniqueCategories = React.useMemo(() => new Set(services.map(service => service.category)).size, [services]);
  const uniqueProviders = React.useMemo(
    () => new Set(services.map(service => service.owner?.id).filter(Boolean)).size,
    [services]
  );
  const hiddenMyServicesCount = React.useMemo(
    () => myServices.filter(service => !service.isActive).length,
    [myServices]
  );
  const activeRequestsCount = React.useMemo(
    () => myServices.filter(service => service.mode === 'request' && service.isActive).length,
    [myServices]
  );
  const activeOffersCount = React.useMemo(
    () => myServices.filter(service => service.mode === 'offer' && service.isActive).length,
    [myServices]
  );
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count += 1;
    if (filters.category) count += 1;
    if (filters.pricingType) count += 1;
    if (filters.sort !== DEFAULT_FILTERS.sort) count += 1;
    if (filters.minPrice) count += 1;
    if (filters.maxPrice) count += 1;
    if (filters.includeInactive) count += 1;
    return count;
  }, [filters]);

  const serviceTags = React.useMemo(
    () => collectTagsFromListings([...services, ...myServices]),
    [services, myServices]
  );

  const availableTags = React.useMemo(() => {
    const deduped = new Map<string, string>();
    [...DEFAULT_SERVICE_TAGS, ...serviceTags, ...customTags].forEach(tag => {
      const trimmed = tag.trim();
      if (!trimmed) {
        return;
      }
      const key = trimmed.toLowerCase();
      if (!deduped.has(key)) {
        deduped.set(key, trimmed);
      }
    });
    return Array.from(deduped.values());
  }, [serviceTags, customTags]);


  const headerTabs = React.useMemo(() => availableTabs, [availableTabs]);
  const mobileHeaderTabs = React.useMemo(() => availableTabs.filter(tab => !tab.disabled), [availableTabs]);

  const renderHeaderTabs = React.useCallback(
    (options?: { className?: string; dense?: boolean }) => {
      const { className = '', dense = false } = options ?? {};
      const paddingClasses = dense ? 'py-1 text-xs' : 'py-1.5 sm:py-2';

      return (
        <div
          className={`flex w-full justify-center gap-2 overflow-x-auto px-1 ${paddingClasses} ${className}`}
          role="tablist"
        >
          {headerTabs.map((tab, index) => {
            const isActive = safeActiveTabIndex === index;
            const isDisabled = Boolean(tab.disabled);
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-disabled={isDisabled}
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) {
                    handleHeaderTabChange(index);
                  }
                }}
                className={`group relative flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'border-emerald-400/70 bg-emerald-50 text-emerald-800 shadow-[0_18px_45px_rgba(16,185,129,0.25)]'
                    : 'border-transparent bg-transparent text-text-secondary hover:text-emerald-600'
                } ${
                  isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:-translate-y-0.5'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">{tab.label}</span>
                <span
                  className={`pointer-events-none absolute inset-x-6 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all duration-300 ${
                    isActive
                      ? 'scale-x-100 opacity-100'
                      : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-70'
                  }`}
                />
              </button>
            );
          })}
        </div>
      );
    },
    [headerTabs, handleHeaderTabChange, safeActiveTabIndex]
  );

  const openCreateRequestListingModal = () => {
    if (!currentUser) {
      showToast({ message: 'Авторизуйтесь, чтобы размещать услуги', type: 'error' });
      return;
    }
    setIsCreateRequestModalOpen(true);
  };

  const openCreateOfferListingModal = () => {
    if (!currentUser) {
      showToast({ message: 'Авторизуйтесь, чтобы размещать услуги', type: 'error' });
      return;
    }
    setIsCreateOfferModalOpen(true);
  };

  const handleServiceSelect = React.useCallback((service: ServiceListing) => {
    setSelectedService(service);
    setIsServiceDetailsOpen(true);
  }, []);

  const openRequestModal = (service?: ServiceListing) => {
    if (!currentUser) {
      showToast({ message: 'Войдите, чтобы отправлять заявки', type: 'error' });
      return;
    }
    const targetService = service ?? selectedService;
    if (!targetService) {
      showToast({ message: 'Выберите объявление перед отправкой заявки', type: 'error' });
      return;
    }
    if (targetService.owner?.id && targetService.owner.id === currentUser._id) {
      showToast({ message: 'Нельзя откликаться на собственное объявление', type: 'error' });
      return;
    }
    setRequestModalService(targetService);
    setIsRequestModalOpen(true);
  };

  const handleCreateService = async (payload: CreateServiceFormValues, mode: MarketplaceListingMode) => {
    if (!currentUser) {
      showToast({ message: 'Авторизуйтесь, чтобы размещать услуги', type: 'error' });
      return;
    }

    const tags = payload.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    const title = payload.title.trim();
    const description = payload.description.trim();
    const category = DEFAULT_CATEGORY_VALUE;
    const price = Number(payload.price);

    if (!title || !description) {
      showToast({ message: 'Заполните заголовок и описание', type: 'error' });
      return;
    }

    if (Number.isNaN(price) || price <= 0) {
      showToast({ message: 'Укажите стоимость больше 0 баллов', type: 'error' });
      return;
    }

    const attachmentUrls = (payload.attachments || [])
      .map(file => file.url)
      .filter(Boolean);

    const formattedPayload = {
      title,
      description,
      category,
      price,
      pricingType: payload.pricingType,
      tags,
      skills: tags,
      attachments: attachmentUrls,
      mode,
    } as const;

    try {
      await marketplaceApi.createService(formattedPayload);
      await refreshCurrentUser().catch(() => undefined);
      showToast({ message: 'Услуга опубликована', type: 'success' });
      refreshListings();
      refreshMyServices();
    } catch (error: any) {
      showToast({ message: error.message || 'Ошибка при создании услуги', type: 'error' });
      throw error;
    }
  };

  const handleCreateRequestListing = async (payload: CreateServiceFormValues) => {
    try {
      setIsSubmittingRequestListing(true);
      await handleCreateService(payload, 'request');
      setIsCreateRequestModalOpen(false);
    } catch {
      // Ошибка уже показана в toast
    } finally {
      setIsSubmittingRequestListing(false);
    }
  };

  const handleCreateOfferListing = async (payload: CreateServiceFormValues) => {
    try {
      setIsSubmittingOfferListing(true);
      await handleCreateService(payload, 'offer');
      setIsCreateOfferModalOpen(false);
    } catch {
      // Ошибка уже показана в toast
    } finally {
      setIsSubmittingOfferListing(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!currentUser) {
      showToast({ message: 'Авторизуйтесь, чтобы управлять услугами', type: 'error' });
      return;
    }

    const confirmed = window.confirm('Удалить услугу? Это действие необратимо.');
    if (!confirmed) {
      return;
    }

    try {
      setPendingDeleteId(serviceId);
      await marketplaceApi.deleteService(serviceId);
      await refreshCurrentUser().catch(() => undefined);
      showToast({ message: 'Услуга удалена', type: 'success' });
      refreshListings();
      refreshMyServices();
    } catch (error: any) {
      showToast({ message: error.message || 'Не удалось удалить услугу', type: 'error' });
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleCreateRequest = async (payload: {
    message?: string;
    files?: string[];
  }) => {
    if (!currentUser || !requestModalService) {
      showToast({ message: 'Авторизуйтесь, чтобы отправлять заявки', type: 'error' });
      return;
    }

    try {
      setIsSubmittingRequest(true);
      await serviceRequestsApi.createRequest({
        serviceId: requestModalService.id,
        message: payload.message,
        files: payload.files,
      });
      const successMessage =
        requestModalService.mode === 'offer'
          ? 'Заказ создан, средства зарезервированы.'
          : 'Отклик отправлен автору задачи.';
      showToast({ message: successMessage, type: 'success' });
      setIsRequestModalOpen(false);
      refreshRequests();
    } catch (error: any) {
      showToast({ message: error.message || 'Не удалось отправить заявку', type: 'error' });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: RequestStatusAction) => {
    if (!currentUser) {
      showToast({ message: 'Авторизуйтесь, чтобы управлять заявками', type: 'error' });
      return;
    }

    try {
      setPendingRequestActionId(requestId);
      await serviceRequestsApi.updateRequestStatus(requestId, { status });
      await refreshCurrentUser().catch(() => undefined);
      showToast({ message: 'Статус заявки обновлён', type: 'success' });
      refreshRequests();
    } catch (error: any) {
      showToast({ message: error.message || 'Не удалось обновить статус', type: 'error' });
    } finally {
      setPendingRequestActionId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(76,99,255,0.08),_transparent_55%)] text-text-primary">
      <ServiceHeader
        subtitle="услуги"
        onLogoClick={() => handleNavigate('/')}
        centerSlot={(
          <div className="w-full max-w-3xl">{renderHeaderTabs()}</div>
        )}
        mobileDockSlot={(
          <nav aria-label="Разделы маркетплейса">
            {renderHeaderTabs({ className: 'justify-between px-0', dense: true })}
          </nav>
        )}
        rightSlot={
          currentUser ? (
            <>
              <button
                type="button"
                onClick={() => setIsTopUpModalOpen(true)}
                className="flex min-w-0 items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2 py-1 text-xs font-semibold text-emerald-700 shadow-inner transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:px-3 sm:py-1.5 sm:text-sm"
              >
                <span
                  className="max-w-[72px] truncate text-sm font-semibold text-emerald-800 sm:max-w-[140px] sm:text-base"
                  title={balanceLabel}
                >
                  {balanceLabel}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-6 sm:w-6">+</span>
              </button>
              <NotificationBell />
              <button
                type="button"
                onClick={handleProfileNavigate}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-all duration-200 hover:border-emerald-300 hover:text-emerald-600 sm:h-11 sm:w-11"
                aria-label="Профиль"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-brand-indigo text-sm font-semibold text-white sm:h-10 sm:w-10">
                  {avatarUrl ? <img src={avatarUrl} alt="Аватар" className="h-full w-full rounded-full object-cover" /> : userInitials}
                </span>
              </button>
            </>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="px-7 text-base shadow-brand-card hover:-translate-y-0.5"
              onClick={() => handleNavigate('/login')}
            >
              Войти
            </Button>
          )
        }
      />

      {shouldShowGuestAlert && (
        <div className="fixed left-1/2 top-[6.25rem] z-30 w-full max-w-2xl -translate-x-1/2 px-4 sm:top-[6.75rem] sm:px-0">
          <div className="relative mx-auto rounded-[28px] border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-5 py-4 text-emerald-900 shadow-[0_25px_70px_rgba(16,185,129,0.25)]">
            <button
              type="button"
              onClick={() => setIsGuestAlertVisible(false)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200/70 bg-white/80 text-emerald-800 transition hover:bg-white"
              aria-label="Скрыть уведомление"
            >
              ×
            </button>
            <div className="text-center sm:text-left">
              <p className="text-base font-semibold leading-snug sm:text-lg">Войдите для оформления заказа.</p>
              <p className="mt-1 text-sm font-normal text-emerald-800">
                Авторизуйтесь, чтобы отправлять отклики, вести переписку и завершать сделки.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="w-full flex-1 pb-40 sm:pb-44 lg:pb-12">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {isCatalogTab && (
            <div className="space-y-10">
              <section className="grid gap-8">
                <div className="space-y-6">
                  <div className="rounded-[28px] border border-border-soft bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h3 className="text-lg font-semibold text-brand-indigo">Фильтры</h3>
                      <button
                        type="button"
                        aria-expanded={areFiltersVisible}
                        onClick={() => setAreFiltersVisible(prev => !prev)}
                        className="flex items-center gap-2 rounded-full border border-border-soft px-4 py-2 text-sm font-semibold text-brand-indigo transition-colors hover:border-brand-indigo hover:bg-brand-indigo/5"
                      >
                        {areFiltersVisible
                          ? 'Скрыть фильтры'
                          : activeFilterCount > 0
                          ? `Показать фильтры (${activeFilterCount})`
                          : 'Показать фильтры'}
                        <svg
                          className={`h-4 w-4 transition-transform ${areFiltersVisible ? 'rotate-180' : ''}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>
                    {areFiltersVisible ? (
                      <>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          <Input
                            value={filters.search}
                            onChange={value => handleFilterChange('search', value)}
                            placeholder="Поиск по названию или тегам"
                          />
                          <Select
                            value={filters.pricingType}
                            onChange={value => handleFilterChange('pricingType', value)}
                            options={PRICING_OPTIONS}
                          />
                          <Select
                            value={filters.sort}
                            onChange={value => handleFilterChange('sort', value)}
                            options={SORT_OPTIONS}
                          />
                          <Input
                            type="number"
                            value={filters.minPrice}
                            onChange={value => handleFilterChange('minPrice', value)}
                            placeholder="Минимальная цена"
                          />
                          <Input
                            type="number"
                            value={filters.maxPrice}
                            onChange={value => handleFilterChange('maxPrice', value)}
                            placeholder="Максимальная цена"
                          />
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                          <label className="flex items-center gap-2 text-sm text-text-secondary">
                            <input
                              type="checkbox"
                              checked={filters.includeInactive}
                              onChange={event => handleFilterChange('includeInactive', event.target.checked)}
                              className="h-4 w-4 rounded border-border-soft text-brand-indigo focus:ring-brand-indigo"
                            />
                            Показывать скрытые услуги
                          </label>
                          <Button variant="outline" size="sm" onClick={() => setFilters({ ...DEFAULT_FILTERS })}>
                            Сбросить фильтры
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border-soft bg-white px-4 py-3 text-sm text-text-primary">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4 font-semibold">
                          <span>
                            {pagination?.total ?? 0}{' '}
                            {filters.mode === 'request' ? 'активных заказов' : 'активных предложений'}
                          </span>
                          <span>{uniqueCategories} категорий</span>
                          <span>
                            {uniqueProviders} {filters.mode === 'request' ? 'заказчиков' : 'исполнителей'}
                          </span>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-shrink-0"
                          onClick={filters.mode === 'request' ? openCreateRequestListingModal : openCreateOfferListingModal}
                        >
                          {filters.mode === 'request' ? 'Создать заказ' : 'Предложить услуги'}
                        </Button>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-indigo/20 border-t-brand-indigo"></div>
                      </div>
                    ) : services.length === 0 ? (
                      <EmptyState
                        title="Пока нет подходящих предложений"
                        description="Измените фильтры или станьте первым, кто опубликует услугу для коллег."
                      />
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {services.map(service => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            isActive={selectedService?.id === service.id}
                            onSelect={handleServiceSelect}
                          />
                        ))}
                      </div>
                    )}

                    {pagination && pagination.pages > 1 && (
                      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border-soft bg-white px-4 py-3 text-sm text-text-secondary">
                        {Array.from({ length: pagination.pages }, (_, index) => {
                          const pageNumber = index + 1;
                          const isActivePage = pageNumber === pagination.page;
                          return (
                            <button
                              key={pageNumber}
                              type="button"
                              aria-current={isActivePage ? 'page' : undefined}
                              onClick={() => handleFilterChange('page', pageNumber)}
                              className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                                isActivePage
                                  ? 'bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.35)]'
                                  : 'border border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </div>
              </section>
              <section className="rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-text-muted">отклики на объявления</p>
                    <h3 className="mt-2 text-xl font-semibold text-brand-indigo">Заявки на заказы и предложения</h3>
                    <p className="text-sm text-text-secondary">
                      Здесь появляются отклики на ваши задачи и брони на ваши предложения. Подтвердите исполнителя или клиента в пару кликов.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={openRequestsInbox}>
                    Ко всем заявкам
                  </Button>
                </div>

                {!currentUser ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-border-soft px-4 py-3 text-sm text-text-secondary">
                    Войдите, чтобы видеть отклики на ваши объявления и подтверждать исполнителей.
                  </div>
                ) : isLoadingIncomingRequests ? (
                  <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border-soft px-4 py-3 text-sm text-text-secondary">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-indigo/20 border-t-brand-indigo"></div>
                    Загружаем входящие заявки...
                  </div>
                ) : incomingRequests.length === 0 ? (
                  <EmptyState
                    title="Новых обращений пока нет"
                    description="Как только коллеги откликнутся на заказ или забронируют предложение, заявка появится в этом блоке."
                  />
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {incomingRequests.slice(0, 4).map(request => {
                      const inboxScope: 'customer' | 'provider' =
                        resolveRequestMode(request) === 'offer' ? 'provider' : 'customer';
                      return (
                        <RequestCard
                          key={request.id}
                          request={request}
                          scope={inboxScope}
                          onUpdateStatus={handleUpdateRequestStatus}
                          onOpenChat={handleOpenChat}
                          pendingActionId={pendingRequestActionId}
                          currentUserId={currentUserId}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTabId === 'manage' && (
            <div className="space-y-8">
              <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
                <div className="flex h-full flex-col rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-brand-indigo">Управляйте своими услугами</h3>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-nowrap sm:justify-end">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full sm:w-auto sm:min-w-[160px]"
                        onClick={openCreateOfferListingModal}
                      >
                        Предложить услуги
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full sm:w-auto sm:min-w-[160px]"
                        onClick={openCreateRequestListingModal}
                      >
                        Создать заказ
                      </Button>
                    </div>
                  </div>
                  {currentUser ? (
                    <>
                      <div className="mt-5 space-y-3">
                        {isFetchingMyServices ? (
                          <div className="flex items-center gap-3 rounded-2xl border border-border-soft px-4 py-3 text-sm text-text-secondary">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-indigo/20 border-t-brand-indigo"></div>
                            Загружаем ваши объявления...
                          </div>
                        ) : myServices.length === 0 ? (
                          <EmptyState
                            title="Пока нет активных объявлений"
                            description="Создайте первое предложение и получите первых заказчиков из университета."
                          />
                        ) : (
                          myServices.slice(0, 4).map(service => {
                            const listingOwnerLabel = MODE_OWNER_LABEL[service.mode];
                            return (
                              <div key={service.id} className="rounded-2xl border border-border-soft px-5 py-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex flex-col gap-1">
                                    <h3 className="text-lg font-semibold text-text-primary">{service.title}</h3>
                                    <p className="line-clamp-2 text-sm text-text-secondary">{service.description}</p>
                                    {service.owner ? (
                                      <p className="mt-1 text-xs text-text-muted">
                                        {listingOwnerLabel}: {service.owner.firstName} {service.owner.lastName}
                                      </p>
                                    ) : null}
                                  </div>
                                  <span
                                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${MODE_BADGE_STYLES[service.mode]}`}
                                  >
                                    {service.mode === 'request' ? 'заказ с предоплатой' : 'предложение исполнителя'}
                                  </span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-secondary">
                                  <span>{priceFormatter.format(service.price)}</span>
                                  <span>Просмотров {service.views}</span>
                                  <span>Заявок {service.completedOrders}</span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pendingDeleteId === service.id}
                                    onClick={() => handleDeleteService(service.id)}
                                  >
                                    {pendingDeleteId === service.id ? 'Удаляем...' : 'Удалить'}
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 text-sm text-text-secondary">
                      Войдите в систему, чтобы публиковать услуги и управлять заказами.
                    </div>
                  )}
                </div>

                <div className="flex h-full flex-col gap-6 rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Как это работает</p>
                    <ol className="mt-4 space-y-4 text-sm text-text-secondary">
                      <li>
                        <strong className="text-text-primary">1. Создайте заказ или предложение.</strong> Переключитесь в режим
                        «Нужен исполнитель» для задач или «Предлагаю услугу», если готовы выполнять сами.
                      </li>
                      <li>
                        <strong className="text-text-primary">2. Ждите отклики внутри системы.</strong> Исполнители отвечают на ваши заказы,
                        а студенты-заказчики подтверждают бронь на ваши услуги.
                      </li>
                      <li>
                        <strong className="text-text-primary">3. Бюджет резервируется автоматически.</strong> Для заказов блокируем сумму у автора до
                        завершения, для предложений — списываем с покупателя при подтверждении.
                      </li>
                    </ol>
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                      Комиссия платформы управляется администратором и автоматически списывается при оплате.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border-soft bg-surface-muted/60 px-4 py-4 text-sm text-text-secondary">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailStat label="Активные заказы" value={activeRequestsCount} />
                      <DetailStat label="Активные предложения" value={activeOffersCount} />
                    </div>
                    <p className="mt-4 text-xs uppercase tracking-[0.35em] text-text-muted">статус портфолио</p>
                    <p className="text-sm text-text-secondary">Скрытые позиции: {hiddenMyServicesCount}</p>
                    <div className="mt-3 rounded-2xl border border-brand-indigo/20 bg-brand-indigo/5 px-4 py-3 text-sm text-brand-indigo">
                      Создавайте разные форматы (фикс, почасово, пакеты) — клиенты видят это в фильтрах.
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTabId === 'requests' && (
            <div className="space-y-8">
              <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
                <div className="flex h-full flex-col rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-semibold text-brand-indigo">Уведомления</h3>
                    </div>
                    <div className="flex gap-2 rounded-2xl border border-border-soft bg-surface-muted p-1">
                      {(['customer', 'provider'] as const).map(scope => (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => setRequestScope(scope)}
                          className={`rounded-2xl px-3 py-1 text-xs font-semibold ${
                            requestScope === scope ? 'bg-white text-brand-indigo shadow-sm' : 'text-text-secondary'
                          }`}
                        >
                          {scope === 'customer' ? 'Я заказчик' : 'Я исполнитель'}
                        </button>
                      ))}
                    </div>
                  </div>

                      {currentUser ? (
                        <div className="mt-4 grid grid-cols-1 gap-3">
                      {isLoadingRequests ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-border-soft px-4 py-3 text-sm text-text-secondary">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-indigo/20 border-t-brand-indigo"></div>
                          Загружаем заявки...
                        </div>
                      ) : requests.length === 0 ? (
                        <EmptyState
                          title="Заявок пока нет"
                          description="Отправьте отклик как исполнитель или ждите, пока коллеги выберут ваше объявление."
                        />
                      ) : (
                            requests.slice(0, 6).map(request => (
                              <RequestCard
                                key={request.id}
                                request={request}
                                scope={requestScope}
                                onUpdateStatus={handleUpdateRequestStatus}
                                onOpenChat={handleOpenChat}
                                pendingActionId={pendingRequestActionId}
                                currentUserId={currentUserId}
                              />
                            ))
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-text-secondary">
                      Авторизуйтесь, чтобы управлять заказами, переписываться и подтверждать исполнителей.
                    </div>
                  )}
                </div>

                <div className="flex h-full flex-col gap-6 rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-text-muted">как это работает</p>
                  <ol className="space-y-4 text-sm text-text-secondary">
                    <li>
                      <strong className="text-text-primary">1. Создайте заказ или предложение.</strong> Переключитесь в режим «Нужен исполнитель» для задач или «Предлагаю услугу», если готовы выполнять сами.
                    </li>
                    <li>
                      <strong className="text-text-primary">2. Ждите отклики внутри системы.</strong> Исполнители отвечают на ваши заказы, а студенты-заказчики подтверждают бронь на ваши услуги.
                    </li>
                    <li>
                      <strong className="text-text-primary">3. Бюджет резервируется автоматически.</strong> Для заказов блокируем сумму у автора до завершения, для предложений — списываем с покупателя при подтверждении.
                    </li>
                  </ol>
                  <div className="rounded-2xl border border-brand-indigo/30 bg-brand-indigo/5 px-4 py-3 text-sm text-brand-indigo">
                    Комиссия платформы управляется администратором и автоматически списывается при оплате.
                  </div>
                </div>
              </section>
            </div>
          )}

        </div>
      </main>
      {mobileHeaderTabs.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border-subtle bg-white/95 p-3 shadow-lg backdrop-blur z-40">
          <div className="flex justify-around items-center">
            {mobileHeaderTabs.map(tab => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleTabSelectById(tab.id)}
                  className={`relative flex flex-col items-center gap-1 rounded-2xl border px-3 py-2 text-center text-xs font-medium transition-all duration-300 min-w-[80px] ${
                    isActive
                      ? 'text-brand-indigo bg-brand-seashell border-brand-almond shadow-brand-card'
                      : 'border-transparent text-text-secondary hover:text-brand-indigo hover:bg-surface-muted'
                  }`}
                >
                  {tab.badge ? (
                    <span className="absolute -top-1 -right-1 bg-brand-almond text-brand-indigo text-xs font-semibold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                      {tab.badge}
                    </span>
                  ) : null}
                  <span className="whitespace-normal leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <CreateServiceModal
        isOpen={isCreateRequestModalOpen}
        onClose={() => setIsCreateRequestModalOpen(false)}
        onSubmit={handleCreateRequestListing}
        isSubmitting={isSubmittingRequestListing}
        mode="request"
        availableTags={availableTags}
      />
      <CreateServiceModal
        isOpen={isCreateOfferModalOpen}
        onClose={() => setIsCreateOfferModalOpen(false)}
        onSubmit={handleCreateOfferListing}
        isSubmitting={isSubmittingOfferListing}
        mode="offer"
        availableTags={availableTags}
      />
      <ServiceDetailsModal
        service={selectedService}
        isOpen={isServiceDetailsOpen}
        onClose={() => setIsServiceDetailsOpen(false)}
        onRequest={service => openRequestModal(service)}
      />
      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        service={requestModalService}
        onSubmit={handleCreateRequest}
        isSubmitting={isSubmittingRequest}
      />
      <TopUpRequestModal isOpen={isTopUpModalOpen} onClose={() => setIsTopUpModalOpen(false)} />
    </div>
  );
};

export default MarketplacePage;
