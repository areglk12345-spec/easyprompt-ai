import React, { TextareaHTMLAttributes } from 'react';
import { useFontSize } from '../../context/FontSizeContext';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  hideLabel?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, helperText, id, hideLabel, ...props }, ref) => {
    const { fontSize } = useFontSize();
    const textareaId = id || `textarea-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    // Base Styles
    const baseContainer = 'flex flex-col gap-2 w-full';
    
    // Size variants
    const isLarge = fontSize === 'large';
    const labelClass = `font-medium text-gray-700 ${hideLabel ? 'sr-only' : ''} ${isLarge ? 'text-lg' : 'text-sm'}`;
    const paddingClass = isLarge ? 'p-4 text-lg' : 'p-3 text-base';
    const errorClass = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '';
    
    const textareaClass = `w-full rounded-xl border border-gray-300 bg-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 resize-y ${paddingClass} ${errorClass} ${className}`;

    return (
      <div className={baseContainer}>
        <label htmlFor={textareaId} className={labelClass}>
          {label}
        </label>
        
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClass}
          aria-invalid={!!error}
          aria-errormessage={error ? errorId : undefined}
          aria-describedby={helperText ? helperId : undefined}
          {...props}
        />

        {/* Error or Helper Text */}
        {(error || helperText) && (
          <div className="flex flex-col gap-1 mt-1">
            {error && (
              <span id={errorId} className={`${isLarge ? 'text-base' : 'text-sm'} font-medium text-red-600`} role="alert">
                {error}
              </span>
            )}
            {helperText && !error && (
              <span id={helperId} className={`${isLarge ? 'text-base' : 'text-sm'} text-gray-500`}>
                {helperText}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
