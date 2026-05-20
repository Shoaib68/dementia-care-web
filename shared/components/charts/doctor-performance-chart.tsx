"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { AlertCircle, UserCheck } from 'lucide-react';
import { useHospitalAnalytics } from '@/features/hospital/hooks/useHospitalAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface DoctorPerformanceChartProps {
  className?: string;
}

export function DoctorPerformanceChart({ className = "" }: DoctorPerformanceChartProps) {
  const { user } = useAuth();
  const { data: analyticsData, isLoading, error } = useHospitalAnalytics(user?.id);

  // Transform data for the chart.
  // Use "Dr. <LastName>" as the X-axis label so doctors with the same first name
  // (e.g. "Dr. Muhammad shahid" vs "Dr. Muhammad Shoaib") appear as distinct bars.
  const chartData = React.useMemo(() => {
    if (!analyticsData?.topDoctors) return [];

    return analyticsData.topDoctors.map(doctor => {
      // doctor.name is already "Dr. First Last" – extract the last word as the surname
      const nameParts = doctor.name.trim().split(' ');
      const lastName  = nameParts[nameParts.length - 1];
      // Keep the "Dr." prefix for readability
      const xLabel = `Dr. ${lastName}`;

      return {
        name: xLabel,
        fullName: doctor.name,
        patients: doctor.patients,
        diagnoses: doctor.diagnoses,
        specialization: doctor.specialization,
        department: doctor.department,
      };
    });
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
              <span className="inline-block w-3 h-3 bg-blue-500 rounded mr-2"></span>
              Patients: {data.patients}
            </p>
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>
              Diagnoses: {data.diagnoses}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Doctor Performance</CardTitle>
          <CardDescription>Patient count and diagnoses by doctor</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-sm text-gray-500 text-center">
            Failed to load doctor performance data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={className}
    >
      <Card className="border border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/30 hover:bg-gradient-to-br hover:from-blue-50/10 hover:to-white transition-all duration-300 group">
        <CardHeader className="group-hover:bg-blue-50/20 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 group-hover:scale-110 transition-all">
              <UserCheck className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
            </div>
            <div>
              <CardTitle className="group-hover:text-blue-800 transition-colors">Doctor Performance</CardTitle>
              <CardDescription className="group-hover:text-blue-700 transition-colors">Patient count and diagnoses by doctor</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500 mt-4">Loading doctor performance...</p>
            </div>
          ) : chartData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  >
                    <Bar 
                      dataKey="patients" 
                      name="Patients"
                      fill="#3B82F6"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="diagnoses" 
                      name="Diagnoses"
                      fill="#10B981"
                      radius={[2, 2, 0, 0]}
                    />
                  </motion.g>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-16"
            >
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No doctor performance data available</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}