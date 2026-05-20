import { supabaseAdmin } from '@/shared/lib/supabase-admin';

export type UserType = 'hospital_admin' | 'doctor' | 'patient' | 'caregiver';

export interface InviteUserOptions {
  email: string;
  userType: UserType;
  metadata?: Record<string, any>;
  redirectTo?: string;
}

export interface InviteResult {
  success: boolean;
  userId?: string;
  error?: string;
  message?: string;
}

/**
 * Unified credential management service using Supabase invite flow
 * Users receive email invitations to set their own passwords
 */
export class CredentialManager {
  /**
   * Invite user by email using Supabase Auth
   * Sends professional branded email with password setup link
   */
  static async inviteUserByEmail(options: InviteUserOptions): Promise<InviteResult> {
    try {
      const { email, userType, metadata = {}, redirectTo } = options;

      // Validate email format
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      const sanitizedEmail = this.sanitizeEmail(email);

      // Invite user via Supabase Auth (sends email automatically)
      // No redirectTo needed: the email template constructs the URL directly
      // using {{ .TokenHash }}, so redirectTo is unused and can cause PKCE token
      // generation that breaks verifyOtp({ token_hash, type: 'invite' }).
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(sanitizedEmail, {
        data: {
          user_type: userType,
          ...metadata
        }
      });

      if (error) {
        console.error('Supabase invite error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send invitation email'
        };
      }

      if (!data?.user) {
        return {
          success: false,
          error: 'Failed to create user invitation'
        };
      }

      return {
        success: true,
        userId: data.user.id,
        message: `Invitation email sent successfully to ${sanitizedEmail}`
      };
    } catch (error) {
      console.error('Invitation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send invitation'
      };
    }
  }

  /**
   * Get display name for user type
   */
  static getUserTypeDisplayName(userType: UserType): string {
    const displayNames: Record<UserType, string> = {
      hospital_admin: 'Hospital Admin',
      doctor: 'Doctor',
      patient: 'Patient',
      caregiver: 'Caregiver'
    };

    return displayNames[userType] || userType;
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string | undefined | null): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Sanitize email address
   */
  static sanitizeEmail(email: string | undefined | null): string {
    if (!email) return '';
    return email.trim().toLowerCase();
  }

  /**
   * Invite hospital admin
   */
  static async inviteHospitalAdmin(
    email: string,
    metadata?: Record<string, any>
  ): Promise<InviteResult> {
    return this.inviteUserByEmail({
      email,
      userType: 'hospital_admin',
      metadata
    });
  }

  /**
   * Invite doctor
   */
  static async inviteDoctor(
    email: string,
    metadata?: Record<string, any>
  ): Promise<InviteResult> {
    return this.inviteUserByEmail({
      email,
      userType: 'doctor',
      metadata
    });
  }

  /**
   * Invite patient
   */
  static async invitePatient(
    email: string,
    metadata?: Record<string, any>
  ): Promise<InviteResult> {
    return this.inviteUserByEmail({
      email,
      userType: 'patient',
      metadata
    });
  }

  /**
   * Invite caregiver
   */
  static async inviteCaregiver(
    email: string,
    metadata?: Record<string, any>
  ): Promise<InviteResult> {
    return this.inviteUserByEmail({
      email,
      userType: 'caregiver',
      metadata
    });
  }

  /**
   * Invite patient and caregiver (used by doctor portal)
   */
  static async invitePatientAndCaregiver(
    patientEmail: string,
    caregiverEmail: string,
    patientMetadata?: Record<string, any>,
    caregiverMetadata?: Record<string, any>
  ): Promise<{
    patient: InviteResult;
    caregiver: InviteResult;
  }> {
    const patientResult = await this.invitePatient(patientEmail, patientMetadata);
    const caregiverResult = await this.inviteCaregiver(caregiverEmail, caregiverMetadata);

    return {
      patient: patientResult,
      caregiver: caregiverResult
    };
  }
}

export default CredentialManager;
