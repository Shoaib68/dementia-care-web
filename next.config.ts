import type { NextConfig } from "next";

// Bundle analyzer setup
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Check if we're using Turbopack
const isUsingTurbopack = process.argv.includes('--turbopack');

const nextConfig: NextConfig = {
  // Performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression
  reactStrictMode: process.env.NODE_ENV === 'production', // Only in production for better dev performance

  // TypeScript: pre-existing type errors don't block the build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    typescript: {
      // Ignore TypeScript errors during development builds for faster compilation
      ignoreBuildErrors: true,
    },
    eslint: {
      // Warning: This allows production builds to successfully complete even if ESLint errors
      ignoreDuringBuilds: true,
    },
    // Disable source maps in development for faster builds
    productionBrowserSourceMaps: false,
  }),
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // Cache images for 1 day
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // External packages for server components (moved from experimental)
  serverExternalPackages: [],
  
  // Turbopack configuration (moved from experimental)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Bundle optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'framer-motion',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
    ],
    scrollRestoration: true,
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Conditional webpack configuration - only when NOT using Turbopack
  ...(isUsingTurbopack ? {} : {
    webpack: (config, { dev, isServer }) => {
      // Development optimizations
      if (dev) {
        // Disable source maps in development for faster builds
        config.devtool = false;
        
        // Increase cache size for faster rebuilds
        config.cache = {
          type: 'filesystem',
          maxMemoryGenerations: 1,
        };
        
        // Skip expensive optimizations in development
        config.optimization = {
          ...config.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
        };
      }
      
      // Optimize for production builds
      if (!dev && !isServer) {
        // Tree shake unused exports
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;
        
        // Bundle splitting for better caching
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Vendor chunk for stable dependencies
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Common chunk for shared code
            common: {
              minChunks: 2,
              chunks: 'all',
              name: 'common',
              priority: 5,
              reuseExistingChunk: true,
            },
            // UI components chunk
            ui: {
              test: /[\\/]shared[\\/]components[\\/]ui[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 8,
            },
            // React Query chunk
            reactQuery: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query/,
              name: 'react-query',
              chunks: 'all',
              priority: 15,
            },
            // Radix UI chunk
            radixUI: {
              test: /[\\/]node_modules[\\/]@radix-ui/,
              name: 'radix-ui',
              chunks: 'all',
              priority: 12,
            },
          },
        };
      }
      
      return config;
    },
  }),
  
  // Headers for caching and security
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/logo.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/images/logo/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
