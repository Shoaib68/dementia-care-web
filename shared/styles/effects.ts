/**
 * CSS classes for visual effects and styling patterns
 * Extracted from super admin portal for consistent styling across all portals
 */

// Background gradients
export const backgroundGradients = {
  // Main page backgrounds
  primaryBg: "bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20",
  secondaryBg: "bg-gradient-to-br from-slate-50/50 via-transparent to-blue-50/30",
  
  // Card backgrounds  
  cardBg: "bg-gradient-to-br from-white via-white to-blue-50/10",
  cardHoverBg: "hover:bg-gradient-to-br hover:from-blue-50/20 hover:to-white",
  
  // Accent gradients
  blueAccent: "bg-gradient-to-r from-blue-50 to-indigo-50",
  greenAccent: "bg-gradient-to-r from-green-50 to-emerald-50",
  orangeAccent: "bg-gradient-to-r from-orange-50 to-amber-50",
  purpleAccent: "bg-gradient-to-r from-purple-50 to-violet-50",
  
  // Enhanced card backgrounds
  blueCardBg: "hover:bg-gradient-to-br hover:from-blue-50/20 hover:to-white",
  orangeCardBg: "hover:bg-gradient-to-br hover:from-orange-50/20 hover:to-white",
  purpleCardBg: "hover:bg-gradient-to-br hover:from-purple-50/20 hover:to-white",
  greenCardBg: "hover:bg-gradient-to-br hover:from-green-50/20 hover:to-white",
} as const;

// Border and shadow effects
export const borderEffects = {
  // Default borders
  cardBorder: "border border-gray-200",
  
  // Hover borders
  cardHoverBorder: "hover:border-blue-300",
  orangeHoverBorder: "hover:border-orange-300",
  purpleHoverBorder: "hover:border-purple-300",
  greenHoverBorder: "hover:border-green-300",
  
  // Focus borders
  focusBorder: "focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
} as const;

// Shadow effects
export const shadowEffects = {
  // Card shadows
  cardShadow: "hover:shadow-xl",
  blueShadow: "hover:shadow-xl hover:shadow-blue-100/40",
  orangeShadow: "hover:shadow-xl hover:shadow-orange-100/40",
  purpleShadow: "hover:shadow-xl hover:shadow-purple-100/40",
  greenShadow: "hover:shadow-xl hover:shadow-green-100/40",
  
  // Button shadows
  buttonShadow: "hover:shadow-md",
  
  // Metric card shadows
  metricShadow: "hover:shadow-xl hover:shadow-blue-100/30",
} as const;

// Color combinations for consistent theming
export const colorSchemes = {
  blue: {
    bg: backgroundGradients.blueCardBg,
    border: borderEffects.cardHoverBorder,
    shadow: shadowEffects.blueShadow,
    icon: "text-blue-600 group-hover:text-blue-700",
    iconBg: "bg-blue-100 group-hover:bg-blue-200",
    accent: backgroundGradients.blueAccent,
  },
  orange: {
    bg: backgroundGradients.orangeCardBg,
    border: borderEffects.orangeHoverBorder,
    shadow: shadowEffects.orangeShadow,
    icon: "text-orange-600 group-hover:text-orange-700",
    iconBg: "bg-orange-100 group-hover:bg-orange-200",
    accent: backgroundGradients.orangeAccent,
  },
  purple: {
    bg: backgroundGradients.purpleCardBg,
    border: borderEffects.purpleHoverBorder,
    shadow: shadowEffects.purpleShadow,
    icon: "text-purple-600 group-hover:text-purple-700",
    iconBg: "bg-purple-100 group-hover:bg-purple-200",
    accent: backgroundGradients.purpleAccent,
  },
  green: {
    bg: backgroundGradients.greenCardBg,
    border: borderEffects.greenHoverBorder,
    shadow: shadowEffects.greenShadow,
    icon: "text-green-600 group-hover:text-green-700",
    iconBg: "bg-green-100 group-hover:bg-green-200",
    accent: backgroundGradients.greenAccent,
  },
} as const;

// Interactive element classes
export const interactiveElements = {
  // Buttons
  primaryButton: "hover:shadow-md hover:scale-105 transition-all duration-200 hover:border-blue-300 hover:text-blue-700",
  secondaryButton: "hover:bg-gray-50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200",
  
  // Cards
  interactiveCard: "cursor-pointer hover:shadow-md transition-all duration-300",
  metricCard: "border border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/30 hover:bg-gradient-to-br hover:from-blue-50/20 hover:to-white transition-all duration-300 group",
  
  // List items
  listItem: "hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 hover:shadow-sm cursor-pointer group",
  
  // Icons
  hoverIcon: "group-hover:scale-110 transition-all",
  pulseIcon: "group-hover:scale-150 group-hover:shadow-md transition-all",
} as const;

// Loading state classes
export const loadingStates = {
  skeleton: "animate-pulse",
  skeletonBase: "bg-gray-200 group-hover:bg-blue-200 rounded transition-colors",
  skeletonAccent: "bg-gray-300 group-hover:bg-blue-300 rounded transition-colors",
  shimmer: "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]",
} as const;

// Status indicator classes
export const statusIndicators = {
  // Dot indicators
  activeDot: "w-2 h-2 bg-blue-500 rounded-full group-hover:bg-blue-600 group-hover:scale-150 group-hover:shadow-md transition-all",
  inactiveDot: "w-2 h-2 bg-gray-300 rounded-full",
  
  // Badge styles
  activeBadge: "bg-blue-100 text-blue-800 border-blue-200",
  pendingBadge: "bg-orange-100 text-orange-800 border-orange-200",
  completedBadge: "bg-green-100 text-green-800 border-green-200",
  errorBadge: "bg-red-100 text-red-800 border-red-200",
  
  // Severity indicators
  mildBadge: "bg-green-100 text-green-800 border-green-200",
  moderateBadge: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  severeBadge: "bg-red-100 text-red-800 border-red-200",
} as const;

// Typography enhancements
export const typography = {
  // Headers
  pageTitle: "text-lg font-semibold text-gray-900 group-hover:text-blue-800 transition-colors",
  cardTitle: "text-lg font-semibold text-gray-900 group-hover:text-blue-800 transition-colors",
  cardDescription: "text-gray-600 group-hover:text-blue-700 transition-colors",
  
  // Body text
  bodyText: "text-sm text-gray-800 group-hover:text-blue-800 transition-colors",
  mutedText: "text-xs text-gray-500 group-hover:text-blue-600 transition-colors",
  
  // Metrics
  metricValue: "font-medium text-gray-800 group-hover:text-blue-800 transition-colors",
  metricLabel: "text-gray-600 group-hover:text-blue-700 transition-colors",
} as const;

// Background decorations
export const decorations = {
  // Animated background elements
  topRightBlur: "absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-100/20 to-transparent rounded-full blur-3xl animate-pulse",
  bottomLeftBlur: "absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-purple-100/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000",
  
  // Overlay effects
  subtleOverlay: "absolute inset-0 bg-gradient-to-br from-blue-500/[0.01] via-transparent to-purple-500/[0.01]",
} as const;