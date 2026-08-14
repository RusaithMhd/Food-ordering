'use server';

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function verifySession(idToken: string | null) {
  const cookieStore = await cookies();

  if (!idToken) {
    cookieStore.delete('__session');
    return { success: true };
  }

  try {
    // 1. Verify the Firebase token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // 2. Map to Supabase Profile using Service Role
    const supabaseAdmin = await createAdminClient();
    
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: decodedToken.uid,
        email: decodedToken.email,
        full_name: decodedToken.name || decodedToken.email?.split('@')[0],
        avatar_url: decodedToken.picture,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      logger.error('Failed to map Firebase user to Supabase profile', { error: profileError });
      throw new Error('Database sync failed');
    }

    // 3. Set the session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    cookieStore.set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return { success: true };
  } catch (error) {
    logger.error('Session verification failed', { error });
    cookieStore.delete('__session');
    return { success: false, error: 'Unauthorized' };
  }
}
