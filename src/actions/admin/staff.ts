'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/permissions/withAuth';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export const assignRole = withAuth(
  async (formData: FormData) => {
    try {
      const email = formData.get('email') as string;
      const role_id = formData.get('role_id') as string;

      if (!email || !role_id) {
        return { success: false, error: 'Email and Role are required' };
      }

      const supabase = await createAdminClient();

      // 1. Check if user already has a profile entry in public.profiles
      let { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      let userId = profile?.id;

      if (!userId) {
        // Dynamically resolve request host/protocol to support automatic redirect links after deployment
        let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
        if (!siteUrl) {
          try {
            const headerList = await headers();
            const host = headerList.get('host') || 'localhost:3000';
            const proto = headerList.get('x-forwarded-proto') || 'http';
            siteUrl = `${proto}://${host}`;
          } catch (e) {
            siteUrl = 'http://localhost:3000';
          }
        }

        // User not in profiles. Let's invite them via Supabase Admin Auth
        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
          email,
          {
            redirectTo: `${siteUrl}/auth/callback`,
          }
        );

        if (inviteError) {
          // If the user already exists in auth.users but has no profile record, fetch their ID
          console.log('User invite encountered error (checking if user exists):', inviteError.message);
          const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
          const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
          
          if (existingUser) {
            userId = existingUser.id;
          } else {
            return { success: false, error: `Failed to invite user: ${inviteError.message}` };
          }
        } else if (inviteData?.user) {
          userId = inviteData.user.id;
        }
      }

      if (!userId) {
        return { success: false, error: 'Could not resolve or create user profile' };
      }

      // 2. Ensure profile row exists in public.profiles to prevent foreign key errors
      await supabase.from('profiles').upsert({
        id: userId,
        email: email,
        full_name: email.split('@')[0],
        avatar_url: '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      // 3. Update or Insert the role mapping inside user_roles to bypass constraint mismatch errors
      const { data: existingRoleMapping } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRoleMapping) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role_id: role_id })
          .eq('user_id', userId);
        if (roleError) throw roleError;
      } else {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_id: role_id
          });
        if (roleError) throw roleError;
      }

      revalidatePath('/admin/staff');
      return { success: true };
    } catch (error: any) {
      console.error('Failed to assign role:', error);
      return { success: false, error: error.message || 'Failed to assign role' };
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
