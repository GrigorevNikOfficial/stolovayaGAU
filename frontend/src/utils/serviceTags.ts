const STORAGE_KEY = 'marketplaceCustomTags';

const sanitizeTags = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  const deduped = new Map<string, string>();
  input.forEach(tag => {
    if (typeof tag !== 'string') {
      return;
    }
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
};

export const SERVICE_TAG_STORAGE_KEY = STORAGE_KEY;

export const getStoredServiceTags = (): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return sanitizeTags(parsed);
  } catch {
    return [];
  }
};

export const setStoredServiceTags = (tags: string[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const sanitized = sanitizeTags(tags);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Игнорируем ошибки записи
  }
};

export const addServiceTagToStorage = (
  tag: string
): { success: boolean; tags: string[]; reason?: 'empty' | 'exists' } => {
  const trimmed = tag.trim();
  if (!trimmed) {
    return { success: false, tags: [], reason: 'empty' };
  }

  const current = getStoredServiceTags();
  const normalized = trimmed.toLowerCase();
  if (current.some(existing => existing.toLowerCase() === normalized)) {
    return { success: false, tags: current, reason: 'exists' };
  }

  const next = [...current, trimmed];
  setStoredServiceTags(next);
  return { success: true, tags: next };
};
