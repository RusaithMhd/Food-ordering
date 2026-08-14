'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/permissions/withAuth';
import { revalidatePath } from 'next/cache';

export const assignRole = withAuth(
  async (formData: FormData) => {
    try {
      const email = formData.get('email') as string;
      const role_id = formData.get('role_id') as string;

      if (!email || !role_id) {
        return { success: false, error: 'Email and Role are required' };
      }

      const supabase = await createAdminClient();

      // 1. Find the user profile by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!profile) {
        return { success: false, error: 'User not found in system. They must sign in once first.' };
      }

      // 2. Upsert the role mapping
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: profile.id,
          role_id: role_id
        }, { onConflict: 'user_id' }); // Assuming a user can only have one primary role for simplicity in MVP

      if (error) throw error;

      revalidatePath('/admin/staff');
      return { success: true };
    } catch (error) {
      console.error('Failed to assign role:', error);
      return { success: false, error: 'Failed to assign role' };
    }
  },
  { requiredRoles: ['ADMIN', 'SUPER_ADMIN'] }
);

export const revokeRole = withAuth(
  async (user_id: string) => {
    try {
      const supabase = await createAdminClient();
      const { error } = await supabase.from('user_roles').delete().eq('user_id', user_id);

      if (error) throw error;

      revalidatePath('/admin/staff');
      return { success: true };
    } catch (error) {
      console.error('Failed to revoke role:', error);
      return { success: false, error: 'Failed to revoke role' };
    }
  },
  { requiredRoles: ['ADMIN', 'SUPER_ADMIN'] }
);
