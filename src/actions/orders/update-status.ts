'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/permissions/withAuth';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

export const updateOrderStatus = withAuth(
  async (orderId: string, newStatus: string) => {
    try {
      const supabase = await createAdminClient();

      // 1. Update the order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // 2. Revalidate the affected paths so the UI updates
      revalidatePath('/orders');
      revalidatePath('/admin/orders');
      revalidatePath('/kitchen');
      revalidatePath('/delivery');

      return { success: true };
    } catch (error) {
      logger.error(`Failed to update order ${orderId} to status ${newStatus}`, { error });
      return { success: false, error: 'Failed to update order status' };
    }
  },
  {
    // Restrict this action to Kitchen, Delivery, Manager, Admin, Super Admin
    requiredRoles: ['KITCHEN', 'DELIVERY', 'MANAGER', 'ADMIN'],
  }
);
