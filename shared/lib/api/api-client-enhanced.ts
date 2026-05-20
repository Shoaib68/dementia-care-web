/**
 * Enhanced API Client with Request Deduplication and Compression
 * 
 * @module api-client-enhanced
 * @description Advanced API utilities with automatic request deduplication, compression, and batch operations
 * 
 * Features:
 * - Request deduplication to prevent duplicate API calls
 * - Automatic gzip compression for large payloads
 * - Batch request handling
 * - Data prefetching capabilities
 * - Smart caching with automatic cleanup
 */

import { api, ApiResponse, ApiError } from './api-client';

/**
 * Request Deduplication Manager
 * Prevents duplicate simultaneous requests to the same endpoint
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  private requestTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly MAX_CACHE_TIME = 5000; // 5 seconds

  /**
   * Create a unique key for the request
   */
  private createKey(method: string, url: string, body?: any): string {
    const bodyHash = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyHash}`;
  }

  /**
   * Execute a request with deduplication
   */
  async execute<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    
    // Clean up expired requests
    this.cleanup(now);
    
    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Execute the request
    const promise = requestFn().finally(() => {
      // Remove from pending requests when completed
      this.pendingRequests.delete(key);
    });

    // Store the pending request
    this.pendingRequests.set(key, promise);

    return promise;
  }

  /**
   * Clean up expired pending requests
   */
  private cleanup(now: number) {
    for (const [key, timeout] of this.requestTimeouts.entries()) {
      clearTimeout(timeout);
      this.requestTimeouts.delete(key);
    }
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear();
    this.requestTimeouts.forEach(timeout => clearTimeout(timeout));
    this.requestTimeouts.clear();
  }
}

/**
 * Enhanced API Service with deduplication and compression
 */
class EnhancedApiService {
  private requestDeduplicator = new RequestDeduplicator();
  private requestCache = new Map<string, Promise<any>>();
  private requestTimeouts = new Map<string, NodeJS.Timeout>();
  private compressionSupported = false;

  constructor() {
    // Check if compression is supported
    if (typeof window !== 'undefined' && 'CompressionStream' in window) {
      this.compressionSupported = true;
    }
  }

  /**
   * Generate cache key for request deduplication
   */
  private getCacheKey(endpoint: string, method: string, body?: any): string {
    const bodyStr = body ? JSON.stringify(body) : '';
    return `${method}:${endpoint}:${bodyStr}`;
  }

  /**
   * Clear cache entry after specified timeout
   */
  private setCacheTimeout(cacheKey: string, timeout: number = 100) {
    if (this.requestTimeouts.has(cacheKey)) {
      clearTimeout(this.requestTimeouts.get(cacheKey)!);
    }

    const timeoutId = setTimeout(() => {
      this.requestCache.delete(cacheKey);
      this.requestTimeouts.delete(cacheKey);
    }, timeout);

    this.requestTimeouts.set(cacheKey, timeoutId);
  }

  /**
   * Compress request body if supported
   */
  private async compressBody(body: string): Promise<ArrayBuffer | string> {
    if (!this.compressionSupported || body.length < 1024) {
      return body;
    }

    try {
      const stream = new (window as any).CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new TextEncoder().encode(body));
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }

      return compressed.buffer;
    } catch (error) {
      console.warn('Compression failed, sending uncompressed:', error);
      return body;
    }
  }

  /**
   * Enhanced GET request with deduplication
   */
  async get<T = any>(
    endpoint: string, 
    config?: RequestInit & { deduplicate?: boolean; cacheTimeout?: number }
  ): Promise<ApiResponse<T>> {
    const { deduplicate = true, cacheTimeout = 100, ...requestConfig } = config || {};
    const cacheKey = this.getCacheKey(endpoint, 'GET');

    // Check if request is already in progress
    if (deduplicate && this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)!;
    }

    // Make the request
    const requestPromise = api.get<T>(endpoint, requestConfig);

    // Cache the promise if deduplication is enabled
    if (deduplicate) {
      this.requestCache.set(cacheKey, requestPromise);
      this.setCacheTimeout(cacheKey, cacheTimeout);
    }

    return requestPromise;
  }

  /**
   * Enhanced POST request with compression and deduplication
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestInit & { 
      deduplicate?: boolean; 
      cacheTimeout?: number; 
      compress?: boolean;
    }
  ): Promise<ApiResponse<T>> {
    const { 
      deduplicate = false, 
      cacheTimeout = 100, 
      compress = true,
      ...requestConfig 
    } = config || {};
    
    const cacheKey = this.getCacheKey(endpoint, 'POST', data);

    // Check if request is already in progress
    if (deduplicate && this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)!;
    }

    // Compress body if enabled and data exists
    let headers = { ...requestConfig.headers };

    if (compress && data && this.compressionSupported) {
      try {
        const body = JSON.stringify(data);
        const compressedBody = await this.compressBody(body);
        if (compressedBody instanceof ArrayBuffer) {
          headers['Content-Encoding'] = 'gzip';
          headers['Content-Type'] = 'application/octet-stream';
        }
      } catch (error) {
        console.warn('Compression failed:', error);
      }
    }

    // Make the request
    const requestPromise = api.post<T>(endpoint, data, {
      ...requestConfig,
      headers,
    });

    // Cache the promise if deduplication is enabled
    if (deduplicate) {
      this.requestCache.set(cacheKey, requestPromise);
      this.setCacheTimeout(cacheKey, cacheTimeout);
    }

    return requestPromise;
  }

  /**
   * Enhanced PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestInit & { compress?: boolean }
  ): Promise<ApiResponse<T>> {
    const { compress = true, ...requestConfig } = config || {};
    
    let headers = { ...requestConfig.headers };

    if (compress && data && this.compressionSupported) {
      try {
        const body = JSON.stringify(data);
        const compressedBody = await this.compressBody(body);
        if (compressedBody instanceof ArrayBuffer) {
          headers['Content-Encoding'] = 'gzip';
          headers['Content-Type'] = 'application/octet-stream';
        }
      } catch (error) {
        console.warn('Compression failed:', error);
      }
    }

    return api.put<T>(endpoint, data, {
      ...requestConfig,
      headers,
    });
  }

  /**
   * Enhanced DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    config?: RequestInit & { deduplicate?: boolean }
  ): Promise<ApiResponse<T>> {
    const { deduplicate = false, ...requestConfig } = config || {};
    const cacheKey = this.getCacheKey(endpoint, 'DELETE');

    // Check if request is already in progress
    if (deduplicate && this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)!;
    }

    const requestPromise = api.delete<T>(endpoint, requestConfig);

    if (deduplicate) {
      this.requestCache.set(cacheKey, requestPromise);
      this.setCacheTimeout(cacheKey, 50); // Shorter timeout for DELETE
    }

    return requestPromise;
  }

  /**
   * Batch multiple requests
   */
  async batch<T = any>(
    requests: Array<{
      endpoint: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: any;
      config?: RequestInit;
    }>
  ): Promise<Array<ApiResponse<T> | ApiError>> {
    const promises = requests.map(({ endpoint, method, data, config }) => {
      switch (method) {
        case 'GET':
          return this.get<T>(endpoint, config);
        case 'POST':
          return this.post<T>(endpoint, data, config);
        case 'PUT':
          return this.put<T>(endpoint, data, config);
        case 'DELETE':
          return this.delete<T>(endpoint, config);
        default:
          return Promise.reject(new ApiError('Invalid method', 400));
      }
    });

    return Promise.allSettled(promises).then(results =>
      results.map(result =>
        result.status === 'fulfilled' ? result.value : result.reason
      )
    );
  }

  /**
   * Prefetch data for better perceived performance
   */
  async prefetch<T = any>(
    endpoint: string,
    config?: RequestInit
  ): Promise<void> {
    try {
      await this.get<T>(endpoint, {
        ...config,
        deduplicate: true,
        cacheTimeout: 5000, // Cache prefetched data longer
      });
    } catch (error) {
      // Silently fail prefetch errors
      console.warn('Prefetch failed:', error);
    }
  }

  /**
   * Clear request cache
   */
  clearCache(): void {
    this.requestCache.clear();
    this.requestTimeouts.forEach(timeout => clearTimeout(timeout));
    this.requestTimeouts.clear();
    this.requestDeduplicator.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    timeouts: number;
  } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys()),
      timeouts: this.requestTimeouts.size,
    };
  }
}

// Create singleton instance
export const enhancedApi = new EnhancedApiService();

/**
 * Background data prefetching for improved performance
 */
export class DataPrefetcher {
  private prefetchQueue = new Set<string>();
  private isRunning = false;

  /**
   * Add endpoint to prefetch queue
   */
  queue(endpoint: string, priority: 'high' | 'low' = 'low'): void {
    if (priority === 'high') {
      // High priority: prefetch immediately
      enhancedApi.prefetch(endpoint);
    } else {
      // Low priority: add to queue
      this.prefetchQueue.add(endpoint);
      this.processPrefetchQueue();
    }
  }

  /**
   * Process prefetch queue with throttling
   */
  private async processPrefetchQueue(): Promise<void> {
    if (this.isRunning || this.prefetchQueue.size === 0) {
      return;
    }

    this.isRunning = true;

    try {
      const endpoints = Array.from(this.prefetchQueue);
      this.prefetchQueue.clear();

      // Process in batches to avoid overwhelming the server
      const batchSize = 3;
      for (let i = 0; i < endpoints.length; i += batchSize) {
        const batch = endpoints.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(endpoint => 
            enhancedApi.prefetch(endpoint).catch(() => {
              // Ignore prefetch errors
            })
          )
        );

        // Small delay between batches
        if (i + batchSize < endpoints.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Clear prefetch queue
   */
  clear(): void {
    this.prefetchQueue.clear();
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    size: number;
    isRunning: boolean;
    endpoints: string[];
  } {
    return {
      size: this.prefetchQueue.size,
      isRunning: this.isRunning,
      endpoints: Array.from(this.prefetchQueue),
    };
  }
}

export const dataPrefetcher = new DataPrefetcher();

/**
 * Higher-order function to add deduplication to any async function
 */
export function withDeduplication<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const deduplicator = new RequestDeduplicator();
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    return deduplicator.execute(key, () => fn(...args));
  }) as T;
}

// Export enhanced API methods as default
export default enhancedApi;
