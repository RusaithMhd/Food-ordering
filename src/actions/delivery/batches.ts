'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/permissions/withAuth';
import { logger } from '@/lib/logger';

export interface CreateBatchData {
  driver_id: string;
  order_ids: string[];
}

export const createDeliveryBatch = withAuth(
  async (data: CreateBatchData) => {
    try {
      const supabase = await createAdminClient();
      
      // 1. Verify orders are ready and not already assigned
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status')
        .in('id', data.order_ids);
        
      if (ordersError || !orders) throw new Error('Failed to fetch orders');
      
      const validStatuses = ['READY', 'PREPARING'];
      const invalidOrders = orders.filter(o => !validStatuses.includes(o.status as string));
      if (invalidOrders.length > 0) {
        return { success: false, error: 'Some orders are not ready for delivery' };
      }

      // Create a batch (No RPC available in this setup without migrations, doing sequential inserts for MVP)
      
      // 2. Insert Batch
      const batchNumber = `BATCH-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
      const { data: batch, error: batchError } = await supabase
        .from('delivery_batches')
        .insert([{
          batch_number: batchNumber,
          assigned_driver_id: data.driver_id,
          status: 'PENDING'
        }])
        .select()
        .single();
        
      if (batchError || !batch) throw batchError;

      // 3. Link orders to batch
      const batchOrders = data.order_ids.map((orderId, index) => ({
        batch_id: batch.id,
        order_id: orderId,
        sequence_order: index + 1
      }));

      const { error: linksError } = await supabase
        .from('delivery_batch_orders')
        .insert(batchOrders);
        
      if (linksError) throw linksError;

      // 4. Update order statuses to ASSIGNED
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'ASSIGNED' })
        .in('id', data.order_ids);
        
      if (updateError) throw updateError;

      return { success: true, data: batch };
    } catch (error) {
      logger.error('Failed to create delivery batch', { error });
      return { success: false, error: 'Failed to assign deliveries' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER'] } // Usually manager/admin assigns batches
);

export const updateBatchStatus = withAuth(
  async (batch_id: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      const supabase = await createAdminClient();
      
      const { data, error } = await supabase
        .from('delivery_batches')
        .update({ status })
        .eq('id', batch_id)
        .select()
        .single();
        
      if (error) throw error;
      
      // If batch is in progress, update all its orders to OUT_FOR_DELIVERY
      if (status === 'IN_PROGRESS') {
        const { data: batchOrders } = await supabase
          .from('delivery_batch_orders')
          .select('order_id')
          .eq('batch_id', batch_id);
          
        if (batchOrders && batchOrders.length > 0) {
          await supabase
            .from('orders')
            .update({ status: 'OUT_FOR_DELIVERY' })
            .in('id', batchOrders.map(bo => bo.order_id));
        }
      }

      return { success: true, data };
    } catch (error) {
      logger.error('Failed to update batch status', { error });
      return { success: false, error: 'Failed to update batch' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'DELIVERY'] }
);
