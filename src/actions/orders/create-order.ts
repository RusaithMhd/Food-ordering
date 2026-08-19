'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/getUser';
import { logger } from '@/lib/logger';
import { parseClosingTimes } from '@/utils/closingTimes';

interface CreateOrderData {
  delivery_address_id?: string;
  manual_delivery_details?: {
    name: string;
    phone: string;
    location: string;
  };
  customer_id: string;
  items: {
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    notes?: string;
  }[];
  customer_note?: string;
  meal_type?: string;
}

export async function createOrder(data: CreateOrderData) {
  const { user } = await getUser();

  if (!user || user.uid !== data.customer_id) {
    return { success: false, error: 'Unauthorized or invalid user context' };
  }

  try {
    const supabase = await createAdminClient();

    // Check if the user is an Admin/Manager/Kitchen staff to bypass closing times
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.uid);
    const rolesList = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isStaffOrAdmin = rolesList.includes('ADMIN') || rolesList.includes('MANAGER') || rolesList.includes('SUPER_ADMIN') || rolesList.includes('KITCHEN') || rolesList.includes('DELIVERY');

    // 0. closing time check
    if (!isStaffOrAdmin && data.meal_type) {
      const { data: defaultBranch } = await supabase
        .from('branches')
        .select('id, timezone')
        .limit(1)
        .single();
        
      if (defaultBranch?.timezone && defaultBranch.timezone.includes('R:')) {
        const closingTimes = parseClosingTimes(defaultBranch.timezone);
        const mealKey = data.meal_type.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';
        const closingTimeStr = closingTimes[mealKey];
        
        if (closingTimeStr) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMin = now.getMinutes();
          const currentTimeNum = currentHour * 60 + currentMin;
          
          const [closeHour, closeMin] = closingTimeStr.split(':').map(Number);
          const closeTimeNum = closeHour * 60 + closeMin;
          
          if (currentTimeNum > closeTimeNum) {
            return { 
              success: false, 
              error: `The kitchen has closed for ${data.meal_type}. Please contact the shop for more details.` 
            };
          }
        }
      }
    }


    // Securely fetch actual prices from the database
    const menuItemIds = data.items.map(i => i.menu_item_id);
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, base_price, description')
      .in('id', menuItemIds)
      .eq('is_active', true);

    if (menuError || !menuItems || menuItems.length !== data.items.length) {
      logger.error('Failed to validate menu items or some items are inactive', { error: menuError });
      return { success: false, error: 'One or more items are unavailable or prices could not be verified' };
    }

    const parsePriceOptions = (desc: string | null | undefined): number[] => {
      if (!desc) return [];
      const parts = desc.split('||prices:');
      if (parts.length < 2) return [];
      const pricePart = parts[1].split('||')[0];
      return pricePart.split(',').map(Number).filter(n => !isNaN(n));
    };

    // Map fetched details for secure calculation
    const priceMap = new Map(menuItems.map(item => [item.id, item.base_price]));
    const descMap = new Map(menuItems.map(item => [item.id, item.description]));

    let subtotal = 0;
    const secureOrderItems = [];

    for (const item of data.items) {
      const basePrice = Number(priceMap.get(item.menu_item_id) || 0);
      const desc = descMap.get(item.menu_item_id);
      const allowedPrices = parsePriceOptions(desc);
      
      let finalPrice = basePrice;
      if (item.unit_price && allowedPrices.length > 0) {
        if (allowedPrices.includes(Number(item.unit_price))) {
          finalPrice = Number(item.unit_price);
        } else {
          return { success: false, error: 'Invalid item price option selected' };
        }
      }
      
      const totalItemPrice = finalPrice * Number(item.quantity);
      subtotal += totalItemPrice;
      
      secureOrderItems.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: finalPrice,
        total_price: totalItemPrice,
        notes: item.notes || ''
      });
    }

    let delivery_fee = 0;
    let zone_id = null;
    let delivery_address_snapshot: any = {};

    if (data.manual_delivery_details) {
      delivery_fee = 2.50; // Default delivery fee
      delivery_address_snapshot = {
        address_type: 'CUSTOM',
        address_line1: data.manual_delivery_details.location,
        recipient_name: data.manual_delivery_details.name,
        phone: data.manual_delivery_details.phone,
        delivery_fee: delivery_fee
      };
    } else if (data.delivery_address_id) {
      // Securely fetch address and delivery zone fee
      const { data: address, error: addressError } = await supabase
        .from('delivery_addresses')
        .select('*, delivery_zones(delivery_fee, is_active)')
        .eq('id', data.delivery_address_id)
        .eq('customer_id', data.customer_id)
        .single();

      if (addressError || !address) {
        return { success: false, error: 'Invalid delivery address' };
      }

      if (!address.delivery_zones?.is_active) {
        return { success: false, error: 'Delivery zone is currently inactive' };
      }

      delivery_fee = address.delivery_zones.delivery_fee || 0;
      zone_id = address.zone_id;
      delivery_address_snapshot = {
        address_type: address.address_type,
        address_line1: address.address_line1,
        address_line2: address.address_line2,
        landmark: address.landmark,
        zone_id: address.zone_id,
        delivery_fee: delivery_fee,
        recipient_name: address.recipient_name,
        phone: address.phone
      };
    } else {
      return { success: false, error: 'No delivery address provided' };
    }

    const tax = 0; // Tax calculation can be added here
    const total = subtotal + tax + delivery_fee;

    // Fetch the default branch
    const { data: defaultBranch } = await supabase.from('branches').select('id').limit(1).single();

    // 1. Insert Order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        branch_id: defaultBranch?.id,
        customer_id: data.customer_id,
        delivery_zone_id: zone_id,
        delivery_address_snapshot,
        subtotal,
        tax,
        delivery_fee,
        total,
        customer_note: data.customer_note || '',
        status: 'PLACED'
      })
      .select()
      .single();

    if (orderError || !newOrder) {
      logger.error('Failed to create order', { error: orderError });
      return { success: false, error: 'Database error creating order' };
    }

    // 2. Insert Secure Order Items
    const orderItemsToInsert = secureOrderItems.map(item => ({
      order_id: newOrder.id,
      ...item
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      logger.error('Failed to create order items', { error: itemsError });
      // In a robust system, we would rollback the order creation here using a stored procedure or transaction.
      return { success: false, error: 'Failed to add items to order' };
    }

    return { success: true, orderId: newOrder.id };
  } catch (error) {
    logger.error('Error in createOrder', { error });
    return { success: false, error: 'Internal server error' };
  }
}
