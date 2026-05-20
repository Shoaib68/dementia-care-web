"use client";

import React from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute';
import { ErrorBoundary } from '@/shared/components/error/ErrorBoundary';
import { BarChart3, Building2, TrendingUp, Brain } from 'lucide-react';

const menuItems = [
  {
    path: '/super-admin/dashboard',
    label: 'Dashboard',
    icon: BarChart3,
  },
  {
    path: '/super-admin/hospitals',
    label: 'Hospital Management',
    icon: Building2,
  },
  {
    path: '/super-admin/analytics',
    label: 'Analytics',
    icon: TrendingUp,
  },
  {
    path: '/super-admin/mri-retraining',
    label: 'MRI Retraining Data',
    icon: Brain,
  },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <DashboardLayout
        menuItems={menuItems}
        title="Super Admin Dashboard"
        subtitle="System-wide management and analytics"
        userRole="Super Administrator"
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
