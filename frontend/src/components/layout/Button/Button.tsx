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
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeClasses = {
    sm: 'h-8 px-4 text-sm',
    md: 'h-11 px-6 text-sm',
    lg: 'h-14 px-8 text-base',
    xl: 'h-18 px-10 text-xl',
  };

  const variantClasses = {
    primary:
      'bg-[#106157] border-2 border-[#0c4a43] text-white shadow-sm hover:bg-[#0d584c] hover:border-[#0a3c35] hover:shadow-lg shadow-[#106157]/30 transform hover:translate-y-[-2px] transition-all duration-400 ease-out',
    secondary:
      'bg-[#0d4a43] border border-[#106157] text-white shadow-sm hover:bg-[#106157] focus:ring-[#106157]/40',
    outline:
      'bg-transparent border border-[#455252] text-white hover:bg-[#2d2d2c] focus:ring-[#106157]/40',
    icon: 'bg-transparent border-none shadow-none hover:bg-[#2d2d2c] focus:ring-[#106157]/40 rounded-full text-white',
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
