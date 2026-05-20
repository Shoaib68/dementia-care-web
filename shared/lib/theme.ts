/**
 * Dementia Care Theme Configuration
 * 
 * This file contains the complete theme system for the Dementia Care application.
 * Colors are extracted from the dementia care logo to ensure consistent branding
 * across all components and pages.
 * 
 * The theme follows healthcare design principles with:
 * - High contrast ratios for accessibility (WCAG AA compliant)
 * - Professional, calming color palette
 * - Light theme optimized for medical environments
 * - Responsive design tokens for all screen sizes
 * 
 * @example
 * ```tsx
 * import { lightTheme, brandColors, themeClasses } from '@/shared/lib/theme';
 * 
 * // Use semantic tokens
 * const bgColor = lightTheme.background.primary;
 * 
 * // Use utility classes
 * <div className={themeClasses.bg.primary}>
 * 
 * // Use brand colors
 * <div style={{ color: brandColors.teal[400] }}>
 * ```
 */

/**
 * Brand color palette extracted from the dementia care logo
 * Contains full color scales for teal, purple, green, and neutral tones
 */
export const brandColors = {
  // Primary colors from logo
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1', 
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',  // Main teal from logo
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',  // Main purple from logo
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',  // Brain/tree color from logo
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  // Neutral colors for backgrounds and text
  neutral: {
    50: '#fafafa',   // Light background
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',  // Dark text
    900: '#171717',
  }
} as const;

export const lightTheme = {
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: brandColors.neutral[50],
    tertiary: brandColors.neutral[100],
  },
  
  // Surface colors for cards, modals, etc.
  surface: {
    primary: '#ffffff',
    secondary: brandColors.neutral[50],
    elevated: '#ffffff',
  },
  
  // Text colors
  text: {
    primary: brandColors.neutral[900],
    secondary: brandColors.neutral[700],
    tertiary: brandColors.neutral[500],
    inverse: '#ffffff',
  },
  
  // Border colors
  border: {
    primary: brandColors.neutral[200],
    secondary: brandColors.neutral[300],
    focus: brandColors.teal[400],
  },
  
  // Brand colors
  brand: {
    primary: brandColors.teal[400],
    secondary: brandColors.purple[500],
    accent: brandColors.green[300],
  },
  
  // State colors
  states: {
    success: brandColors.green[500],
    warning: '#f59e0b',
    error: '#ef4444',
    info: brandColors.teal[400],
  },
  
  // Gradients
  gradients: {
    primary: `linear-gradient(135deg, ${brandColors.teal[400]} 0%, ${brandColors.purple[500]} 100%)`,
    secondary: `linear-gradient(135deg, ${brandColors.green[300]} 0%, ${brandColors.teal[300]} 100%)`,
    subtle: `linear-gradient(135deg, ${brandColors.neutral[50]} 0%, ${brandColors.neutral[100]} 100%)`,
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
} as const;

// CSS Custom Properties for easy theme switching
export const cssVariables = {
  // Background
  '--bg-primary': lightTheme.background.primary,
  '--bg-secondary': lightTheme.background.secondary,
  '--bg-tertiary': lightTheme.background.tertiary,
  
  // Surface  
  '--surface-primary': lightTheme.surface.primary,
  '--surface-secondary': lightTheme.surface.secondary,
  '--surface-elevated': lightTheme.surface.elevated,
  
  // Text
  '--text-primary': lightTheme.text.primary,
  '--text-secondary': lightTheme.text.secondary,
  '--text-tertiary': lightTheme.text.tertiary,
  '--text-inverse': lightTheme.text.inverse,
  
  // Border
  '--border-primary': lightTheme.border.primary,
  '--border-secondary': lightTheme.border.secondary,
  '--border-focus': lightTheme.border.focus,
  
  // Brand
  '--brand-primary': lightTheme.brand.primary,
  '--brand-secondary': lightTheme.brand.secondary,
  '--brand-accent': lightTheme.brand.accent,
  
  // States
  '--state-success': lightTheme.states.success,
  '--state-warning': lightTheme.states.warning,
  '--state-error': lightTheme.states.error,
  '--state-info': lightTheme.states.info,
} as const;

