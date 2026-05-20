"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { ChartSkeleton } from '@/shared/components/ui/chart-skeleton';
import { AlertCircle, Award } from 'lucide-react';
import { useHospitalAnalytics } from '@/features/hospital/hooks/useHospitalAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface TopDoctorsChartProps {
  className?: string;
}

export function TopDoctorsChart({ className = "" }: TopDoctorsChartProps) {
  const { user } = useAuth();
  const { data: analyticsData, isLoading, error } = useHospitalAnalytics(user?.id);

  // Transform data for horizontal bar chart
  const chartData = React.useMemo(() => {
    if (!analyticsData?.topDoctors) return [];
    
    const result = analyticsData.topDoctors
      .slice(0, 8) // Show top 8 doctors
      .map((doctor, index) => {
        // Calculate performance score (weighted combination of patients and diagnoses)
        // Add base score to make bars visible even with low numbers
        const baseScore = 5; // Minimum base score
        const patientScore = doctor.patients * 3; // Increase weight for patients
        const diagnosisScore = doctor.diagnoses * 2; // Weight for diagnoses
        const performanceScore = baseScore + patientScore + diagnosisScore;
        
        return {
          name: doctor.name.replace('Dr. ', ''), // Remove Dr. prefix to save space
          fullName: doctor.name,
          patients: doctor.patients,
          diagnoses: doctor.diagnoses,
          specialization: doctor.specialization,
          department: doctor.department,
          performance: Math.max(performanceScore, 5), // Ensure minimum of 5 for visibility
          color: index < 3 ? '#10B981' : index < 6 ? '#3B82F6' : '#6B7280', // Top 3 green, next 3 blue, rest gray
        };
      })
      .sort((a, b) => b.performance - a.performance); // Sort by performance descending
    
    return result;
  }, [analyticsData?.topDoctors]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.fullName}</p>
          <p className="text-sm text-gray-600 mb-2">{data.specialization} - {data.department}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium text-blue-600">Patients:</span> {data.patients}
            </p>
            <p className="text-sm">
              <span className="font-medium text-green-600">Diagnoses:</span> {data.diagnoses}
            </p>
            <p className="text-sm">
              <span className="font-medium text-purple-600">Performance Score:</span> {data.performance}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBar = ({ fill, ...props }: any) => {
    return (
      <motion.g
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ 
          duration: 0.8, 
          delay: props.index * 0.1, 
          ease: "easeOut"
        }}
      >
        <Bar 
          {...props}
          fill={fill}
          radius={[0, 4, 4, 0]}
        />
      </motion.g>
    );
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Top Performing Doctors</CardTitle>
          <CardDescription>Doctors ranked by performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-sm text-gray-500 text-center">
            Failed to load top doctors data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className={className}
    >
      <Card className="border border-gray-200 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-100/30 hover:bg-gradient-to-br hover:from-orange-50/10 hover:to-white transition-all duration-300 group">
        <CardHeader className="group-hover:bg-orange-50/20 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 group-hover:scale-110 transition-all">
              <Award className="h-5 w-5 text-orange-600 group-hover:text-orange-700 transition-colors" />
            </div>
            <div>
              <CardTitle className="group-hover:text-orange-800 transition-colors">Top Performing Doctors</CardTitle>
              <CardDescription className="group-hover:text-orange-700 transition-colors">Doctors ranked by performance metrics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>
              <ChartSkeleton type="bar" showHeader={false} className="border-0" />
              <div className="sr-only">Loading top doctors...</div>
            </div>
          ) : chartData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="h-96"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fontSize: 11, angle: -45, textAnchor: 'end' }}
                    stroke="#6b7280"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    domain={[0, 'dataMax + 2']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Bar
                    dataKey="performance"
                    radius={[4, 4, 0, 0]}
                    minPointSize={15}
                    barSize={50}
                    fill="#10B981"
                    stroke="#059669"
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Performance legend */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                className="flex justify-center gap-6 mt-4"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-xs text-gray-600">Top Performers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-xs text-gray-600">High Performers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded"></div>
                  <span className="text-xs text-gray-600">Standard</span>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-16"
            >
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No doctor performance data available</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}