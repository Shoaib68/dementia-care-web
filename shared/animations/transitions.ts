/**
 * Common transition configurations for Framer Motion animations
 * Provides consistent timing and easing functions across the application
 */

export const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 15,
};

export const smoothTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 24,
};

export const snappyTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 10,
};

export const fadeTransition = {
  duration: 0.3,
  ease: "easeOut" as const,
};

export const quickFadeTransition = {
  duration: 0.2,
  ease: "easeOut" as const,
};

export const staggeredTransition = {
  staggerChildren: 0.1,
  delayChildren: 0.2,
};

export const pageTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
};

export const modalTransition = {
  type: "spring" as const,
  damping: 25,
  stiffness: 120,
};

export const hoverTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 10,
  duration: 0.2,
};

export const pulseTransition = {
  duration: 2,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

export const rotateTransition = {
  duration: 0.3,
  ease: "easeOut" as const,
};

export const bounceTransition = {
  type: "spring" as const,
  damping: 10,
  stiffness: 400,
  restDelta: 0.001,
};

export const slideTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const scaleTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 15,
};

/**
 * Prefers reduced motion transition for accessibility
 */
export const accessibleTransition = {
  duration: 0.01, // Nearly instant for users who prefer reduced motion
};

/**
 * Creates a staggered transition with custom delay
 */
export const createStaggeredTransition = (stagger: number, delay: number = 0) => ({
  staggerChildren: stagger,
  delayChildren: delay,
});

/**
 * Creates a custom spring transition with specified properties
 */
export const createSpringTransition = (
  stiffness: number = 100,
  damping: number = 15,
  mass: number = 1
) => ({
  type: "spring" as const,
  stiffness,
  damping,
  mass,
});

/**
 * Creates a duration-based transition with easing
 */
export const createTimingTransition = (
  duration: number,
  ease: string = "easeOut"
) => ({
  duration,
  ease,
});