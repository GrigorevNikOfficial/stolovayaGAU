// components/layout/Input/Input.tsx
import React, { useCallback, useEffect, useRef } from 'react';

interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'time' | 'date';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  onIconClick?: () => void;
  iconAriaLabel?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  required?: boolean;
}

const MAX_PHONE_DIGITS = 10;

const extractSubscriberDigits = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  if (digits.length > MAX_PHONE_DIGITS + 1) {
    return digits.slice(digits.length - MAX_PHONE_DIGITS);
  }

  if (digits.length === MAX_PHONE_DIGITS + 1 && ['7', '8'].includes(digits[0])) {
    return digits.slice(1);
  }

  const trimmed = raw.trim();
  if ((/^\+?7/.test(trimmed) || trimmed.startsWith('8')) && ['7', '8'].includes(digits[0]) && digits.length <= MAX_PHONE_DIGITS) {
    return digits.slice(1);
  }

  return digits.slice(0, MAX_PHONE_DIGITS);
};

const formatPhoneValue = (subscriberDigits: string): string => {
  if (!subscriberDigits) {
    return '+7';
  }

  const digits = subscriberDigits.slice(0, MAX_PHONE_DIGITS);
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ];

  let formatted = '+7';
  if (parts[0]) {
    formatted += ` (${parts[0]}`;
    if (parts[0].length === 3) {
      formatted += ')';
    }
  }
  if (parts[1]) {
    formatted += ` ${parts[1]}`;
  }
  if (parts[2]) {
    formatted += ` ${parts[2]}`;
  }
  if (parts[3]) {
    formatted += ` ${parts[3]}`;
  }

  return formatted.trimEnd();
};

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onFocus,
  className = '',
  disabled = false,
  icon,
  onIconClick,
  iconAriaLabel,
  min,
  max,
  step,
  required,
}) => {
  const handleChange = useCallback(
    (rawValue: string) => {
      onChange(rawValue);
    },
    [onChange]
  );

  const phoneDigitsRef = useRef<string>(extractSubscriberDigits(value));

  useEffect(() => {
    phoneDigitsRef.current = extractSubscriberDigits(value);
  }, [value]);

  const handleTelChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextRawValue = event.target.value;
      const prevValue = value || '';
      const prevDigits = phoneDigitsRef.current;
      let nextDigits = extractSubscriberDigits(nextRawValue);
      const isDeleting = nextRawValue.length < prevValue.length;

      if (isDeleting && nextDigits.length === prevDigits.length && prevDigits.length > 0) {
        nextDigits = prevDigits.slice(0, -1);
      }

      phoneDigitsRef.current = nextDigits;
      const formatted = formatPhoneValue(nextDigits);
      handleChange(formatted);
    },
    [handleChange, value]
  );

  const baseInputClasses = `
          w-full px-5 py-3.5 rounded-2xl border border-border-soft bg-white/95
          text-text-primary placeholder:text-text-muted shadow-[0_18px_50px_rgba(15,23,42,0.07)]
          focus:outline-none focus:ring-2 focus:ring-brand-almond focus:border-brand-almond
          transition-colors duration-200 hover:border-brand-almond/60 hover:bg-white
          disabled:opacity-50 disabled:cursor-not-allowed
          ${icon ? 'pr-12' : ''}
          ${className}
        `;

  const renderIcon = () => {
    if (!icon) {
      return null;
    }

    if (onIconClick) {
      return (
        <button
          type="button"
          onClick={onIconClick}
          aria-label={iconAriaLabel}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-brand-indigo transition-colors"
        >
          {icon}
        </button>
      );
    }

    return (
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary text-lg">
        {icon}
      </div>
    );
  };

  return (
    <div className="relative">
      {type === 'tel' ? (
        <input
          type="tel"
          placeholder={placeholder || '+7 (___) ___ __ __'}
          value={value || ''}
          onChange={handleTelChange}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          className={baseInputClasses}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={onFocus}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          required={required}
          className={baseInputClasses}
        />
      )}
      {renderIcon()}
    </div>
  );
};

export default Input;
