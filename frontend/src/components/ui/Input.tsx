import React, { InputHTMLAttributes } from 'react';
import { useFontSize } from '../../context/FontSizeContext';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  hideLabel?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, hideLabel, ...props }, ref) => {
    const { fontSize } = useFontSize();
    const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Base Styles
    const baseContainer = 'flex flex-col gap-2 w-full';
    
    // Size variants
    const isLarge = fontSize === 'large';
    const labelClass = `font-medium text-gray-700 ${hideLabel ? 'sr-only' : ''} ${isLarge ? 'text-lg' : 'text-sm'}`;
    const sizes = isLarge ? 'h-14 px-5 text-lg' : 'h-12 px-4 text-base';
    const errorClass = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '';
    
    const inputClass = `w-full rounded-xl border border-gray-300 bg-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 ${sizes} ${errorClass} ${className}`;

    return (
      <div className={baseContainer}>
        <label htmlFor={inputId} className={labelClass}>
          {label}
        </label>
        
        <input
          ref={ref}
          id={inputId}
          className={inputClass}
          aria-invalid={!!error}
          aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined}
          {...props}
        />
        
        {/* Error Message (WCAG 3.3.1 Error Identification) */}
        {error && (
          <p id={errorId} className={`font-medium ${isLarge ? 'text-base' : 'text-sm'} text-red-600`} role="alert">
            {error}
          </p>
        )}
        
        {/* Helper Text */}
        {helperText && !error && (
          <p id={helperId} className={`${isLarge ? 'text-base' : 'text-sm'} text-gray-500`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
