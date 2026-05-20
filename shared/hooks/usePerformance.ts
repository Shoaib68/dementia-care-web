import { useEffect } from 'react';

/**
 * Performance monitoring hook for tracking Core Web Vitals
 * and other performance metrics
 */
export const usePerformance = () => {
  useEffect(() => {
    // Only run performance monitoring in production and in the browser
    if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') {
      return;
    }

    // Track Core Web Vitals
    const trackWebVitals = async () => {
      try {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');

        // Cumulative Layout Shift
        getCLS((metric) => {
          // Log to console in development, send to analytics in production
          console.log('CLS:', metric);
          // You can send to analytics service here
        });

        // First Input Delay
        getFID((metric) => {
          console.log('FID:', metric);
          // You can send to analytics service here
        });

        // First Contentful Paint
        getFCP((metric) => {
          console.log('FCP:', metric);
          // You can send to analytics service here
        });

        // Largest Contentful Paint
        getLCP((metric) => {
          console.log('LCP:', metric);
          // You can send to analytics service here
        });

        // Time to First Byte
        getTTFB((metric) => {
          console.log('TTFB:', metric);
          // You can send to analytics service here
        });
      } catch (error) {
        console.warn('Web Vitals not available:', error);
      }
    };

    // Track page load performance
    const trackPageLoad = () => {
      if ('performance' in window) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            
            if (navigation) {
              const metrics = {
                // Page load metrics
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                // Network metrics
                dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
                tcpConnect: navigation.connectEnd - navigation.connectStart,
                serverResponse: navigation.responseEnd - navigation.requestStart,
                // Total time
                totalTime: navigation.loadEventEnd - navigation.navigationStart,
              };

              console.log('Page Load Metrics:', metrics);
              // You can send to analytics service here
            }
          }, 0);
        });
      }
    };

    // Track React render performance
    const trackReactPerformance = () => {
      if ('performance' in window && 'measure' in performance) {
        // Track component render times
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name.includes('React')) {
              console.log('React Performance:', entry.name, entry.duration);
              // You can send to analytics service here
            }
          }
        });

        observer.observe({ entryTypes: ['measure'] });

        return () => observer.disconnect();
      }
    };

    // Initialize tracking
    trackWebVitals();
    trackPageLoad();
    const cleanup = trackReactPerformance();

    return cleanup;
  }, []);
};

/**
 * Hook to track component render performance
 */
export const useComponentPerformance = (componentName: string) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (renderTime > 16) { // Flag slow renders (> 16ms)
          console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      };
    }
  });
};

/**
 * Hook to measure and optimize expensive operations
 */
export const useMeasurePerformance = () => {
  const measureOperation = (name: string, operation: () => void) => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      operation();
      const endTime = performance.now();
      console.log(`${name} took ${(endTime - startTime).toFixed(2)} milliseconds`);
    } else {
      operation();
    }
  };

  return { measureOperation };
};
