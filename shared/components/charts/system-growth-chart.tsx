"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { useMonthlyGrowth } from '@/features/super-admin/hooks/useAnalytics';

interface SystemGrowthChartProps {
  className?: string;
}

const GROWTH_COLORS = {
  hospitals: '#3B82F6',  // Blue
  doctors: '#10B981',    // Green
  patients: '#F59E0B'    // Orange
};

export function SystemGrowthChart({ className = "" }: SystemGrowthChartProps) {
  const { data: monthlyGrowth, isLoading, error } = useMonthlyGrowth();

  // The service now returns cumulative totals at each month-end,
  // so we use the data directly without re-accumulating.
  const chartData = React.useMemo(() => {
    if (!monthlyGrowth || monthlyGrowth.length === 0) return [];
    return monthlyGrowth.map(month => ({
      month: month.month,
      hospitals: month.hospitals,
      doctors: month.doctors,
      patients: month.patients,
    }));
  }, [monthlyGrowth]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm flex items-center gap-2">
                <span 
                  className="inline-block w-3 h-3 rounded"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}: {entry.value.toLocaleString()}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex justify-center gap-6 mt-4">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-1 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-gray-700 capitalize">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>System Growth Trends</CardTitle>
          <CardDescription>Monthly growth in hospitals, doctors, and patients</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-sm text-gray-500 text-center">
            Failed to load system growth trends data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, transform: 'translateZ(0)' }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="border border-gray-200 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-100/30 hover:bg-gradient-to-br hover:from-orange-50/10 hover:to-white transition-all duration-300 group">
        <CardHeader className="group-hover:bg-orange-50/20 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 group-hover:scale-110 transition-all">
              <TrendingUp className="h-5 w-5 text-orange-600 group-hover:text-orange-700 transition-colors" />
            </div>
            <div>
              <CardTitle className="group-hover:text-orange-800 transition-colors">System Growth Trends</CardTitle>
              <CardDescription className="group-hover:text-orange-700 transition-colors">Monthly growth in hospitals, doctors, and patients</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500 mt-4">Loading growth trends...</p>
            </div>
          ) : chartData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, transform: 'translateZ(0)' }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="h-96"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                  
                  {/* Optimized Lines - Removed slow animations */}
                  <Line
                    type="monotone"
                    dataKey="hospitals"
                    stroke={GROWTH_COLORS.hospitals}
                    strokeWidth={3}
                    dot={{ fill: GROWTH_COLORS.hospitals, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: GROWTH_COLORS.hospitals, strokeWidth: 2 }}
                    name="Hospitals"
                    animationDuration={300}
                  />
                  
                  <Line
                    type="monotone"
                    dataKey="doctors"
                    stroke={GROWTH_COLORS.doctors}
                    strokeWidth={3}
                    dot={{ fill: GROWTH_COLORS.doctors, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: GROWTH_COLORS.doctors, strokeWidth: 2 }}
                    name="Doctors"
                    animationDuration={300}
                  />
                  
                  <Line
                    type="monotone"
                    dataKey="patients"
                    stroke={GROWTH_COLORS.patients}
                    strokeWidth={3}
                    dot={{ fill: GROWTH_COLORS.patients, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: GROWTH_COLORS.patients, strokeWidth: 2 }}
                    name="Patients"
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-16"
            >
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No growth trends data available</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
