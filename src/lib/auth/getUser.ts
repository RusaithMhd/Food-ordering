import { createClient, createAdminClient } from '../supabase/server';
import { logger } from '../logger';
import { Role } from '../permissions/rbac';

export interface GetUserResult {
  user: {
    uid: string;
    email: string | undefined;
    name: string;
    picture: string;
  } | null;
  role: Role | null;
  error?: string;
}

/**
 * Securely retrieves the currently authenticated user from Supabase Auth session,
 * and fetches their role from Supabase.
 *
 * NOTE: We use the anon client for auth.getUser() (verifies the session JWT),
 * but the service-role (admin) client for the user_roles lookup so that RLS
 * policies on user_roles can never silently block a legitimate role read.
 * This is safe because the user identity is already verified before the lookup.
 */
export async function getUser(): Promise<GetUserResult> {
  try {
    // Step 1: Verify the session with the anon (cookie-aware) client
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { user: null, role: null, error: 'No session found' };
    }

    const decodedToken = {
      uid: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      picture: user.user_metadata?.avatar_url || '',
    };

    // Step 2: Look up the role using the service-role client (bypasses RLS).
    // Identity is already confirmed above — this is safe.
    const adminClient = await createAdminClient();
    const { data: userRoleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      logger.error('Database error fetching user role', { error: roleError });
    }

    const role = (userRoleData?.roles as any)?.name as Role || null;

    return { user: decodedToken, role };
  } catch (error: any) {
    if (error?.digest === 'DYNAMIC_SERVER_USAGE' || error?.message?.includes('Dynamic server usage')) {
      throw error;
    }
    
    logger.error('Failed to get user from session', { error });
    return { user: null, role: null, error: 'Invalid session' };
  }
}
