"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { ChartSkeleton } from '@/shared/components/ui/chart-skeleton';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { useHospitalAnalytics } from '@/features/hospital/hooks/useHospitalAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface HospitalActivityChartProps {
  className?: string;
}

const ACTIVITY_COLORS = {
  patients: '#3B82F6',   // Blue
  diagnoses: '#10B981',  // Green
  // reports omitted — feature not yet implemented
};

export function HospitalActivityChart({ className = "" }: HospitalActivityChartProps) {
  const { user } = useAuth();
  const { data: analyticsData, isLoading, error } = useHospitalAnalytics(user?.id);

  // Use real historical activity data from the analytics service
  const chartData = React.useMemo(() => {
    if (!analyticsData?.activityTrends) return [];
    
    // Use the activity trends data directly from the analytics service
    return analyticsData.activityTrends.map(trend => ({
      month: trend.month,
      patients: trend.patients,
      diagnoses: trend.diagnoses,
      reports: trend.reports,
      year: trend.year
    }));
  }, [analyticsData?.activityTrends]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label} {payload[0]?.payload?.year || new Date().getFullYear()}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
                {entry.name === 'patients' ? 'New Patients' : 'MRI Diagnoses'}: {entry.value.toLocaleString()}
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
          <div className="w-3 h-1 rounded" style={{ backgroundColor: entry.color }} />
          <span className="text-sm font-medium text-gray-700">
            {entry.value === 'patients' ? 'New Patients' : 'MRI Diagnoses'}
          </span>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Hospital Activity Trends</CardTitle>
          <CardDescription>Monthly trends in patients, diagnoses, and reports</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-sm text-gray-500 text-center">
            Failed to load hospital activity trends data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className={className}
    >
      <Card className="border border-gray-200 hover:border-green-300 hover:shadow-xl hover:shadow-green-100/30 hover:bg-gradient-to-br hover:from-green-50/10 hover:to-white transition-all duration-300 group">
        <CardHeader className="group-hover:bg-green-50/20 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 group-hover:scale-110 transition-all">
              <TrendingUp className="h-5 w-5 text-green-600 group-hover:text-green-700 transition-colors" />
            </div>
            <div>
            <CardTitle className="group-hover:text-green-800 transition-colors">Hospital Activity Trends</CardTitle>
              <CardDescription className="group-hover:text-green-700 transition-colors">Monthly new patients and MRI diagnoses</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>
              <ChartSkeleton type="area" showHeader={false} className="border-0" />
              <div className="sr-only">Loading activity trends...</div>
            </div>
          ) : chartData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="h-96"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <defs>
                    <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACTIVITY_COLORS.patients} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={ACTIVITY_COLORS.patients} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDiagnoses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACTIVITY_COLORS.diagnoses} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={ACTIVITY_COLORS.diagnoses} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
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
                  
                  {/* Animated Areas and Lines */}
                  <motion.g
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 0.7, ease: "easeInOut" }}
                  >
                    <Area
                      type="monotone"
                      dataKey="patients"
                      stroke={ACTIVITY_COLORS.patients}
                      strokeWidth={3}
                      fill="url(#colorPatients)"
                      fillOpacity={0.6}
                      dot={{ fill: ACTIVITY_COLORS.patients, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: ACTIVITY_COLORS.patients, strokeWidth: 2 }}
                      name="patients"
                    />
                  </motion.g>
                  
                  <motion.g
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 0.9, ease: "easeInOut" }}
                  >
                    <Area
                      type="monotone"
                      dataKey="diagnoses"
                      stroke={ACTIVITY_COLORS.diagnoses}
                      strokeWidth={3}
                      fill="url(#colorDiagnoses)"
                      fillOpacity={0.6}
                      dot={{ fill: ACTIVITY_COLORS.diagnoses, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: ACTIVITY_COLORS.diagnoses, strokeWidth: 2 }}
                      name="diagnoses"
                    />
                  </motion.g>
                  
                </AreaChart>
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
              <p className="text-sm text-gray-500">No activity trends data available</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}