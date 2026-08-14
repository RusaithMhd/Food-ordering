'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/permissions/withAuth';
import { logger } from '@/lib/logger';

export interface CreateZoneData {
  name: string;
  description?: string;
  delivery_fee: number;
  minimum_order_value?: number;
  is_active?: boolean;
}

export const getDeliveryZones = async (includeInactive = false) => {
  try {
    const supabase = await createAdminClient();
    let query = supabase.from('delivery_zones').select('*').order('name');
    
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    logger.error('Failed to get delivery zones', { error });
    return { success: false, error: 'Failed to fetch delivery zones' };
  }
};

export const createDeliveryZone = withAuth(
  async (data: CreateZoneData) => {
    try {
      const supabase = await createAdminClient();
      const { data: zone, error } = await supabase
        .from('delivery_zones')
        .insert([{
          name: data.name,
          description: data.description,
          delivery_fee: data.delivery_fee,
          minimum_order_value: data.minimum_order_value || 0,
          is_active: data.is_active ?? true
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: zone };
    } catch (error) {
      logger.error('Failed to create delivery zone', { error });
      return { success: false, error: 'Failed to create zone' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER'] }
);

import { revalidatePath } from 'next/cache';

export const createZoneAction = withAuth(
  async (formData: FormData) => {
    try {
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const delivery_fee = parseFloat(formData.get('delivery_fee') as string);
      const minimum_order_value = parseFloat(formData.get('minimum_order_value') as string) || 0;

      if (!name || isNaN(delivery_fee)) {
        return { success: false, error: 'Missing required fields' };
      }

      const supabase = await createAdminClient();
      const { error } = await supabase.from('delivery_zones').insert([{
        name,
        description,
        delivery_fee,
        minimum_order_value,
        is_active: true
      }]);

      if (error) throw error;

      revalidatePath('/admin/zones');
      return { success: true };
    } catch (error) {
      logger.error('Failed to create zone via form', { error });
      return { success: false, error: 'Failed to create zone' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);

export const updateDeliveryZone = withAuth(
  async (id: string, updates: Partial<CreateZoneData>) => {
    try {
      const supabase = await createAdminClient();
      const { data, error } = await supabase
        .from('delivery_zones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to update delivery zone', { error });
      return { success: false, error: 'Failed to update zone' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER'] }
);
