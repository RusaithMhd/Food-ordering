import { cookies } from 'next/headers';
import { adminAuth } from '../firebase/server';
import { createAdminClient } from '../supabase/server';
import { logger } from '../logger';
import { Role } from '../permissions/rbac';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface GetUserResult {
  user: DecodedIdToken | null;
  role: Role | null;
  error?: string;
}

/**
 * Securely retrieves the currently authenticated user from the Firebase session cookie,
 * and fetches their role from Supabase.
 */
export async function getUser(): Promise<GetUserResult> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('__session')?.value;

    if (!session) {
      return { user: null, role: null, error: 'No session found' };
    }

    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    
    // Fetch user role from Supabase securely
    const supabase = await createAdminClient();
    const { data: userRoleData, error: roleError } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', decodedToken.uid)
      .single();

    if (roleError && roleError.code !== 'PGRST116') { // PGRST116 is 'Row not found'
      logger.error('Database error fetching user role', { error: roleError });
    }

    const role = (userRoleData?.roles as any)?.name as Role || null;

    return { user: decodedToken, role };
  } catch (error: any) {
    // Let Next.js handle dynamic server rendering bailouts
    if (error?.digest === 'DYNAMIC_SERVER_USAGE' || error?.message?.includes('Dynamic server usage') || error?.name === 'Error') {
      // Actually Next.js dynamic errors are usually just instances of Error with a specific digest or message
      if (error?.message?.includes('Dynamic server usage') || error?.digest === 'DYNAMIC_SERVER_USAGE') {
        throw error;
      }
    }
    
    logger.error('Failed to get user from session', { error });
    return { user: null, role: null, error: 'Invalid session' };
  }
}
