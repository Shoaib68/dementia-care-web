"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { AlertCircle, Building } from 'lucide-react';
import { useHospitalAnalytics } from '@/features/hospital/hooks/useHospitalAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface DepartmentDistributionChartProps {
  className?: string;
}

// Color palette for different departments
const DEPARTMENT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange-red
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export function DepartmentDistributionChart({ className = "" }: DepartmentDistributionChartProps) {
  const { user } = useAuth();
  const { data: analyticsData, isLoading, error } = useHospitalAnalytics(user?.id);

  // Transform data for the chart
  const chartData = React.useMemo(() => {
    if (!analyticsData?.departmentStats) return [];
    
    const totalPatients = analyticsData.departmentStats.reduce((sum, dept) => sum + dept.patients, 0);
    
    if (totalPatients === 0) return [];
    
    return analyticsData.departmentStats
      .filter(dept => dept.patients > 0)
      .map((dept, index) => ({
        name: dept.name,
        value: dept.patients,
        doctors: dept.doctors,
        diagnoses: dept.diagnoses,
        percentage: ((dept.patients / totalPatients) * 100).toFixed(1),
        fill: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value); // Sort by patient count descending
  }, [analyticsData?.departmentStats]);

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
          <p className="font-medium text-gray-900 mb-1">{data.name} Department</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Patients: {data.value.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              Doctors: {data.doctors}
            </p>
            <p className="text-sm text-gray-600">
              Diagnoses: {data.diagnoses}
            </p>
            <p className="text-sm text-gray-600">
              Percentage: {data.percentage}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-3 mt-4 max-h-20 overflow-y-auto">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-medium text-gray-700">
            {entry.value} ({entry.payload.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Department Distribution</CardTitle>
          <CardDescription>Patients by hospital department</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-sm text-gray-500 text-center">
            Failed to load department distribution data
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
              <Building className="h-5 w-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
            </div>
            <div>
              <CardTitle className="group-hover:text-purple-800 transition-colors">Department Distribution</CardTitle>
              <CardDescription className="group-hover:text-purple-700 transition-colors">Patients by hospital department</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500 mt-4">Loading department distribution...</p>
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
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No department distribution data available</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}