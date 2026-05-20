"use client";

import React from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute';
import { ErrorBoundary } from '@/shared/components/error/ErrorBoundary';
import { BarChart3, Users, Home, TrendingUp, UserPlus } from 'lucide-react';

const menuItems = [
  {
    path: '/hospital-admin/dashboard',
    label: 'Dashboard',
    icon: Home,
  },
  {
    path: '/hospital-admin/doctors',
    label: 'Doctor Management',
    icon: Users,
  },
  {
    path: '/hospital-admin/patients',
    label: 'Patient Management',
    icon: UserPlus,
  },
  {
    path: '/hospital-admin/analytics',
    label: 'Analytics',
    icon: TrendingUp,
  },
];

export default function HospitalAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['hospital_admin']}>
      <DashboardLayout
        menuItems={menuItems}
        title="Hospital Administration"
        subtitle="Manage your hospital's operations and staff"
        userRole="Hospital Administrator"
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
