"use client";

import React from 'react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized Image component with built-in performance enhancements
 * - Lazy loading by default
 * - WebP/AVIF format support via Next.js
 * - Responsive sizing
 * - Loading states
 * - Error handling
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 85, // Slightly reduced for better performance
  placeholder = 'empty',
  blurDataURL,
  loading = 'lazy',
  style,
  onLoad,
  onError,
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Error fallback
  if (imageError) {
    return (
      <div
        className={cn(
          "bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center",
          className
        )}
        style={{ width, height, ...style }}
      >
        <div className="text-center p-4">
          <div className="w-8 h-8 bg-gray-300 rounded mx-auto mb-2"></div>
          <p className="text-xs text-gray-500">Image unavailable</p>
        </div>
      </div>
    );
  }

  // Determine the correct loading behavior
  // When priority is true, Next.js automatically uses eager loading
  // So we should not pass the loading prop in that case
  const finalLoading = priority ? undefined : loading;

  return (
    <div className={cn("relative", !imageLoaded && "animate-pulse bg-gray-100", className)}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes || (fill ? '100vw' : undefined)}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        {...(finalLoading && { loading: finalLoading })}
        className={cn(
          "transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0",
          fill && "object-cover"
        )}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

/**
 * Optimized Logo component with multiple fallbacks
 */
interface OptimizedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

const logoSizes = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 80, height: 80 }
};

export const OptimizedLogo: React.FC<OptimizedLogoProps> = ({
  size = 'md',
  className,
  priority = false
}) => {
  const dimensions = logoSizes[size];

  return (
    <OptimizedImage
      src="/api/logo"
      alt="Dementia Care System Logo"
      width={dimensions.width}
      height={dimensions.height}
      className={cn("rounded-lg", className)}
      priority={priority}
      quality={90} // Higher quality for logos
      onError={() => {
        // Fallback to static logo if API fails
      }}
    />
  );
};

/**
 * Avatar component with optimized loading
 */
interface OptimizedAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const avatarSizes = {
  sm: { width: 24, height: 24, text: 'text-xs' },
  md: { width: 32, height: 32, text: 'text-sm' },
  lg: { width: 48, height: 48, text: 'text-base' }
};

export const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({
  src,
  name,
  size = 'md',
  className
}) => {
  const dimensions = avatarSizes[size];
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!src) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium",
          dimensions.text,
          className
        )}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={`${name} avatar`}
      width={dimensions.width}
      height={dimensions.height}
      className={cn("rounded-full object-cover", className)}
      quality={75} // Lower quality for avatars
    />
  );
};