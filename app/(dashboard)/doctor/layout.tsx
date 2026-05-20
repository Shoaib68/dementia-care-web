"use client";

import React from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute';
import { ErrorBoundary } from '@/shared/components/error/ErrorBoundary';
import { Users, Plus, BarChart3, Brain } from 'lucide-react';

const menuItems = [
  {
    path: '/doctor',
    label: 'Dashboard',
    icon: BarChart3,
  },
  {
    path: '/doctor/patients',
    label: 'Patients',
    icon: Users,
  },
  {
    path: '/doctor/add-patient',
    label: 'Add Patient',
    icon: Plus,
  },
  {
    path: '/doctor/mri-analysis',
    label: 'MRI Analysis',
    icon: Brain,
  },
];

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <DashboardLayout
        menuItems={menuItems}
        title="Doctor Portal"
        subtitle="Manage your patients and diagnoses"
        userRole="Doctor"
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
