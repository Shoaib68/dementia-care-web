import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { CreateHospitalAdminRequest } from '@/features/auth/types';
import { CredentialManager } from '@/features/credential-management/services/credential-manager';

export interface CreateHospitalResult {
  success: boolean;
  hospitalId?: string;
  message?: string;
  error?: string;
}

/**
 * Creates a new hospital with its admin user using email invitation
 * Only Super Admin can perform this operation
 */
export async function createHospitalWithAdmin(
  request: CreateHospitalAdminRequest,
  createdBy: string
): Promise<CreateHospitalResult> {
  const { email, hospitalName, adminDetails } = request;
  
  // Normalize email for consistency
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if email already exists in the users table (completed setup)
    const { data: existingUser, error: emailCheckError } = await supabaseAdmin
      .from('users')
      .select('id, email, user_type')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (emailCheckError) {
      return {
        success: false,
        error: 'Failed to verify email availability'
      };
    }

    if (existingUser) {
      return {
        success: false,
        error: `Email address '${normalizedEmail}' is already registered and active in the system. Please use a different email address.`
      };
    }
    
    // Check if email already exists in Supabase Auth (invited but not completed)
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    const existingAuthUser = authUsers?.users?.find(
      user => user.email?.toLowerCase() === normalizedEmail
    );
    
    if (existingAuthUser) {
      // User was invited before but never completed setup - delete and re-invite
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
      
      if (deleteError) {
        return {
          success: false,
          error: `Email '${normalizedEmail}' has a pending invitation. Please wait a few minutes and try again, or contact support.`
        };
      }
    }

    // Send invitation email using Credential Manager
    const inviteResult = await CredentialManager.inviteHospitalAdmin(
      normalizedEmail,
      {
        created_by: createdBy,
        first_name: adminDetails?.firstName,
        last_name: adminDetails?.lastName,
        phone: adminDetails?.phone,
        hospital_name: hospitalName
      }
    );

    if (!inviteResult.success || !inviteResult.userId) {
      return {
        success: false,
        error: inviteResult.error || 'Failed to send invitation email'
      };
    }

    const userId = inviteResult.userId;

    try {
      // Create user profile in users table
      const { error: userProfileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: normalizedEmail,
          user_type: 'hospital_admin',
          is_active: true
        });

      if (userProfileError) {
        // Rollback auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw userProfileError;
      }

      // Create hospital record
      const { data: hospital, error: hospitalError } = await supabaseAdmin
        .from('hospitals')
        .insert({
          name: hospitalName,
          admin_user_id: userId,
          is_approved: true // Auto-approve hospitals created by super admin
        })
        .select('id')
        .single();

      if (hospitalError || !hospital) {
        // Rollback user profile and auth user
        await supabaseAdmin.from('users').delete().eq('id', userId);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw hospitalError;
      }

      return {
        success: true,
        hospitalId: hospital.id,
        message: `Hospital created successfully. An invitation email has been sent to ${normalizedEmail} with instructions to set up their account.`
      };

    } catch (dbError: any) {
      // Cleanup auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return {
        success: false,
        error: dbError.message || 'Failed to create hospital record'
      };
    }

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Get all hospitals for super admin dashboard
 */
export async function getAllHospitals() {
  try {
    const { data: hospitals, error } = await supabaseAdmin
      .from('hospitals')
      .select(`
        id,
        name,
        address,
        phone_number,
        is_approved,
        created_at,
        users!hospitals_admin_user_id_fkey (
          email,
          is_active,
          updated_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: hospitals };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Deactivate hospital and its admin
 */
export async function deactivateHospital(hospitalId: string) {
  try {
    // Get hospital admin user ID
    const { data: hospital, error: hospitalError } = await supabaseAdmin
      .from('hospitals')
      .select('admin_user_id')
      .eq('id', hospitalId)
      .single();

    if (hospitalError || !hospital) {
      return { success: false, error: 'Hospital not found' };
    }

    // Deactivate hospital admin user
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('id', hospital.admin_user_id);

    if (userError) {
      return { success: false, error: userError.message };
    }

    // Update hospital status
    const { error: hospitalUpdateError } = await supabaseAdmin
      .from('hospitals')
      .update({ is_approved: false })
      .eq('id', hospitalId);

    if (hospitalUpdateError) {
      return { success: false, error: hospitalUpdateError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
