import React, { ButtonHTMLAttributes } from 'react';
import { useFontSize } from '../../context/FontSizeContext';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, 'aria-label': ariaLabel, ...props }, ref) => {
    const { fontSize } = useFontSize();
    const isLarge = fontSize === 'large';

    // WCAG Compliant Base Styles (Focus indicators, contrast)
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      outline: 'border-2 border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
    };

    // Increase size for Large Font
    const sizes = {
      sm: isLarge ? 'h-11 px-5 text-base' : 'h-9 px-4 text-sm',
      md: isLarge ? 'h-13 px-7 text-lg' : 'h-11 px-6 text-base',
      lg: isLarge ? 'h-16 px-10 text-xl' : 'h-14 px-8 text-lg',
      xl: isLarge ? 'h-20 px-12 text-2xl' : 'h-16 px-10 text-xl',
      icon: isLarge ? 'w-14 h-14 p-2 text-xl' : 'w-11 h-11 p-2 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
