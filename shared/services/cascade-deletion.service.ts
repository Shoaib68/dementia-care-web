/**
 * Cascade Deletion Service
 * 
 * Provides utilities for safely deleting entities with cascading dependencies
 * following proper foreign key constraint order and transaction management.
 * 
 * This service follows the project's clean architecture principles and provides
 * reusable deletion patterns for different entity types.
 */

import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ApiError } from '@/shared/lib/api';

// Types for deletion operations
export interface DeletionStep {
  name: string;
  description: string;
  tableName: string;
  condition: { field: string; values: string[] };
  returnCount?: boolean;
}

export interface CascadeDeletionConfig {
  entityName: string;
  entityId: string;
  steps: DeletionStep[];
  authUserIds: string[];
}

export interface DeletionResult {
  success: boolean;
  counts: Record<string, number>;
  totalRecordsDeleted: number;
  authUsersDeleted: number;
  authUsersFailed: number;
  errors: string[];
}

export class CascadeDeletionService {
  /**
   * Execute a cascade deletion following the provided configuration
   */
  static async executeCascadeDeletion(config: CascadeDeletionConfig): Promise<DeletionResult> {
    const { entityName, entityId, steps, authUserIds } = config;
    
    // Starting cascade deletion
    
    const result: DeletionResult = {
      success: false,
      counts: {},
      totalRecordsDeleted: 0,
      authUsersDeleted: 0,
      authUsersFailed: 0,
      errors: []
    };

    try {
      // Execute each deletion step in order
      for (const step of steps) {
        if (step.condition.values.length === 0) {
          result.counts[step.name] = 0;
          continue;
        }
        
        let deletedCount = 0;
        let error: any = null;
        
        if (step.returnCount) {
          // For count tracking, use delete with returning to get exact count
          const { count: deleteCount, error: deleteError } = await supabaseAdmin
            .from(step.tableName)
            .delete({ count: 'exact' })
            .in(step.condition.field, step.condition.values);
          
          deletedCount = deleteCount || 0;
          error = deleteError;
        } else {
          // For simple deletion without count tracking
          const { error: deleteError } = await supabaseAdmin
            .from(step.tableName)
            .delete()
            .in(step.condition.field, step.condition.values);
          
          error = deleteError;
          deletedCount = step.condition.values.length; // Approximate count
        }

        if (error) {
          const errorMessage = `Failed to delete ${step.name}: ${error.message}`;
          console.error(`❌ ${errorMessage}`, {
            step: step.name,
            table: step.tableName,
            condition: step.condition,
            errorDetails: {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            }
          });
          
          result.errors.push(errorMessage);
          throw new ApiError(errorMessage, 500, `${step.name.toUpperCase()}_DELETE_FAILED`);
        }

        result.counts[step.name] = deletedCount;
        result.totalRecordsDeleted += deletedCount;
      }

      // Delete authentication users last
      if (authUserIds.length > 0) {
        for (const userId of authUserIds) {
          try {
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (authError) {
              result.authUsersFailed++;
            } else {
              result.authUsersDeleted++;
            }
          } catch (error: any) {
            result.authUsersFailed++;
          }
        }
      }

      result.success = true;
      return result;

    } catch (error: any) {
      console.error(`❌ Error during ${entityName} cascade deletion:`, error);
      result.errors.push(error.message || 'Unknown error');
      result.success = false;
      throw error;
    }
  }

