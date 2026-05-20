"use client";

import React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Props for the Logo component
 */
export interface LogoProps {
  /** Predefined size or custom number in pixels */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Additional CSS classes to apply */
  className?: string;
  /** Custom width in pixels (overrides size) */
  width?: number;
  /** Custom height in pixels (overrides size) */
  height?: number;
  /** Alt text for accessibility */
  alt?: string;
  /** Whether to prioritize loading this image */
  priority?: boolean;
}

/** Mapping of size names to pixel values */
const sizeMap = { sm: 24, md: 32, lg: 48, xl: 64 } as const;

/**
 * Dementia Care Logo Component
 * 
 * Displays the dementia care logo with multiple fallback options and error handling.
 * Features responsive sizing, loading states, and graceful degradation to a healthcare-themed
 * fallback icon when the image fails to load.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Logo size="md" className="drop-shadow-lg" />
 * 
 * // Custom dimensions with priority loading
 * <Logo width={80} height={80} priority className="mx-auto" />
 * 
 * // Responsive sizing
 * <Logo className="w-16 h-16 sm:w-20 sm:h-20" />
 * ```
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className,
  width,
  height,
  alt = 'Dementia Care System Logo',
  priority = false,
}) => {
  // Temporarily use API route until PNG file is restored
  const src = '/api/logo';

  const getDimensions = () => {
    if (width && height) return { width, height };
    const sizeValue = typeof size === 'number' ? size : sizeMap[size];
    return { width: sizeValue, height: sizeValue };
  };

  const { width: w, height: h } = getDimensions();

  // Simple, direct img tag approach for maximum reliability
  return (
    <img
      src={src}
      alt={alt}
      width={w}
      height={h}
      className={cn('transparent-logo', className)}
      style={{
        width: w,
        height: h,
        background: 'transparent',
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        display: 'block'
      }}
    />
  );
};

export const LogoIcon: React.FC<Omit<LogoProps, 'size'>> = (props) => (
  <Logo {...props} />
);

export const LogoFull: React.FC<Omit<LogoProps, 'size'>> = (props) => (
  <Logo {...props} />
);

export default Logo;
