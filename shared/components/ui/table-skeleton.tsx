import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/shared/components/ui/table';
import { Skeleton, SkeletonText } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
  headerColumns?: string[];
}

/**
 * Skeleton component for data tables during loading states
 * Integrates seamlessly with shadcn/ui Table components
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
  headerColumns,
}) => {
  const columnCount = headerColumns ? headerColumns.length : columns;

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {(headerColumns || Array.from({ length: columnCount })).map((header, i) => (
                <TableHead key={i}>
                  {typeof header === 'string' ? (
                    <span className="text-sm font-medium text-muted-foreground">
                      {header}
                    </span>
                  ) : (
                    <Skeleton className="h-4 w-20" />
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <SkeletonTableCell columnIndex={colIndex} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

/**
 * Individual cell skeleton with variety for realistic appearance
 */
const SkeletonTableCell: React.FC<{ columnIndex: number }> = ({ columnIndex }) => {
  // Create varied skeleton widths based on column index for more realistic appearance
  const getSkeletonWidth = (index: number) => {
    const widths = ['w-24', 'w-32', 'w-20', 'w-28', 'w-16'];
    return widths[index % widths.length];
  };

  return <Skeleton className={cn('h-4', getSkeletonWidth(columnIndex))} />;
};

/**
 * Specialized table skeletons for different entity types
 */
export const HospitalTableSkeleton: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className 
}) => (
  <TableSkeleton
    rows={rows}
    headerColumns={['Hospital Name', 'Location', 'Admin Email', 'Status', 'Actions']}
    className={className}
  />
);

export const DoctorTableSkeleton: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className 
}) => (
  <TableSkeleton
    rows={rows}
    headerColumns={['Doctor', 'Email', 'Specialization', 'License', 'Status', 'Actions']}
    className={className}
  />
);

export const PatientTableSkeleton: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className 
}) => (
  <TableSkeleton
    rows={rows}
    headerColumns={['Patient', 'Age', 'Dementia Stage', 'Caregiver', 'Doctor', 'Actions']}
    className={className}
  />
);

/**
 * Compact table skeleton for smaller data displays
 */
export const CompactTableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string;
}> = ({ 
  rows = 3, 
  columns = 3, 
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 rounded-lg border p-3">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton 
            key={j} 
            className={cn(
              'h-4',
              j === 0 ? 'w-32' : j === 1 ? 'w-24' : 'w-16'
            )} 
          />
        ))}
      </div>
    ))}
  </div>
);
