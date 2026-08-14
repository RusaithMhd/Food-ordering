'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/permissions/withAuth';
import { revalidatePath } from 'next/cache';

export const createCategory = withAuth(
  async (formData: FormData) => {
    try {
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const branch_id = formData.get('branch_id') as string;

      if (!name || !branch_id) {
        return { success: false, error: 'Missing required fields' };
      }

      const supabase = await createAdminClient();

      const { error } = await supabase.from('categories').insert({
        name,
        description,
        branch_id,
        is_active: true,
      });

      if (error) throw error;

      revalidatePath('/admin/categories');
      revalidatePath('/admin/menu');
      revalidatePath('/'); 
      return { success: true };
    } catch (error) {
      console.error('Failed to create category:', error);
      return { success: false, error: 'Failed to create category' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);

export const deleteCategory = withAuth(
  async (id: string) => {
    try {
      const supabase = await createAdminClient();
      const { error } = await supabase.from('categories').delete().eq('id', id);

      if (error) throw error;

      revalidatePath('/admin/categories');
      revalidatePath('/admin/menu');
      revalidatePath('/');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete category:', error);
      return { success: false, error: 'Failed to delete category' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);
