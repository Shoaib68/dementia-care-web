import React from 'react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Skeleton, SkeletonText, SkeletonButton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

export interface FormSkeletonProps {
  className?: string;
  showHeader?: boolean;
  fields?: number;
  showActions?: boolean;
}

/**
 * Base form skeleton component for loading states
 */
export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  className,
  showHeader = true,
  fields = 4,
  showActions = true,
}) => (
  <Card className={cn(className)}>
    {showHeader && (
      <CardHeader>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </CardHeader>
    )}
    <CardContent className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
      
      {showActions && (
        <div className="flex justify-end space-x-4 pt-4">
          <SkeletonButton className="w-20" />
          <SkeletonButton className="w-24" />
        </div>
      )}
    </CardContent>
  </Card>
);

/**
 * Individual form field skeleton
 */
const FormFieldSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-2', className)}>
    <Skeleton className="h-4 w-24" /> {/* Label */}
    <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
  </div>
);

/**
 * Hospital form skeleton
 */
export const HospitalFormSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn(className)}>
    <CardHeader>
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-64" />
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Hospital Details Section */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
        <FormFieldSkeleton />
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
      </div>
      
      {/* Admin Details Section */}
      <div className="space-y-4 pt-6 border-t">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
        <FormFieldSkeleton />
      </div>
      
      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-6">
        <SkeletonButton className="w-20" />
        <SkeletonButton className="w-32" />
      </div>
    </CardContent>
  </Card>
);

/**
 * Doctor form skeleton
 */
export const DoctorFormSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn(className)}>
    <CardHeader>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-4 w-56" />
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>
      
      {/* Professional Details */}
      <div className="space-y-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>
      
      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>
      
      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-4">
        <SkeletonButton className="w-20" />
        <SkeletonButton className="w-24" />
      </div>
    </CardContent>
  </Card>
);

/**
 * Patient form skeleton
 */
export const PatientFormSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn(className)}>
    <CardHeader>
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-4 w-72" />
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Patient Details */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-28" />
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
        <FormFieldSkeleton />
      </div>
      
      {/* Caregiver Details */}
      <div className="space-y-4 pt-6 border-t">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
        <FormFieldSkeleton />
      </div>
      
      {/* Medical Assignment */}
      <div className="space-y-4 pt-6 border-t">
        <Skeleton className="h-5 w-40" />
        <FormFieldSkeleton />
      </div>
      
      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-6">
        <SkeletonButton className="w-20" />
        <SkeletonButton className="w-36" />
      </div>
    </CardContent>
  </Card>
);

/**
 * Settings form skeleton
 */
export const SettingsFormSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Profile Section */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <SkeletonButton className="w-28" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
        <FormFieldSkeleton />
      </CardContent>
    </Card>
    
    {/* Security Section */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <div className="flex items-center space-x-3 p-4 rounded-lg border">
          <Skeleton className="h-5 w-5" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Notifications Section */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

/**
 * Modal form skeleton
 */
export const ModalFormSkeleton: React.FC<{ 
  className?: string;
  fields?: number;
}> = ({ 
  className, 
  fields = 3 
}) => (
  <div className={cn('space-y-4', className)}>
    <div className="space-y-2">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
    
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
    </div>
    
    <div className="flex justify-end space-x-3 pt-4">
      <SkeletonButton className="w-20" />
      <SkeletonButton className="w-24" />
    </div>
  </div>
);
