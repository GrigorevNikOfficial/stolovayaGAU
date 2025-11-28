// components/layout/Input/Input.tsx
import React from 'react';

interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'time';
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
  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        required={required}
        className={`
          w-full px-6 py-4 rounded-2xl border border-[#2d2d2c]
          focus:outline-none focus:ring-2 focus:ring-[#106157] focus:border-[#106157]
          transition-all duration-300 bg-[#161718] text-gray-100 placeholder-gray-500 shadow-sm hover:shadow-md hover:border-[#106157]
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {icon}
          </button>
        ) : (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
            {icon}
          </div>
        )
      )}
    </div>
  );
};

export default Input;
