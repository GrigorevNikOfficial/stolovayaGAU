import { useUnit } from 'effector-react';
import React from 'react';
import { marketplaceApi } from '../../api/services';
import { serviceRequestsApi } from '../../api/service-requests';
import Button from '../../components/layout/Button/Button';
import Footer from '../../components/layout/Footer/Footer';
import Input from '../../components/layout/Input/Input';
import Select from '../../components/layout/Select/Select';
import { Tabs } from '../../components/layout/Tabs/Tabs';
import TopUpRequestModal from '../../components/Modal/TopUpRequestModal';
import { showToast } from '../../components/layout/Toast/stores/toastStore';
import LogoSAU from '../../images/LogoSAU.svg';
import { $currentUser, logout } from '../../models/users';
import { onSocketEvent } from '../../lib/socket';
import type {
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
};

type CreateServiceFormValues = {
  title: string;
  description: string;
  category: string;
  pricingType: ServiceListing['pricingType'];
  price: string;
  tagsInput: string;
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
};

const priceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

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

  return query;
};

type MarketplaceRole = 'guest' | User['role'];

type MarketplaceTab = {
  id: 'catalog' | 'manage' | 'requests';
  label: string;
  icon: string;
  roles: MarketplaceRole[];
  badge?: number;
};

const MARKETPLACE_TABS: MarketplaceTab[] = [
  {
    id: 'catalog',
    label: 'Каталог',
    icon: '🛍️',
    roles: ['guest', 'user', 'admin', 'canteenManager', 'cateenManager', 'storeManager'],
  },
  {
    id: 'manage',
    label: 'Мои услуги',
    icon: '🧰',
    roles: ['user', 'admin', 'canteenManager', 'cateenManager', 'storeManager'],
  },
  {
    id: 'requests',
    label: 'Заявки',
    icon: '💬',
    roles: ['user', 'admin', 'canteenManager', 'cateenManager', 'storeManager'],
  },
];

