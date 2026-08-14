'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/getUser';
import { logger } from '@/lib/logger';

export interface CreateAddressData {
  address_type: 'UNIVERSITY' | 'HOSTEL' | 'PRIVATE_ADDRESS' | 'CAMPUS' | 'OTHER';
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  zone_id: string;
  is_default?: boolean;
}

export const getUserAddresses = async () => {
  try {
    const { user } = await getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('delivery_addresses')
      .select('*, delivery_zones(name, delivery_fee)')
      .eq('customer_id', user.uid)
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Failed to get user addresses', { error });
    return { success: false, error: 'Failed to fetch addresses' };
  }
};

export const createAddress = async (data: CreateAddressData) => {
  try {
    const { user } = await getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const supabase = await createAdminClient();

    // If setting as default, unset others first
    if (data.is_default) {
      await supabase
        .from('delivery_addresses')
        .update({ is_default: false })
        .eq('customer_id', user.uid);
    }

    const { data: newAddress, error } = await supabase
      .from('delivery_addresses')
      .insert([{
        customer_id: user.uid,
        ...data
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: newAddress };
  } catch (error) {
    logger.error('Failed to create address', { error });
    return { success: false, error: 'Failed to create address' };
  }
};

export const deleteAddress = async (id: string) => {
  try {
    const { user } = await getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const supabase = await createAdminClient();
    
    // Soft delete
    const { error } = await supabase
      .from('delivery_addresses')
      .update({ is_active: false })
      .eq('id', id)
      .eq('customer_id', user.uid);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete address', { error });
    return { success: false, error: 'Failed to delete address' };
  }
};