// Tailwind CSS class utilities for the light theme
export const themeClasses = {
  // Backgrounds
  bg: {
    primary: 'bg-white',
    secondary: 'bg-neutral-50',
    tertiary: 'bg-neutral-100',
    brand: 'bg-teal-400',
    brandSecondary: 'bg-purple-500',
    accent: 'bg-green-300',
  },
  
  // Text
  text: {
    primary: 'text-neutral-900',
    secondary: 'text-neutral-700', 
    tertiary: 'text-neutral-500',
    inverse: 'text-white',
    brand: 'text-teal-400',
    brandSecondary: 'text-purple-500',
  },
  
  // Borders
  border: {
    primary: 'border-neutral-200',
    secondary: 'border-neutral-300',
    focus: 'border-teal-400',
  },
  
  // Gradients
  gradient: {
    primary: 'bg-gradient-to-br from-teal-400 to-purple-500',
    secondary: 'bg-gradient-to-br from-green-300 to-teal-300',
    subtle: 'bg-gradient-to-br from-neutral-50 to-neutral-100',
  },
} as const;

export type ThemeColors = typeof lightTheme;
export type BrandColors = typeof brandColors;

/**
 * Layout component theme utilities
 * 
 * These utilities provide consistent theming for header and sidebar components
 * to ensure they match the login page light theme design.
 */
export const layoutTheme = {
  header: {
    background: 'bg-gradient-to-br from-neutral-50 via-white to-neutral-100',
    overlay: 'bg-gradient-to-r from-teal-50/20 via-purple-50/10 to-green-50/20',
    border: 'border-neutral-200/60',
    shadow: 'shadow-sm',
    text: {
      primary: 'text-neutral-900',
      secondary: 'text-neutral-600',
      gradient: 'bg-gradient-to-r from-teal-600 via-purple-600 to-green-600 bg-clip-text text-transparent drop-shadow-sm'
    },
    menuButton: {
      default: 'text-neutral-600 hover:text-teal-700 hover:bg-teal-50',
      border: 'border-transparent hover:border-teal-200/50'
    },
    userInfo: {
      background: 'bg-white/80 hover:bg-teal-50/50',
      border: 'border-neutral-200/60 hover:border-teal-300/60',
      shadow: 'shadow-sm hover:shadow-md hover:shadow-teal-500/10',
      avatar: 'bg-gradient-to-br from-teal-500 to-purple-600 hover:from-teal-400 hover:to-purple-500',
      text: 'text-neutral-900 group-hover:text-teal-900',
      role: 'text-neutral-600 bg-gradient-to-r from-teal-100/60 to-purple-100/60 group-hover:from-teal-200/60 group-hover:to-purple-200/60 group-hover:text-neutral-700'
    }
  },
  sidebar: {
    background: 'bg-gradient-to-br from-white via-neutral-50 to-white',
    overlay: 'bg-gradient-to-br from-teal-50/15 via-purple-50/8 to-green-50/15',
    border: 'border-neutral-200/60',
    shadow: 'shadow-lg',
    mobileOverlay: 'bg-neutral-900/60',
    header: {
      background: 'bg-white/70 hover:bg-teal-50/30',
      border: 'border-neutral-200/60',
      text: {
        primary: 'bg-gradient-to-r from-teal-600 via-purple-600 to-green-600 bg-clip-text text-transparent drop-shadow-sm group-hover:from-teal-700 group-hover:via-purple-700 group-hover:to-green-700',
        secondary: 'text-neutral-600 group-hover:text-neutral-700'
      },
      closeButton: 'text-neutral-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200/40'
    },
    navigation: {
      item: {
        default: 'text-neutral-700 hover:text-teal-800 hover:from-teal-50/50 hover:to-purple-50/50 hover:shadow-teal-500/10',
        active: 'bg-gradient-to-r from-teal-50 to-purple-50 text-teal-900 shadow-teal-500/20 border-teal-200/60 hover:from-teal-100 hover:to-purple-100 hover:shadow-teal-500/30',
        border: 'border-transparent hover:border-teal-200/30'
      },
      icon: {
        default: 'bg-neutral-100/60 text-neutral-600 group-hover:from-teal-100/60 group-hover:to-purple-100/60 group-hover:text-teal-700',
        active: 'bg-teal-100/80 text-teal-700 group-hover:bg-teal-200/80'
      },
      indicator: {
        default: 'bg-neutral-400/60 group-hover:bg-teal-500/60 group-hover:shadow-teal-500/20',
        active: 'bg-teal-500/60 animate-pulse group-hover:bg-teal-500/80 group-hover:shadow-teal-500/30'
      }
    },
    logout: {
      background: 'bg-white/70 hover:bg-red-50/80',
      border: 'border-neutral-200/60 hover:border-red-200/60',
      button: 'text-neutral-600 hover:text-red-700 hover:from-red-50/60 hover:to-red-100/60',
      shadow: 'shadow-md hover:shadow-red-500/10',
      dialog: {
        background: 'bg-white',
        border: 'border-neutral-200',
        text: 'text-neutral-900',
        description: 'text-neutral-600',
        cancel: 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900',
        confirm: 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-500/20'
      }
    }
  }
} as const;

