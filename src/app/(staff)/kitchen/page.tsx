import { createAdminClient } from '@/lib/supabase/server';
import { updateOrderStatus } from '@/actions/orders/update-status';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { ChefHat, Flame, Utensils, CheckCircle2, Clock, MapPin, RefreshCw } from 'lucide-react';

async function getKitchenOrders() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      rooms ( room_number ),
      order_items (
        id,
        quantity,
        notes,
        menu_items ( name )
      )
    `)
    .in('status', ['PLACED', 'CONFIRMED', 'PREPARING'])
    .order('placed_at', { ascending: true });

  if (error) {
    console.error('Error fetching kitchen orders:', error);
    return [];
  }
  return data || [];
}

export default async function KitchenDashboard() {
  const orders = await getKitchenOrders();

  const placedOrders = orders.filter(o => o.status === 'PLACED' || o.status === 'CONFIRMED');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');

  return (
    <div className="min-h-screen bg-slate-50 pt-6 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <ChefHat className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kitchen Display</h1>
            </div>
            <p className="text-slate-500 font-medium">Live feed of incoming orders and preparation queue.</p>
          </div>
          <form action={async () => { 'use server'; revalidatePath('/kitchen'); }}>
            <Button variant="outline" className="rounded-full bg-white border-slate-200 shadow-sm font-medium hover:bg-slate-50">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh Feed
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Incoming Column */}
          <div className="flex flex-col h-[calc(100vh-180px)]">
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 px-5 py-3 rounded-t-2xl">
              <h2 className="text-lg font-bold text-blue-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                Incoming Orders
              </h2>
              <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
                {placedOrders.length}
              </span>
            </div>
            <div className="flex-1 bg-slate-100/50 border-x border-b border-slate-200/60 rounded-b-2xl p-4 overflow-y-auto hide-scrollbar space-y-4 shadow-inner">
              {placedOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Utensils className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="font-medium text-sm">No new orders</p>
                </div>
              ) : placedOrders.map((order) => {
                const isDelivery = order.customer_note?.includes('DELIVERY ADDRESS:');
                const locationLabel = isDelivery 
                  ? order.customer_note.replace('DELIVERY ADDRESS:', '').trim()
                  : order.rooms?.room_number ? `Room ${order.rooms.room_number}` : 'Unknown Location';

                return (
                  <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900 text-lg">Order #{order.id.split('-')[0].toUpperCase()}</span>
                          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            {new Date(order.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-start space-x-1.5 mt-1 text-slate-600 font-medium text-sm">
                          <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <span className="leading-tight">{locationLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100 ml-2">
                      <ul className="space-y-2.5">
                        {order.order_items?.map((item: any) => (
                          <li key={item.id} className="flex items-start">
                            <span className="font-black text-blue-600 w-6 shrink-0">{item.quantity}x</span>
                            <span className="font-semibold text-slate-800">{item.menu_items?.name}</span>
                          </li>
                        ))}
                      </ul>
                      {!isDelivery && order.customer_note && (
                        <div className="mt-3 pt-3 border-t border-slate-200/60 text-sm font-medium text-amber-700 flex items-start">
                          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-xs font-bold mr-2 shrink-0">NOTE</span>
                          {order.customer_note}
                        </div>
                      )}
                    </div>

                    <form action={async () => { 'use server'; await updateOrderStatus(order.id, 'PREPARING'); }} className="ml-2">
                      <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all text-base">
                        Accept &amp; Start Cooking
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preparing Column */}
          <div className="flex flex-col h-[calc(100vh-180px)]">
            <div className="flex items-center justify-between bg-amber-50 border border-amber-100 px-5 py-3 rounded-t-2xl">
              <h2 className="text-lg font-bold text-amber-900 flex items-center">
                <Flame className="w-5 h-5 mr-2 text-amber-500" />
                Currently Cooking
              </h2>
              <span className="bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
                {preparingOrders.length}
              </span>
            </div>
            <div className="flex-1 bg-slate-100/50 border-x border-b border-slate-200/60 rounded-b-2xl p-4 overflow-y-auto hide-scrollbar space-y-4 shadow-inner">
              {preparingOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Flame className="w-12 h-12 mb-3 text-slate-300 opacity-50" />
                  <p className="font-medium text-sm">No orders currently cooking</p>
                </div>
              ) : preparingOrders.map((order) => {
                const isDelivery = order.customer_note?.includes('DELIVERY ADDRESS:');
                const locationLabel = isDelivery 
                  ? order.customer_note.replace('DELIVERY ADDRESS:', '').trim()
                  : order.rooms?.room_number ? `Room ${order.rooms.room_number}` : 'Unknown Location';

                return (
                  <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                    
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900 text-lg">Order #{order.id.split('-')[0].toUpperCase()}</span>
                          <span className="flex h-2.5 w-2.5 relative ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                          </span>
                        </div>
                        <div className="flex items-start space-x-1.5 mt-1 text-slate-500 font-medium text-sm">
                          <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <span className="leading-tight">{locationLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100 ml-2">
                      <ul className="space-y-2.5">
                        {order.order_items?.map((item: any) => (
                          <li key={item.id} className="flex items-start">
                            <span className="font-black text-amber-600 w-6 shrink-0">{item.quantity}x</span>
                            <span className="font-semibold text-slate-800 line-through decoration-slate-300 decoration-2">{item.menu_items?.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <form action={async () => { 'use server'; await updateOrderStatus(order.id, 'READY'); }} className="ml-2">
                      <Button className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all text-base flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 mr-2" /> Mark as Ready
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
