// components/layout/Input/Input.tsx
import React, { useCallback } from 'react';
import { formatPhoneDisplay } from '../../../utils/phone';

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
      if (type === 'tel') {
        const formatted = formatPhoneDisplay(rawValue);
        onChange(formatted || '');
        return;
      }

      onChange(rawValue);
    },
    [onChange, type]
  );

  return (
    <div className="relative">
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
        className={`
          w-full px-5 py-3.5 rounded-2xl border border-border-soft bg-surface-muted
          text-text-primary placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-brand-indigo
          transition-colors duration-200 shadow-sm hover:bg-white
          disabled:opacity-50 disabled:cursor-not-allowed
          ${icon ? 'pr-12' : ''}
          ${className}
        `}
      />
      {icon && (
        onIconClick ? (
          <button
            type="button"
            onClick={onIconClick}
            aria-label={iconAriaLabel}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-brand-indigo transition-colors"
          >
            {icon}
          </button>
        ) : (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary text-lg">
            {icon}
          </div>
        )
      )}
    </div>
  );
};

export default Input;
