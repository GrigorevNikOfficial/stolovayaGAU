import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  icon?: string;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  icon,
  required = false,
}) => {
  const shouldRenderPlaceholder = typeof placeholder === 'string' && placeholder.length > 0;

  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`
          w-full px-5 py-3.5 rounded-2xl border border-border-soft bg-white/95
          text-text-primary placeholder:text-text-muted shadow-[0_18px_50px_rgba(15,23,42,0.07)]
          focus:outline-none focus:ring-2 focus:ring-brand-almond focus:border-brand-almond
          transition-all duration-200 hover:border-brand-almond/60 hover:bg-white
          disabled:opacity-50 disabled:cursor-not-allowed
          appearance-none cursor-pointer
          ${icon ? 'pr-12' : ''}
          ${className}
        `}
      >
        {shouldRenderPlaceholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Кастомная стрелка */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-text-muted">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {icon && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted text-lg">
          {icon}
        </div>
      )}
    </div>
  );
};

export default Select;