const getMarketplaceTabs = (user: User | null): MarketplaceTab[] => {
  const role: MarketplaceRole = user?.role ?? 'guest';
  return MARKETPLACE_TABS.filter(tab => tab.roles.includes(role));
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

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
              <p className="text-xs uppercase tracking-[0.35em] text-text-muted">форма</p>
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

const CATEGORY_OPTIONS = [
  { label: 'Все категории', value: '' },
  { label: 'Обучение и наставничество', value: 'education' },
  { label: 'IT и цифровые сервисы', value: 'it' },
  { label: 'Дизайн и медиа', value: 'design' },
  { label: 'Организация мероприятий', value: 'events' },
  { label: 'Бытовые услуги', value: 'lifestyle' },
  { label: 'Консалтинг и аналитика', value: 'consulting' },
];

const PRICING_OPTIONS = [
  { label: 'Любой формат оплаты', value: '' },
  { label: 'Фиксированная стоимость', value: 'fixed' },
  { label: 'Почасовая ставка', value: 'hourly' },
  { label: 'Пакеты услуг', value: 'package' },
];

const SORT_OPTIONS = [
  { label: 'Сначала новые', value: 'newest' },
  { label: 'Сначала старые', value: 'oldest' },
  { label: 'Цена: по возрастанию', value: 'price_asc' },
  { label: 'Цена: по убыванию', value: 'price_desc' },
  { label: 'По рейтингу', value: 'rating' },
];

const createInitialServiceFormValues = (): CreateServiceFormValues => ({
  title: '',
  description: '',
  category: '',
  pricingType: 'fixed',
  price: '',
  tagsInput: '',
});

const CreateServiceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateServiceFormValues) => void | Promise<void>;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formState, setFormState] = React.useState<CreateServiceFormValues>(() => createInitialServiceFormValues());

  React.useEffect(() => {
    if (isOpen) {
      setFormState(createInitialServiceFormValues());
    }
  }, [isOpen]);

  const updateField = (field: keyof CreateServiceFormValues, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(formState);
  };

  const categoryOptions = CATEGORY_OPTIONS.filter(option => option.value);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Новое объявление">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            value={formState.title}
            onChange={value => updateField('title', value)}
            placeholder="Заголовок объявления"
          />
          <Select
            value={formState.category}
            onChange={value => updateField('category', value)}
            options={categoryOptions}
          />
        </div>
        <textarea
          value={formState.description}
          onChange={event => updateField('description', event.target.value)}
          placeholder="Опишите задачу, сроки и формат сотрудничества"
          className="min-h-[140px] w-full rounded-2xl border border-border-soft bg-surface-muted px-5 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-indigo"
        />
        <div className="grid gap-4 md:grid-cols-3">
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
          <Input
            value={formState.tagsInput}
            onChange={value => updateField('tagsInput', value)}
            placeholder="Теги через запятую"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="md" onClick={onClose} type="button">
            Отмена
          </Button>
          <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Публикуем...' : 'Опубликовать'}
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
  onSubmit: (payload: { message?: string }) => void | Promise<void>;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, service, onSubmit, isSubmitting }) => {
  const [formState, setFormState] = React.useState({
    message: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormState({
        message: '',
      });
    }
  }, [isOpen, service]);

  const updateField = (field: keyof typeof formState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      message: formState.message.trim() || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Новая заявка">
      {service ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-border-soft bg-surface-muted px-4 py-3 text-sm text-text-secondary">
            <p className="text-text-primary font-semibold">{service.title}</p>
            <p>Заказчик: {service.owner?.firstName} {service.owner?.lastName}</p>
          </div>
          <textarea
            value={formState.message}
            onChange={event => updateField('message', event.target.value)}
            placeholder="Сообщение исполнителю"
            className="min-h-[120px] w-full rounded-2xl border border-border-soft bg-surface-muted px-5 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-indigo"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 rounded-2xl border border-border-soft bg-surface-muted px-4 py-3">
              <p className="text-xs uppercase tracking-[0.4em] text-text-muted">спишем при отправке</p>
              <p className="mt-1 text-lg font-semibold text-brand-indigo">
                {service ? priceFormatter.format(service.price) : '—'}
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                Оплата резервируется с баланса автора объявления сразу и переводится исполнителю после завершения.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="md" onClick={onClose} type="button">
              Отмена
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Отправляем...' : 'Отправить'}
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Вы выбрали услугу">
      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-brand-lilac">подробности</p>
          <h3 className="mt-2 text-2xl font-semibold text-brand-indigo">{service.title}</h3>
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

        {service.owner && (
          <div className="flex items-center gap-4 rounded-2xl border border-border-soft bg-surface-muted px-5 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-indigo/10 text-xl">
              {service.owner.firstName?.[0]}
              {service.owner.lastName?.[0]}
            </div>
            <div>
              <p className="text-sm text-text-secondary">Заказчик</p>
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
            Оставить заявку
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
}> = ({ service, isActive, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(service)}
    className={`text-left rounded-3xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
      isActive ? 'border-brand-indigo shadow-brand-card' : 'border-border-soft'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {service.category === 'education' && '📚'}
          {service.category === 'it' && '💻'}
          {service.category === 'design' && '🎨'}
          {service.category === 'events' && '🎯'}
          {service.category === 'lifestyle' && '🧽'}
          {service.category === 'consulting' && '📊'}
          {!['education', 'it', 'design', 'events', 'lifestyle', 'consulting'].includes(service.category) && '🛠️'}
        </span>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{service.title}</h3>
          <p className="line-clamp-2 text-sm text-text-secondary">{service.description}</p>
        </div>
      </div>
      <span className="text-base font-semibold text-brand-indigo">
        {priceFormatter.format(service.price)}
      </span>
    </div>
    <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-muted">
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
      <span className="rounded-full border border-border-soft px-3 py-1">
        👁 {service.views}
      </span>
      <span className="rounded-full border border-border-soft px-3 py-1">
        ✅ {service.completedOrders}
      </span>
    </div>
  </button>
);

const DetailStat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="rounded-2xl border border-border-soft bg-white/60 px-4 py-3">
    <p className="text-xs uppercase tracking-[0.35em] text-text-muted">{label}</p>
    <p className="text-lg font-semibold text-brand-indigo">{value}</p>
  </div>
);

const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="rounded-3xl border border-dashed border-border-soft bg-surface-muted px-6 py-12 text-center">
    <p className="text-2xl" aria-hidden>
      🌿
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
}> = ({ request, scope, onUpdateStatus, onOpenChat, pendingActionId }) => {
  const counterpart = scope === 'customer' ? request.provider : request.customer;
  const counterpartName = counterpart ? `${counterpart.firstName} ${counterpart.lastName}` : '—';
  const isActionPending = pendingActionId === request.id;
  const canAccept = scope === 'customer' && request.status === 'pending';
  const canDecline = canAccept;
  const canCancel = scope === 'provider' && request.status === 'pending';
  const canComplete = ['accepted', 'in_progress'].includes(request.status);
  const canOpenChat = Boolean(request.chatId);

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
          <p className="text-sm text-text-secondary">Собеседник: {counterpartName}</p>
          <p className="text-xs text-text-muted">Создана {formatRequestDate(request.createdAt)}</p>
        </div>
        <div className="text-right">
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
            Открыть чат
          </Button>
        )}
      </div>
    </div>
  );
};

export const MarketplacePage: React.FC = () => {
  const { currentUser, handleLogout } = useUnit({
    currentUser: $currentUser,
    handleLogout: logout,
  });
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
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
  const [requestModalService, setRequestModalService] = React.useState<ServiceListing | null>(null);
  const [isSubmittingService, setIsSubmittingService] = React.useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = React.useState(false);
  const [listReloadKey, setListReloadKey] = React.useState(0);
  const [myServicesReloadKey, setMyServicesReloadKey] = React.useState(0);
  const [requestsReloadKey, setRequestsReloadKey] = React.useState(0);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = React.useState(false);
  const [incomingRequests, setIncomingRequests] = React.useState<ServiceRequest[]>([]);
  const [isLoadingIncomingRequests, setIsLoadingIncomingRequests] = React.useState(false);

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
  const activeTabId = availableTabs[safeActiveTabIndex]?.id ?? 'catalog';

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

  const handleNavigate = React.useCallback((path: string) => {
    const nextUrl = new URL(path, window.location.origin);
    window.history.pushState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const handleLogoutClick = React.useCallback(() => {
    handleLogout();
    setTimeout(() => {
      handleNavigate('/');
    }, 100);
  }, [handleLogout, handleNavigate]);

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

    serviceRequestsApi
      .getRequests({ scope: 'customer', status: 'pending' })
      .then(response => {
        if (isActive) {
          setIncomingRequests(response.data);
        }
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
      onSocketEvent('marketplace:requests:created', () => {
        refreshRequests();
      }),
      onSocketEvent('marketplace:requests:updated', () => {
        refreshRequests();
      }),
      onSocketEvent('marketplace:requests:deleted', () => {
        refreshRequests();
      }),
    ];

    return () => {
      unsubscribes.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [refreshListings, refreshMyServices, refreshRequests]);

  const uniqueCategories = React.useMemo(() => new Set(services.map(service => service.category)).size, [services]);
  const uniqueProviders = React.useMemo(
    () => new Set(services.map(service => service.owner?.id).filter(Boolean)).size,
    [services]
  );
  const activeMyServicesCount = React.useMemo(
    () => myServices.filter(service => service.isActive).length,
    [myServices]
  );
  const hiddenMyServicesCount = React.useMemo(
    () => myServices.filter(service => !service.isActive).length,
    [myServices]
  );

  const openCreateModal = () => {
    if (!currentUser) {
      showToast({ message: 'Авторизуйтесь, чтобы размещать услуги', type: 'error' });
      return;
    }
    setIsCreateModalOpen(true);
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

  const handleCreateService = async (payload: CreateServiceFormValues) => {
    if (!currentUser) {
      showToast({ message: 'Авторизуйтесь, чтобы размещать услуги', type: 'error' });
      return;
    }

    const tags = payload.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    const formattedPayload = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category,
      price: Number(payload.price),
      pricingType: payload.pricingType,
      tags,
      skills: tags,
    } as const;

    if (!formattedPayload.title || !formattedPayload.description || Number.isNaN(formattedPayload.price)) {
      showToast({ message: 'Заполните обязательные поля и корректную цену', type: 'error' });
      return;
    }

    try {
      setIsSubmittingService(true);
      await marketplaceApi.createService(formattedPayload);
      showToast({ message: 'Услуга опубликована', type: 'success' });
      setIsCreateModalOpen(false);
      refreshListings();
      refreshMyServices();
    } catch (error: any) {
      showToast({ message: error.message || 'Ошибка при создании услуги', type: 'error' });
    } finally {
      setIsSubmittingService(false);
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
      });
      showToast({ message: 'Заявка отправлена исполнителю', type: 'success' });
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
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-white/95 shadow-sm backdrop-blur">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between gap-4 py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigate('/')}
                className="group flex items-center gap-3 rounded-2xl border border-transparent px-1 py-1 text-left transition-all duration-200 hover:border-brand-indigo/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30"
                aria-label="Перейти на страницу навигации"
              >
                <img
                  src={LogoSAU}
                  alt="Логотип сервиса"
                  className="h-9 w-9 rounded-2xl border border-transparent transition-transform duration-200 group-hover:scale-105 sm:h-10 sm:w-10"
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-text-muted transition-colors duration-200 group-hover:text-brand-indigo">
                      сервис
                    </p>
                    <h1 className="text-lg font-semibold text-brand-indigo transition-colors duration-200 group-hover:text-brand-grape sm:text-xl lg:text-2xl">
                      Маркетплейс услуг
                    </h1>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-indigo">
                    тестируется
                  </span>
                </div>
              </button>
            </div>
            <div className="hidden lg:flex flex-1 justify-center">
              <Tabs
                tabs={availableTabs}
                activeTab={safeActiveTabIndex}
                onTabChange={setActiveTab}
                justify="center"
                className="max-w-3xl"
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsTopUpModalOpen(true)}
                    className="flex items-center gap-2 rounded-full border border-brand-grape/40 bg-brand-grape/10 px-3 py-1.5 text-sm font-semibold text-brand-indigo shadow-inner hover:bg-brand-grape/20"
                  >
                    <span className="text-base sm:text-lg">{(currentUser.balance ?? 0).toLocaleString('ru-RU')} ₽</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-grape text-white">+</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleProfileNavigate}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-all duration-200 hover:border-brand-indigo/40 hover:text-brand-indigo"
                    aria-label="Профиль"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-brand-indigo text-base font-semibold text-white">
                      {avatarUrl ? <img src={avatarUrl} alt="Аватар" className="h-full w-full rounded-full object-cover" /> : userInitials}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-colors hover:border-brand-indigo/40 hover:text-brand-indigo"
                    aria-label="Выйти"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </button>
                </>
              ) : (
                <Button variant="primary" size="sm" onClick={() => handleNavigate('/login')}>
                  Войти
                </Button>
              )}
            </div>
          </div>
          <div className="pb-3 lg:hidden">
            <Tabs tabs={availableTabs} activeTab={safeActiveTabIndex} onTabChange={setActiveTab} className="w-full" />
          </div>
        </div>
      </header>

      <main className="w-full flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {activeTabId === 'catalog' && (
            <div className="space-y-10">
              <section className="rounded-[36px] border border-border-soft bg-white p-8 shadow-brand-card">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-brand-lilac">новый сервис</p>
                    <h2 className="mt-3 text-4xl font-semibold text-brand-indigo">Маркетплейс услуг</h2>
                    <p className="mt-4 max-w-2xl text-lg text-text-secondary">
                      Находите проверенных исполнителей внутри университета, оставляйте заявки и управляйте балансом без перехода в другие приложения.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4 text-sm text-text-secondary">
                      <div className="rounded-2xl border border-border-soft px-4 py-2">
                        {pagination?.total ?? 0} активных предложений
                      </div>
                      <div className="rounded-2xl border border-border-soft px-4 py-2">{uniqueCategories} категорий</div>
                      <div className="rounded-2xl border border-border-soft px-4 py-2">{uniqueProviders} исполнителей</div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button variant="primary" size="md" onClick={openCreateModal}>
                        Разместить услугу
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => handleNavigate('/')}
                        className="border-border-soft"
                      >
                        Вернуться к сервисам
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-brand-indigo/15 bg-brand-indigo/5 p-5 text-sm text-brand-indigo">
                    <p className="text-xs uppercase tracking-[0.4em] text-brand-indigo/70">баланс и защита оплат</p>
                    <p className="mt-3 text-base text-brand-indigo">
                      Оплата удерживается до завершения работы. Приём и вывод средств происходят внутри корпоративных счетов.
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid gap-8">
                <div className="space-y-6">
                  <div className="rounded-[28px] border border-border-soft bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        value={filters.search}
                        onChange={value => handleFilterChange('search', value)}
                        placeholder="Поиск по названию или тегам"
                      />
                      <Select
                        value={filters.category}
                        onChange={value => handleFilterChange('category', value)}
                        options={CATEGORY_OPTIONS}
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
                  </div>

                  <div className="space-y-4">
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
                      <div className="grid gap-4 md:grid-cols-2">
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
                      <div className="flex items-center justify-between rounded-2xl border border-border-soft bg-white px-4 py-3 text-sm">
                        <span className="text-text-secondary">
                          Страница {pagination.page} из {pagination.pages}
                        </span>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => handleFilterChange('page', Math.max(1, (pagination?.page ?? 1) - 1))}
                          >
                            Назад
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === pagination.pages}
                            onClick={() =>
                              handleFilterChange('page', Math.min(pagination.pages, (pagination?.page ?? 1) + 1))
                            }
                          >
                            Вперёд
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
              <section className="rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-text-muted">отклики на объявления</p>
                    <h3 className="mt-2 text-xl font-semibold text-brand-indigo">Выбирайте исполнителей</h3>
                    <p className="text-sm text-text-secondary">После подтверждения заказ сразу переходит в работу.</p>
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
                    title="Новых заявок пока нет"
                    description="Как только коллеги откликнутся на объявление, мы покажем их здесь."
                  />
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {incomingRequests.slice(0, 4).map(request => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        scope="customer"
                        onUpdateStatus={handleUpdateRequestStatus}
                        onOpenChat={handleOpenChat}
                        pendingActionId={pendingRequestActionId}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTabId === 'manage' && (
            <div className="space-y-8">
              <section className="grid gap-6 lg:grid-cols-[1.5fr_0.7fr]">
                <div className="rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-text-muted">мои размещения</p>
                      <h3 className="mt-2 text-2xl font-semibold text-brand-indigo">Управляйте своими услугами</h3>
                    </div>
                    <Button variant="primary" size="sm" onClick={openCreateModal}>
                      Разместить услугу
                    </Button>
                  </div>
                  {currentUser ? (
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
                        myServices.slice(0, 4).map(service => (
                          <div key={service.id} className="rounded-2xl border border-border-soft px-5 py-4">
                            <div className="flex items-center justify-between text-sm">
                              <div>
                                <p className="font-medium text-text-primary">{service.title}</p>
                                <p className="text-xs text-text-secondary">
                                  Обновлено {new Date(service.updatedAt).toLocaleDateString('ru-RU')}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.35em] ${
                                  service.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-border-soft text-text-muted'
                                }`}
                              >
                                {service.isActive ? 'активно' : 'скрыто'}
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
                        ))
                      )}
                      {myServices.length > 0 && (
                        <p className="text-xs text-text-muted">
                          Удалить объявление можно, пока по нему нет активных заявок (принятых или в работе).
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-text-secondary">
                      Войдите в систему, чтобы публиковать услуги и управлять заказами.
                    </div>
                  )}
                </div>

                <div className="space-y-6 rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-text-muted">инструменты исполнителя</p>
                  <ul className="space-y-3 text-sm text-text-secondary">
                    <li>Обновляйте описание и стоимость, чтобы чаще попадать в подборки.</li>
                    <li>Добавляйте до пяти тегов — система выделит популярные навыки.</li>
                    <li>Скрывайте услуги, когда заняты: клиенты увидят статус в карточке.</li>
                  </ul>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailStat label="Активные" value={activeMyServicesCount} />
                    <DetailStat label="Скрытые" value={hiddenMyServicesCount} />
                  </div>
                  <div className="rounded-2xl border border-brand-indigo/20 bg-brand-indigo/5 px-4 py-3 text-sm text-brand-indigo">
                    Создавайте разные форматы (фикс, почасово, пакеты) — клиенты видят это в фильтрах.
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTabId === 'requests' && (
            <div className="space-y-8">
              <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-text-muted">заявки и отклики</p>
                      <h3 className="mt-2 text-xl font-semibold text-brand-indigo">Управление заказами</h3>
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
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
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

                <div className="space-y-6 rounded-[32px] border border-border-soft bg-white p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.4em] text-text-muted">как это работает</p>
                  <ol className="space-y-4 text-sm text-text-secondary">
                    <li>
                      <strong className="text-text-primary">1. Разместите объявление.</strong> Опишите задачу, цену и навыки, которые нужны.
                    </li>
                    <li>
                      <strong className="text-text-primary">2. Получайте отклики.</strong> Исполнители оставляют заявки, а вы подтверждаете подходящих.
                    </li>
                    <li>
                      <strong className="text-text-primary">3. Средства резервируются.</strong> Баланс автора объявления списывается сразу и переводится исполнителю после завершения.
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

      <Footer />

      <CreateServiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateService}
        isSubmitting={isSubmittingService}
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
