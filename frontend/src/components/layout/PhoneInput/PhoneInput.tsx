// components/layout/PhoneInput/PhoneInput.tsx
import React from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = '+7 (___) ___ __ __',
  className = '',
  disabled = false,
}) => {
  // Функция для форматирования номера телефона
  const formatPhoneNumber = (input: string): string => {
    // Убираем все нечисловые символы, кроме +
    const cleaned = input.replace(/[^\d+]/g, '');
    
    // Если начинается с 8, заменяем на +7
    let numbers = cleaned.startsWith('8') ? '+7' + cleaned.slice(1) : cleaned;
    
    // Убеждаемся что начинается с +7
    if (!numbers.startsWith('+7')) {
      numbers = '+7' + numbers.replace(/^\+?7?/, '');
    }
    
    // Берём только цифры после +7
    const digits = numbers.slice(2).replace(/\D/g, '').slice(0, 10);
    
    // Форматируем: +7 (XXX) XXX XX-XX
    if (digits.length === 0) {
      return '+7 ';
    }
    if (digits.length <= 3) {
      return `+7 (${digits}`;
    }
    if (digits.length <= 6) {
      return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    if (digits.length <= 8) {
      return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Если пользователь полностью очистил поле
    if (inputValue === '' || inputValue === '+') {
      onChange('');
      return;
    }
    
    const formatted = formatPhoneNumber(inputValue);
    onChange(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Разрешаем навигационные клавиши
    if (
      ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(
        e.key
      )
    ) {
      return;
    }
    
    // Разрешаем только цифры и +
    if (!/[\d+]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleFocus = () => {
    // При фокусе, если поле пустое, добавляем +7
    if (!value || value === '') {
      onChange('+7 ');
    }
  };

  return (
    <input
      type="tel"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      disabled={disabled}
      maxLength={18} // +7 (XXX) XXX XX-XX = 18 символов
      className={`
        w-full px-6 py-4 border border-gray-200 rounded-2xl 
        focus:outline-none focus:ring-2 focus:ring-green-medium focus:border-transparent 
        transition-all duration-300 bg-white shadow-sm hover:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    />
  );
};

// Утилита для получения чистого номера (экспортируем для использования при отправке на сервер)
export const cleanPhoneNumber = (formatted: string): string => {
  return formatted.replace(/\D/g, '');
};

export default PhoneInput;