export type LayoutTheme = typeof layoutTheme;

/**
 * HCI-compliant spacing and layout utilities
 * 
 * These utilities provide consistent spacing following the 8px grid system
 * and proper visual hierarchy principles for healthcare applications.
 */
export const spacingTheme = {
  // Content spacing - 8px grid system
  content: {
    section: 'space-y-8',        // 32px between major sections
    subsection: 'space-y-6',     // 24px between subsections
    group: 'space-y-4',          // 16px between related items
    item: 'space-y-3',           // 12px between small items
    tight: 'space-y-2',          // 8px for tight spacing
  },
  
  // Padding utilities
  padding: {
    page: 'p-6 lg:p-8',          // Page-level padding
    section: 'p-6',              // Section padding
    card: 'p-4 sm:p-6',          // Card padding
    compact: 'p-4',             // Compact padding
  },
  
  // Margin utilities  
  margin: {
    section: 'mb-8',            // Section bottom margin
    subsection: 'mb-6',         // Subsection bottom margin
    element: 'mb-4',            // Element bottom margin
    small: 'mb-3',              // Small element margin
  },
  
  // Grid spacing
  grid: {
    cards: 'grid gap-6',         // Card grid spacing
    metrics: 'grid gap-4 sm:gap-6', // Metrics grid
    compact: 'grid gap-4',       // Compact grid
    loose: 'grid gap-8',         // Loose grid for breathing room
  },
  
  // Typography line heights for readability
  typography: {
    heading: 'leading-tight',     // Headings
    body: 'leading-relaxed',      // Body text
    caption: 'leading-normal',    // Captions and small text
  }
} as const;

/**
 * Professional color accents for different UI elements
 * Following the 60-30-10 color rule with healthcare-appropriate colors
 */
export const accentTheme = {
  primary: {
    background: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-800',
    hover: 'hover:bg-teal-100',
  },
  secondary: {
    background: 'bg-purple-50',
    border: 'border-purple-200', 
    text: 'text-purple-800',
    hover: 'hover:bg-purple-100',
  },
  success: {
    background: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800', 
    hover: 'hover:bg-green-100',
  },
  warning: {
    background: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    hover: 'hover:bg-orange-100',
  },
  neutral: {
    background: 'bg-neutral-50',
    border: 'border-neutral-200',
    text: 'text-neutral-800',
    hover: 'hover:bg-neutral-100',
  }
} as const;

export type SpacingTheme = typeof spacingTheme;
export type AccentTheme = typeof accentTheme;
