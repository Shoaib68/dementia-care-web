// Lightweight animation utilities for better performance
// Use these instead of heavy framer-motion animations where possible

export const fadeInClass = "transition-opacity duration-300 ease-in-out";
export const slideUpClass = "transition-transform duration-300 ease-in-out";
export const scaleHoverClass = "hover:scale-105 transition-transform duration-200";

// Simple CSS-based animations for better performance
export const lightAnimations = {
  fadeIn: "animate-fadeIn",
  slideUp: "animate-slideUp", 
  bounce: "animate-bounce",
  pulse: "animate-pulse",
  spin: "animate-spin"
};

// Basic variants for framer-motion (reduced complexity)
export const simpleVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  },
  
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  },
  
  cardHover: {
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  }
};