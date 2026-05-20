"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { useTopHospitals } from '@/features/super-admin/hooks/useAnalytics';
import { 
  Building2, 
  Users, 
  UserCheck, 
  Activity,
  TrendingUp,
  Award
} from 'lucide-react';

export function TopHospitalsChart() {
  const { data: topHospitals, isLoading, error } = useTopHospitals();

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Failed to load top hospitals data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border border-gray-200 hover:border-yellow-300 hover:shadow-xl hover:shadow-yellow-100/30 hover:bg-gradient-to-br hover:from-yellow-50/10 hover:to-white transition-all duration-300 group">
      <CardHeader className="group-hover:bg-yellow-50/20 transition-colors">
        <CardTitle className="flex items-center gap-2 group-hover:text-yellow-800 transition-colors">
          <div className="p-1 bg-yellow-100 rounded group-hover:bg-yellow-200 group-hover:scale-110 transition-all">
            <Award className="h-5 w-5 text-yellow-600 group-hover:text-yellow-700 transition-colors" />
          </div>
          Top Performing Hospitals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : topHospitals.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No hospital data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topHospitals.slice(0, 5).map((hospital, index) => (
              <motion.div
                key={hospital.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-yellow-100/40 hover:scale-105 hover:shadow-lg hover:border hover:border-yellow-200 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Badge 
                      variant={index === 0 ? "default" : "outline"}
                      className={
                        index === 0 
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300" 
                          : index === 1 
                          ? "bg-gray-100 text-gray-800 border-gray-300"
                          : index === 2
                          ? "bg-orange-100 text-orange-800 border-orange-300"
                          : ""
                      }
                    >
                      #{index + 1}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{hospital.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {hospital.doctors} doctors
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        {hospital.patients} patients
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {hospital.diagnoses} diagnoses
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {hospital.diagnoses > 0 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {((hospital.diagnoses / (hospital.patients || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}