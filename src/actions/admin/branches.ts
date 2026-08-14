'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/permissions/withAuth';
import { revalidatePath } from 'next/cache';

export const createBranch = withAuth(
  async (formData: FormData) => {
    try {
      const name = formData.get('name') as string;
      const hotel_id = formData.get('hotel_id') as string;
      const timezone = formData.get('timezone') as string || 'UTC';

      if (!name || !hotel_id) {
        return { success: false, error: 'Name and Hotel ID are required' };
      }

      const supabase = await createAdminClient();

      const { error } = await supabase.from('branches').insert({
        name,
        hotel_id,
        timezone,
        status: 'OPEN'
      });

      if (error) throw error;

      revalidatePath('/admin/branches');
      return { success: true };
    } catch (error) {
      console.error('Failed to create branch:', error);
      return { success: false, error: 'Failed to create branch' };
    }
  },
  { requiredRoles: ['ADMIN', 'SUPER_ADMIN'] }
);

export const createRoom = withAuth(
  async (formData: FormData) => {
    try {
      const branch_id = formData.get('branch_id') as string;
      const room_number = formData.get('room_number') as string;
      const floor = formData.get('floor') as string;

      if (!branch_id || !room_number) {
        return { success: false, error: 'Branch and Room Number are required' };
      }

      const supabase = await createAdminClient();

      const { error } = await supabase.from('rooms').insert({
        branch_id,
        room_number,
        floor: floor || null,
        status: 'ACTIVE'
      });

      if (error) throw error;

      revalidatePath('/admin/branches');
      return { success: true };
    } catch (error) {
      console.error('Failed to create room:', error);
      return { success: false, error: 'Failed to create room' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);
