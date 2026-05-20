import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useComponentPerformance } from './usePerformance';

/**
 * Enhanced useMemo with performance tracking
 */
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList | undefined,
  debugName?: string
): T {
  const startTime = useRef<number>();
  
  return useMemo(() => {
    if (process.env.NODE_ENV === 'development' && debugName) {
      startTime.current = performance.now();
    }
    
    const result = factory();
    
    if (process.env.NODE_ENV === 'development' && debugName && startTime.current) {
      const duration = performance.now() - startTime.current;
      if (duration > 5) { // Log slow computations
        console.log(`Slow useMemo in ${debugName}: ${duration.toFixed(2)}ms`);
      }
    }
    
    return result;
  }, deps);
}

/**
 * Enhanced useCallback with performance tracking
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  debugName?: string
): T {
  return useCallback((...args) => {
    if (process.env.NODE_ENV === 'development' && debugName) {
      const startTime = performance.now();
      const result = callback(...args);
      const duration = performance.now() - startTime;
      
      if (duration > 1) { // Log slow callbacks
        console.log(`Slow callback in ${debugName}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    }
    
    return callback(...args);
  }, deps) as T;
}

/**
 * Debounce hook for performance optimization
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for performance optimization
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Hook to detect if component is in viewport (for lazy loading)
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
}

/**
 * Hook for measuring component render time
 */
export function useRenderTime(componentName: string) {
  const renderStart = useRef<number>();
  
  // Start timing
  renderStart.current = performance.now();
  
  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current;
      
      if (process.env.NODE_ENV === 'development') {
        if (renderTime > 16) { // Flag renders slower than 60fps
          console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      }
    }
  });
}

/**
 * Hook for preventing unnecessary re-renders
 */
export function useShallowCompare<T extends Record<string, any>>(obj: T): T {
  const cache = useRef<T>();
  
  return useMemo(() => {
    if (!cache.current) {
      cache.current = obj;
      return obj;
    }
    
    // Shallow comparison
    const keys1 = Object.keys(cache.current);
    const keys2 = Object.keys(obj);
    
    if (keys1.length !== keys2.length) {
      cache.current = obj;
      return obj;
    }
    
    for (let key of keys1) {
      if (cache.current[key] !== obj[key]) {
        cache.current = obj;
        return obj;
      }
    }
    
    return cache.current;
  }, [obj]);
}

/**
 * Hook for optimized event handlers
 */
export function useOptimizedEventHandler<T extends Event>(
  handler: (event: T) => void,
  throttleMs: number = 100
) {
  const throttledHandler = useRef<((event: T) => void) | null>(null);
  const lastCallTime = useRef<number>(0);
  
  return useCallback((event: T) => {
    const now = Date.now();
    
    if (now - lastCallTime.current >= throttleMs) {
      handler(event);
      lastCallTime.current = now;
    }
  }, [handler, throttleMs]);
}

/**
 * Hook for managing async operations with cleanup
 */
export function useAsyncOperation<T>() {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });
  
  const mountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const result = await asyncFn();
      
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState({ 
          data: null, 
          loading: false, 
          error: error instanceof Error ? error : new Error('Unknown error') 
        });
      }
    }
  }, []);
  
  return {
    ...state,
    execute,
  };
}

/**
 * Hook for batching state updates
 */
export function useBatchedUpdates<T>(initialState: T) {
  const [state, setState] = useState(initialState);
  const batchedUpdates = useRef<Partial<T>[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const batchUpdate = useCallback((update: Partial<T>) => {
    batchedUpdates.current.push(update);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const updates = batchedUpdates.current;
      batchedUpdates.current = [];
      
      if (updates.length > 0) {
        setState(prev => Object.assign({}, prev, ...updates));
      }
    }, 0);
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return [state, batchUpdate] as const;
}

/**
 * Hook for component memoization with custom comparison
 */
export function useCustomMemo<T>(
  factory: () => T,
  deps: React.DependencyList | undefined,
  isEqual: (prev: React.DependencyList | undefined, next: React.DependencyList | undefined) => boolean
): T {
  const cache = useRef<{ deps: React.DependencyList | undefined; value: T }>();
  
  if (!cache.current || !isEqual(cache.current.deps, deps)) {
    cache.current = {
      deps,
      value: factory(),
    };
  }
  
  return cache.current.value;
}
