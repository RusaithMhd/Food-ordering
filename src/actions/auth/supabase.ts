'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Role } from '@/lib/permissions/rbac';

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signUpWithEmail(data: {
  email: string;
  fullName: string;
  phone: string;
  password: string;
}) {
  const email = data.email.trim().toLowerCase();
  const fullName = data.fullName.trim();
  const phone = data.phone.trim().replace(/[^0-9+]/g, '');
  const password = data.password;

  if (!email || !isValidEmail(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!fullName) {
    return { success: false, error: 'Full name is required.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  try {
    const supabase = await createClient();
    
    // Call Supabase signup
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phone,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
        return { 
          success: false, 
          error: 'Email signup rate limit exceeded. To continue testing, you can disable email rate limits in your Supabase Dashboard under Project Settings -> Auth -> Rate Limits, or wait a few minutes before trying again.' 
        };
      }
      return { success: false, error: error.message };
    }

    const user = signUpData.user;
    if (user) {
      // Sync profile immediately to public profiles as fallback using service role
      const supabaseAdmin = await createAdminClient();
      await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        phone_number: phone,
        avatar_url: '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      // Assign standard CUSTOMER role to this user in user_roles
      const { data: roleRow } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'CUSTOMER')
        .maybeSingle();

      if (roleRow) {
        await supabaseAdmin.from('user_roles').insert({
          user_id: user.id,
          role_id: roleRow.id,
        });
      }
    }

    return { 
      success: true, 
      sessionRequired: !signUpData.session,
      message: signUpData.session 
        ? 'Registration successful.' 
        : 'Please check your email to verify your account.'
    };
  } catch (err: any) {
    return { success: false, error: 'An unexpected error occurred during registration.' };
  }
}

export async function signInWithEmail(data: {
  email: string;
  password: string;
}) {
  const email = data.email.trim().toLowerCase();
  const password = data.password;

  if (!email || !isValidEmail(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!password) {
    return { success: false, error: 'Password is required.' };
  }

  try {
    const supabase = await createClient();
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return { success: false, isUnconfirmed: true, error: 'Please verify your email before continuing.' };
      }
      return { success: false, error: 'Email or password is incorrect.' };
    }

    // Sync profile fallback to make sure
    const user = signInData.user;
    if (user) {
      const supabaseAdmin = await createAdminClient();
      await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || email.split('@')[0],
        phone_number: user.user_metadata?.phone_number || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
}

export async function sendEmailOtp(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`,
      },
    });

    if (error) {
      if (error.message.includes('rate limit') || error.status === 429) {
        return { success: false, error: 'Too many requests. Please wait a moment before requesting another code.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Unable to connect. Please check your internet connection.' };
  }
}

export async function verifyEmailOtp(email: string, token: string) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  if (!cleanEmail || !cleanToken) {
    return { success: false, error: 'Email and code are required.' };
  }

  try {
    const supabase = await createClient();
    const { data: verifyData, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'email',
    });

    if (error) {
      if (error.message.includes('expired')) {
        return { success: false, error: 'This code has expired. Please request a new one.' };
      }
      return { success: false, error: 'The verification code is incorrect.' };
    }

    // Sync profile fallback
    const user = verifyData.user;
    if (user) {
      const supabaseAdmin = await createAdminClient();
      await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || cleanEmail.split('@')[0],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Verification failed. Please try again.' };
  }
}

export async function resendVerificationEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`,
      },
    });

    if (error) {
      if (error.message.includes('rate limit') || error.status === 429) {
        return { success: false, error: 'Too many requests. Please wait a moment before resending.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Connection failed.' };
  }
}

export async function requestPasswordReset(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      if (error.message.includes('rate limit') || error.status === 429) {
        return { success: false, error: 'Too many password reset attempts. Please wait.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Request failed. Please try again.' };
  }
}

export async function changeUserPassword(password: string) {
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to update password.' };
  }
}

export async function syncUserProfile(data: {
  userId: string;
  name: string;
  phone: string;
}) {
  try {
    const supabase = await createAdminClient();
    const cleanPhone = data.phone.replace(/[^0-9+]/g, '');

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.name,
        phone_number: cleanPhone,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.userId);

    if (error) {
      return { success: false, error: 'Database update failed' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Internal server error' };
  }
}
