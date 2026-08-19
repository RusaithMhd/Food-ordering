'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function syncUserProfile(data: {
  userId: string;
  name: string;
  phone: string;
}) {
  try {
    const supabase = await createAdminClient();
    const cleanPhone = data.phone.replace(/[^0-9+]/g, '');

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.name,
        phone_number: cleanPhone,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.userId);

    if (error) {
      logger.error('Failed to sync profile phone number', { error });
      return { success: false, error: 'Database update failed' };
    }

    return { success: true };
  } catch (error) {
    logger.error('Error in syncUserProfile', { error });
    return { success: false, error: 'Internal server error' };
  }
}
