"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { AlertCircle, Building2 } from 'lucide-react';
import { useTopHospitals } from '@/features/super-admin/hooks/useAnalytics';

interface HospitalPerformanceChartProps {
  className?: string;
}

export function HospitalPerformanceChart({ className = "" }: HospitalPerformanceChartProps) {
  const { data: hospitalData, isLoading, error } = useTopHospitals();

  // Transform data for the chart - truncate long hospital names
  const chartData = hospitalData?.map(hospital => ({
    name: hospital.name.length > 15 ? `${hospital.name.substring(0, 12)}...` : hospital.name,
    fullName: hospital.name,
    doctors: hospital.doctors,
    patients: hospital.patients,
    diagnoses: hospital.diagnoses,
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.fullName}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded mr-2"></span>
              Doctors: {data.doctors}
            </p>
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>
              Patients: {data.patients}
            </p>
            <p className="text-sm text-gray-500">
              Total Diagnoses: {data.diagnoses}
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
          <CardTitle>Hospital Performance</CardTitle>
          <CardDescription>Doctors and patients by hospital</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-sm text-gray-500 text-center">
            Failed to load hospital performance data
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
              <Building2 className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
            </div>
            <div>
              <CardTitle className="group-hover:text-blue-800 transition-colors">Hospital Performance</CardTitle>
              <CardDescription className="group-hover:text-blue-700 transition-colors">Doctors and patients by hospital</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500 mt-4">Loading hospital performance...</p>
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
                      dataKey="doctors" 
                      name="Doctors"
                      fill="#3B82F6"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="patients" 
                      name="Patients"
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
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No hospital performance data available</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
