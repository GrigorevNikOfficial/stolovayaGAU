const stripToDigits = (value: string): string => value.replace(/\D/g, '');

export const normalizePhoneDigits = (value: string): string => {
  let digits = stripToDigits(value);

  if (!digits) {
    return '';
  }

  if (digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  }

  if (!digits.startsWith('7')) {
    digits = `7${digits}`;
  }

  return digits.slice(0, 11);
};

export const formatPhoneDisplay = (value: string): string => {
  const digits = normalizePhoneDigits(value);

  if (!digits) {
    return '';
  }

  const tail = digits.slice(1);
  let formatted = '+7';

  if (tail.length > 0) {
    formatted += ` (${tail.slice(0, Math.min(3, tail.length))}`;
    if (tail.length >= 3) {
      formatted += ')';
    }
  }

  if (tail.length > 3) {
    formatted += ` ${tail.slice(3, Math.min(6, tail.length))}`;
  }

  if (tail.length > 6) {
    formatted += ` ${tail.slice(6, Math.min(8, tail.length))}`;
  }

  if (tail.length > 8) {
    formatted += `-${tail.slice(8, Math.min(10, tail.length))}`;
  }

  return formatted.trimEnd();
};

export const phoneToApiFormat = (value: string): string => {
  const digits = normalizePhoneDigits(value);
  return digits.length === 11 ? `+${digits}` : '';
};
