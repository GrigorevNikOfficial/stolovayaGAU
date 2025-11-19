import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  avatarUrl?: string;
  initials?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'md',
  avatarUrl,
  initials,
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeClasses = {
    sm: 'h-8 px-4 text-sm',
    md: 'h-11 px-6 text-sm',
    lg: 'h-14 px-8 text-base',
  };

  const variantClasses = {
    primary:
      'bg-green-dark border border-green-darker text-white shadow-sm hover:bg-green-darker focus:ring-green-medium',
    secondary:
      'bg-green-medium border border-green-dark text-white shadow-sm hover:bg-green-dark focus:ring-green-darker',
    outline:
      'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-green-medium',
    icon: 'bg-transparent border-none shadow-none hover:bg-gray-100 focus:ring-green-medium rounded-full',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';

  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabled && disabledClasses,
    variant === 'icon' ? 'rounded-full' : 'rounded-lg',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Для варианта icon рендерим специальную структуру
  if (variant === 'icon') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={classes}
      >
        {avatarUrl || initials ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-light to-green-medium overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={typeof children === 'string' ? children : 'Avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-green-darker">
                {initials}
              </span>
            )}
          </div>
        ) : (
          children
        )}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
};

export default Button;
