/**
 * Index file for shared animation utilities
 * Provides easy access to all animation variants and transitions
 */

export * from './variants';
export * from './transitions';

// Re-export for convenience
export {
  containerVariants,
  itemVariants,
  cardHoverVariants,
  buttonHoverVariants,
  fadeInVariants,
  slideInVariants,
  slideInFromRightVariants,
  staggerChildrenVariants,
  loadingSkeletonVariants,
  iconRotateVariants,
  iconPulseVariants,
  badgePulseVariants,
  listItemVariants,
  numberCounterVariants,
} from './variants';

export {
  springTransition,
  smoothTransition,
  snappyTransition,
  fadeTransition,
  quickFadeTransition,
  staggeredTransition,
  pageTransition,
  modalTransition,
  hoverTransition,
  pulseTransition,
  rotateTransition,
  bounceTransition,
  slideTransition,
  scaleTransition,
  accessibleTransition,
  createStaggeredTransition,
  createSpringTransition,
  createTimingTransition,
} from './transitions';