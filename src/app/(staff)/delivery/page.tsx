import { createAdminClient } from '@/lib/supabase/server';
import { updateOrderStatus } from '@/actions/orders/update-status';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';

async function getDeliveryOrders() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      rooms ( room_number ),
      profiles ( full_name, phone_number )
    `)
    .in('status', ['READY', 'OUT_FOR_DELIVERY'])
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching delivery orders:', error);
    return [];
  }
  return data || [];
}

export default async function DeliveryDashboard() {
  const orders = await getDeliveryOrders();

  const readyOrders = orders.filter(o => o.status === 'READY');
  const outForDeliveryOrders = orders.filter(o => o.status === 'OUT_FOR_DELIVERY');

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Delivery Dashboard</h1>
        <form action={async () => { 'use server'; revalidatePath('/delivery'); }}>
          <Button variant="outline">Refresh</Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ready for Pickup Column */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            Ready for Pickup ({readyOrders.length})
          </h2>
          {readyOrders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-bold text-2xl text-green-700">Room {order.rooms?.room_number || 'N/A'}</div>
                  <span className="text-sm font-medium text-gray-500">Order #{order.id.split('-')[0]}</span>
                </div>
              </div>

              <div className="mb-6 text-sm text-gray-600">
                <p>Customer: {order.profiles?.full_name || 'Guest'}</p>
                <p>Total Amount to Collect: <span className="font-bold text-gray-900">${order.total}</span></p>
              </div>

              <form action={async () => { 'use server'; await updateOrderStatus(order.id, 'OUT_FOR_DELIVERY'); }}>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Assign to Me &amp; Deliver</Button>
              </form>
            </div>
          ))}
        </div>

        {/* Out for Delivery Column */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg">
            Out for Delivery ({outForDeliveryOrders.length})
          </h2>
          {outForDeliveryOrders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-bold text-2xl">Room {order.rooms?.room_number || 'N/A'}</div>
                  <span className="text-sm font-medium text-gray-500">Order #{order.id.split('-')[0]}</span>
                </div>
              </div>

              <div className="mb-6 text-sm bg-gray-50 p-3 rounded-lg">
                <p>Total to Collect: <span className="font-bold">${order.total}</span></p>
                <p className="text-xs text-gray-500 mt-1">Payment: Cash on Delivery</p>
              </div>

              <form action={async () => { 'use server'; await updateOrderStatus(order.id, 'DELIVERED'); }}>
                <Button className="w-full bg-black hover:bg-gray-800 text-white">Mark as Delivered &amp; Paid</Button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
