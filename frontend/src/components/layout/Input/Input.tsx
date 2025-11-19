// components/layout/Input/Input.tsx
import React from 'react';

interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  icon?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  className = '',
  disabled = false,
  icon,
}) => {
  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full px-6 py-4 border border-gray-200 rounded-2xl 
          focus:outline-none focus:ring-2 focus:ring-green-medium focus:border-transparent 
          transition-all duration-300 bg-white shadow-sm hover:shadow-md
          disabled:opacity-50 disabled:cursor-not-allowed
          ${icon ? 'pr-12' : ''}
          ${className}
        `}
      />
      {icon && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
          {icon}
        </div>
      )}
    </div>
  );
};

export default Input;
