import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Use admin client to check if user exists
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, user_type')
      .eq('email', normalizedEmail)
      .maybeSingle();
    if (error) {
      console.error('API: Database error checking email existence:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Database error',
        exists: false 
      }, { status: 500 });
    }

    const exists = !!data;
    return NextResponse.json({ 
      success: true, 
      exists,
      userData: data ? { id: data.id, email: data.email, user_type: data.user_type } : null
    });

  } catch (error) {
    console.error('API: Unexpected error in check-email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      exists: false
    }, { status: 500 });
  }
}
