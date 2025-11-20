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
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Выберите опцию',
  className = '',
  disabled = false,
  icon,
}) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full px-6 py-4 border border-gray-200 rounded-2xl 
          focus:outline-none focus:ring-2 focus:ring-green-medium focus:border-transparent 
          transition-all duration-300 bg-white shadow-sm hover:shadow-md
          disabled:opacity-50 disabled:cursor-not-allowed
          appearance-none cursor-pointer
          ${icon ? 'pr-12' : ''}
          ${className}
        `}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Кастомная стрелка */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
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
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
          {icon}
        </div>
      )}
    </div>
  );
};

export default Select;
