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

export const updateKitchenClosingTimes = withAuth(
  async (formData: FormData) => {
    try {
      const branchId = formData.get('branch_id') as string;
      const breakfast = formData.get('closing_breakfast') as string || '';
      const lunch = formData.get('closing_lunch') as string || '';
      const dinner = formData.get('closing_dinner') as string || '';

      if (!branchId) {
        return { success: false, error: 'Branch ID is required' };
      }

      // Format current local Date for resetting
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const resetKey = `${mm}${dd}`;

      const formatTime = (t: string) => {
        if (!t) return '9999';
        return t.replace(':', '');
      };

      const timezoneString = `B:${formatTime(breakfast)},L:${formatTime(lunch)},D:${formatTime(dinner)},R:${resetKey}`;

      const supabase = await createAdminClient();
      const { error } = await supabase
        .from('branches')
        .update({ timezone: timezoneString })
        .eq('id', branchId);

      if (error) throw error;

      revalidatePath('/admin');
      revalidatePath('/');
      return { success: true };
    } catch (error) {
      console.error('Failed to update kitchen closing times:', error);
      return { success: false, error: 'Failed to update closing times' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);

export const updateHotelBranding = withAuth(
  async (formData: FormData) => {
    try {
      const hotelId = formData.get('hotel_id') as string;
      const name = formData.get('name') as string || '';
      const phone = formData.get('phone') as string || '';
      const address = formData.get('address') as string || '';

      if (!hotelId) {
        return { success: false, error: 'Hotel ID is required' };
      }

      const serialized = JSON.stringify({ name, phone, address });

      const supabase = await createAdminClient();
      
      // 1. Update the hotel name with serialized JSON
      const { error: hotelErr } = await supabase
        .from('hotels')
        .update({ name: serialized })
        .eq('id', hotelId);

      if (hotelErr) throw hotelErr;

      // 2. Also update all branches names to this new name so they show correctly in order views!
      const { error: branchErr } = await supabase
        .from('branches')
        .update({ name: name })
        .eq('hotel_id', hotelId);

      if (branchErr) {
        console.error('Failed to sync branches names:', branchErr);
      }

      revalidatePath('/admin');
      revalidatePath('/admin/settings');
      revalidatePath('/');
      revalidatePath('/orders');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update hotel branding settings:', error);
      return { success: false, error: 'Failed to update hotel branding settings' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);

