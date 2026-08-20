import { createClient } from '../supabase/server';
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
 */
export async function getUser(): Promise<GetUserResult> {
  try {
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

    // Fetch user role from Supabase securely
    const { data: userRoleData, error: roleError } = await supabase
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
