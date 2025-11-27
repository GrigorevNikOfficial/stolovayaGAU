// components/layout/Input/Input.tsx
import React, { useState } from 'react';

interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'tel';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  className?: string;
  disabled?: boolean;
  icon?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
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
  min,
  max,
  step,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="relative">
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`
          w-full px-6 py-4 border border-gray-200 rounded-2xl 
          focus:outline-none focus:ring-2 focus:ring-green-medium focus:border-transparent 
          transition-all duration-300 bg-white shadow-sm hover:shadow-md
          disabled:opacity-50 disabled:cursor-not-allowed
          ${icon || isPassword ? 'pr-12' : ''}
          ${className}
        `}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg transition-colors"
          tabIndex={-1}
        >
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
      )}
      {icon && !isPassword && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
          {icon}
        </div>
      )}
    </div>
  );
};

export default Input;
