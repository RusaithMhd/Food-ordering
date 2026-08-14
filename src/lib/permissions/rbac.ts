import { createAdminClient, createClient } from '../supabase/server';
import { logger } from '../logger';

export type Role = 'CUSTOMER' | 'KITCHEN' | 'DELIVERY' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN';

export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    const supabase = await createAdminClient();
    
    // Fetch roles
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', userId);

    if (error || !data) {
      logger.error('Error fetching user roles', { error });
      return [];
    }

    // Safely extract the role names from the joined table structure
    return data.map((ur: any) => ur.roles?.name).filter(Boolean);
  } catch (error) {
    logger.error('Failed to get user roles', { error });
    return [];
  }
}

export async function hasRole(userId: string, targetRole: Role): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(targetRole) || roles.includes('SUPER_ADMIN');
}

export async function hasAnyRole(userId: string, targetRoles: Role[]): Promise<boolean> {
  const roles = await getUserRoles(userId);
  if (roles.includes('SUPER_ADMIN')) return true;
  return targetRoles.some(role => roles.includes(role));
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const supabase = await createAdminClient();
    
    // Complex join to get permissions through user_roles -> roles -> role_permissions -> permissions
    // In Supabase we typically do this with a secure database function for performance,
    // but for now we'll fetch roles and then permissions.
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);

    if (!userRoles || userRoles.length === 0) return [];
    
    const roleIds = userRoles.map(ur => ur.role_id);
    
    const { data: permissions } = await supabase
      .from('role_permissions')
      .select('permissions(name)')
      .in('role_id', roleIds);

    if (!permissions) return [];

    // Extract and deduplicate
    const perms = permissions.map((rp: any) => rp.permissions?.name).filter(Boolean);
    return Array.from(new Set(perms));
  } catch (error) {
    logger.error('Failed to get user permissions', { error });
    return [];
  }
}

export async function hasPermission(userId: string, targetPermission: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  if (roles.includes('SUPER_ADMIN')) return true;
  
  const permissions = await getUserPermissions(userId);
  return permissions.includes(targetPermission);
}
