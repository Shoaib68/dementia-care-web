"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { 
  containerVariants, 
  itemVariants 
} from '@/shared/animations';

interface EnhancedErrorBoundaryProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export const EnhancedErrorBoundary: React.FC<EnhancedErrorBoundaryProps> = ({
  title = "Unable to Load Content",
  description = "There was an error loading the data. Please check your connection and try again.",
  onRetry,
  showRetryButton = true,
}) => {
  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <Card className="border border-red-200 bg-red-50 hover:shadow-lg transition-all duration-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
            >
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-4 text-center max-w-md">
              {description}
            </p>
            {showRetryButton && onRetry && (
              <motion.button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </motion.button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};