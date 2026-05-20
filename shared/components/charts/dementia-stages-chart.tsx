"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { usePatientsByStage } from '@/features/super-admin/hooks/useAnalytics';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Brain, Users } from 'lucide-react';

const COLORS = {
  mild: '#10B981',     // Green for mild
  moderate: '#F59E0B', // Orange for moderate
  severe: '#EF4444',   // Red for severe
};

const STAGE_LABELS = {
  mild: 'Mild Dementia',
  moderate: 'Moderate Dementia', 
  severe: 'Severe Dementia',
};

export function DementiaStagesChart() {
  const { data: patientsByStage, isLoading, error } = usePatientsByStage();

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Failed to load dementia stages data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = React.useMemo(() => {
    if (!patientsByStage) return [];
    
    return [
      { name: STAGE_LABELS.mild, value: patientsByStage.mild, key: 'mild' },
      { name: STAGE_LABELS.moderate, value: patientsByStage.moderate, key: 'moderate' },
      { name: STAGE_LABELS.severe, value: patientsByStage.severe, key: 'severe' },
    ].filter(item => item.value > 0);
  }, [patientsByStage]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.payload.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} patients ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full border border-gray-200 hover:border-green-300 hover:shadow-xl hover:shadow-green-100/30 hover:bg-gradient-to-br hover:from-green-50/10 hover:to-white transition-all duration-300 group">
      <CardHeader className="group-hover:bg-green-50/20 transition-colors">
        <CardTitle className="flex items-center gap-2 group-hover:text-green-800 transition-colors">
          <div className="p-1 bg-green-100 rounded group-hover:bg-green-200 group-hover:scale-110 transition-all">
            <Brain className="h-5 w-5 text-green-600 group-hover:text-green-700 transition-colors" />
          </div>
          Dementia Stage Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : total === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No patient data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[entry.key as keyof typeof COLORS]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
            
            {/* Legend with statistics */}
            <div className="space-y-3">
              {chartData.map((item, index) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-100/50 hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[item.key as keyof typeof COLORS] }}
                    />
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{item.value}</div>
                    <div className="text-xs text-gray-500">
                      {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-gray-900">Total Patients</span>
                  <span className="text-gray-900">{total}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}