  /**
   * Create a hospital deletion configuration
   */
  static createHospitalDeletionConfig(
    hospitalId: string,
    {
      doctorIds = [],
      patientIds = [],
      caregiverIds = [],
      allUserIds = []
    }: {
      doctorIds?: string[];
      patientIds?: string[];
      caregiverIds?: string[];
      allUserIds?: string[];
    }
  ): CascadeDeletionConfig {
    const steps: DeletionStep[] = [
      // Phase 1: Delete IoT and related data
      {
        name: 'bleConnections',
        description: 'Deleting BLE connection logs',
        tableName: 'ble_connection_logs',
        condition: { field: 'patient_id', values: patientIds },
        returnCount: true
      },
      {
        name: 'locationAlerts',
        description: 'Deleting location alerts',
        tableName: 'location_alerts',
        condition: { field: 'patient_id', values: patientIds },
        returnCount: true
      },
      {
        name: 'iotDevices',
        description: 'Deleting IoT devices',
        tableName: 'iot_devices',
        condition: { field: 'patient_id', values: patientIds },
        returnCount: true
      },

      // Phase 2: Delete patient-related data
      {
        name: 'gameSessions',
        description: 'Deleting game sessions',
        tableName: 'game_sessions',
        condition: { field: 'patient_id', values: patientIds },
        returnCount: true
      },
      {
        name: 'monthlyReports',
        description: 'Deleting monthly reports',
        tableName: 'monthly_reports',
        condition: { field: 'patient_id', values: patientIds },
        returnCount: true
      },
      {
        name: 'schedules',
        description: 'Deleting schedules',
        tableName: 'schedules',
        condition: { field: 'patient_id', values: patientIds },
        returnCount: true
      },
      {
        name: 'taskLogs',
        description: 'Deleting task completion logs',
        tableName: 'task_completion_logs',
        condition: { field: 'patient_id', values: patientIds }
      },

      // Phase 3: Delete medical data
      {
        name: 'medicalNotes',
        description: 'Deleting medical notes',
        tableName: 'medical_notes',
        condition: { field: 'patient_id', values: patientIds },
        returnCount: true
      },
      {
        name: 'mriScans',
        description: 'Deleting MRI scans',
        tableName: 'mri_scans',
        condition: { field: 'hospital_id', values: [hospitalId] },
        returnCount: true
      },

      // Phase 4: Delete assignment relationships
      {
        name: 'patientCaregiverAssignments',
        description: 'Deleting patient-caregiver assignments',
        tableName: 'patient_caregiver_assignments',
        condition: { field: 'patient_id', values: patientIds }
      },
      {
        name: 'patientDoctorAssignments',
        description: 'Deleting patient-doctor assignments',
        tableName: 'patient_doctor_assignments',
        condition: { field: 'patient_id', values: patientIds }
      },

      // Phase 5: Delete role-specific records (CRITICAL ORDER)
      {
        name: 'caregivers',
        description: 'Deleting caregiver records',
        tableName: 'caregivers',
        condition: { field: 'id', values: caregiverIds }
      },
      {
        name: 'patients',
        description: 'Deleting patient records',
        tableName: 'patients',
        condition: { field: 'id', values: patientIds }
      },
      {
        name: 'doctors',
        description: 'Deleting doctor records',
        tableName: 'doctors',
        condition: { field: 'id', values: doctorIds }
      },

      // Phase 6: Delete hospital record
      {
        name: 'hospital',
        description: 'Deleting hospital record',
        tableName: 'hospitals',
        condition: { field: 'id', values: [hospitalId] }
      },

      // Phase 7: Delete users table records LAST
      {
        name: 'users',
        description: 'Deleting user records from users table',
        tableName: 'users',
        condition: { field: 'id', values: allUserIds }
      }
    ];

    return {
      entityName: 'hospital',
      entityId: hospitalId,
      steps,
      authUserIds: allUserIds
    };
  }

  /**
   * Validate deletion configuration before execution
   */
  static validateDeletionConfig(config: CascadeDeletionConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.entityName || !config.entityId) {
      errors.push('Entity name and ID are required');
    }

    if (!config.steps || config.steps.length === 0) {
      errors.push('Deletion steps are required');
    }

    for (const step of config.steps || []) {
      if (!step.name || !step.tableName || !step.condition) {
        errors.push(`Invalid step configuration: ${step.name}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default CascadeDeletionService;