import React from 'react';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  avatarUrl?: string;
  initials?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children = null,
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
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-indigo/30 focus:ring-offset-brand-seashell';

  const sizeClasses = {
    sm: 'h-8 px-4 text-sm rounded-xl',
    md: 'h-11 px-6 text-sm rounded-2xl',
    lg: 'h-14 px-8 text-base rounded-2xl',
    xl: 'h-18 px-10 text-xl rounded-3xl',
  };

  const variantClasses = {
    primary:
      'bg-brand-indigo border border-brand-indigo text-white shadow-brand-card hover:bg-brand-grape hover:border-brand-grape',
    secondary:
      'bg-brand-almond border border-brand-almond text-brand-indigo shadow-sm hover:bg-brand-seashell',
    outline:
      'bg-transparent border border-border-soft text-brand-indigo hover:border-brand-indigo hover:bg-brand-seashell',
    icon: 'bg-white border border-border-soft text-brand-indigo hover:bg-brand-seashell rounded-full shadow-sm',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';

  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabled && disabledClasses,
    variant === 'icon' ? 'rounded-full' : '',
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
