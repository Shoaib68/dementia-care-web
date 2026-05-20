"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { AlertCircle, Users } from 'lucide-react';
import { usePatientsByStage } from '@/features/super-admin/hooks/useAnalytics';

interface PatientDistributionChartProps {
  className?: string;
}

const COLORS = {
  mild: '#10B981',     // Green
  moderate: '#F59E0B', // Orange/Yellow
  severe: '#EF4444'    // Red
};

export function PatientDistributionChart({ className = "" }: PatientDistributionChartProps) {
  const { data: patientsByStage, isLoading, error } = usePatientsByStage();

  // Transform data for the chart
  const chartData = React.useMemo(() => {
    if (!patientsByStage) return [];
    
    const total = patientsByStage.mild + patientsByStage.moderate + patientsByStage.severe;
    
    if (total === 0) return [];
    
    return [
      {
        name: 'Mild',
        value: patientsByStage.mild,
        percentage: ((patientsByStage.mild / total) * 100).toFixed(1),
        fill: COLORS.mild
      },
      {
        name: 'Moderate',
        value: patientsByStage.moderate,
        percentage: ((patientsByStage.moderate / total) * 100).toFixed(1),
        fill: COLORS.moderate
      },
      {
        name: 'Severe',
        value: patientsByStage.severe,
        percentage: ((patientsByStage.severe / total) * 100).toFixed(1),
        fill: COLORS.severe
      }
    ].filter(item => item.value > 0);
  }, [patientsByStage]);

  // Custom label function to show percentages
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${percentage}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{data.name} Stage</p>
          <p className="text-sm text-gray-600">
            Patients: {data.value.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Percentage: {data.percentage}%
          </p>
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
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-gray-700">
            {entry.value} {entry.payload.percentage}%
          </span>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Patient Distribution</CardTitle>
          <CardDescription>Patients by dementia stage</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-sm text-gray-500 text-center">
            Failed to load patient distribution data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={className}
    >
      <Card className="border border-gray-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/30 hover:bg-gradient-to-br hover:from-purple-50/10 hover:to-white transition-all duration-300 group">
        <CardHeader className="group-hover:bg-purple-50/20 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 group-hover:scale-110 transition-all">
              <Users className="h-5 w-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
            </div>
            <div>
              <CardTitle className="group-hover:text-purple-800 transition-colors">Patient Distribution</CardTitle>
              <CardDescription className="group-hover:text-purple-700 transition-colors">Patients by dementia stage</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500 mt-4">Loading patient distribution...</p>
            </div>
          ) : chartData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-16"
            >
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No patient distribution data available</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
