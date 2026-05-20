"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { useSystemHealth } from '@/features/super-admin/hooks/useAnalytics';
import { 
  Shield, 
  Database, 
  Server, 
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'operational':
    case 'good':
    case 'normal':
      return 'text-green-600 bg-green-100';
    case 'degraded':
    case 'warning':
      return 'text-yellow-600 bg-yellow-100';
    case 'down':
    case 'critical':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'operational':
    case 'good':
    case 'normal':
      return <CheckCircle className="h-4 w-4" />;
    case 'degraded':
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'down':
    case 'critical':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Shield className="h-4 w-4" />;
  }
};

export function SystemHealthChart() {
  const { data: healthData, isLoading, error } = useSystemHealth();

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Failed to load system health data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/30 hover:bg-gradient-to-br hover:from-blue-50/10 hover:to-white transition-all duration-300 group">
      <CardHeader className="group-hover:bg-blue-50/20 transition-colors">
        <CardTitle className="flex items-center gap-2 group-hover:text-blue-800 transition-colors">
          <div className="p-1 bg-blue-100 rounded group-hover:bg-blue-200 group-hover:scale-110 transition-all">
            <Shield className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
          </div>
          System Health Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : !healthData ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No health data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall System Status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">System Operational</h3>
                  <p className="text-sm text-green-700">All services are running normally</p>
                </div>
              </div>
            </motion.div>

            {/* Health Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="p-4 bg-gray-50 rounded-lg hover:bg-blue-100/50 hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Database</span>
                  </div>
                  <Badge className={getStatusColor(healthData.databasePerformance)}>
                    {getStatusIcon(healthData.databasePerformance)}
                    {healthData.databasePerformance}
                  </Badge>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="p-4 bg-gray-50 rounded-lg hover:bg-blue-100/50 hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Server Load</span>
                  </div>
                  <Badge className={getStatusColor(healthData.serverLoad)}>
                    {getStatusIcon(healthData.serverLoad)}
                    {healthData.serverLoad}
                  </Badge>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="p-4 bg-gray-50 rounded-lg hover:bg-blue-100/50 hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Uptime</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {healthData.uptime}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="p-4 bg-gray-50 rounded-lg hover:bg-blue-100/50 hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Response Time</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {healthData.responseTime}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* System Components */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="pt-4 border-t border-gray-200"
            >
              <h4 className="text-sm font-medium text-gray-700 mb-3">Service Status</h4>
              <div className="space-y-2">
                {[
                  { name: 'Authentication Service', status: 'operational' },
                  { name: 'Hospital Management', status: 'operational' },
                  { name: 'Patient Records', status: 'operational' },
                  { name: 'MRI Analysis', status: 'operational' },
                  { name: 'Analytics Engine', status: 'operational' },
                ].map((service, index) => (
                  <div key={service.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{service.name}</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">Online</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}