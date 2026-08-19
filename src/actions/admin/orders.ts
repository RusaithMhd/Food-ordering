'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/permissions/withAuth';
import { revalidatePath } from 'next/cache';

export const getAdminOrders = withAuth(
  async (statusFilter?: string) => {
    const supabase = await createAdminClient();
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles:customer_id (
          full_name,
          email,
          phone_number
        ),
        delivery_zones:delivery_zone_id (
          name
        ),
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          menu_items (
            name
          )
        )
      `)
      .order('placed_at', { ascending: false });

    if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching admin orders:', error);
      throw new Error('Failed to fetch orders');
    }

    return data;
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);

export const updateAdminOrderStatus = withAuth(
  async (orderId: string, status: string) => {
    const supabase = await createAdminClient();
    
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: 'Failed to update order status' };
    }

    revalidatePath('/admin/orders');
    revalidatePath('/kitchen');
    revalidatePath('/delivery');
    return { success: true };
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);
