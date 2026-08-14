import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/server';
import { redirect } from 'next/navigation';
import { Clock, Package, CheckCircle2, ChevronRight, MapPin, ChefHat, Info } from 'lucide-react';
import Link from 'next/link';

async function getMyOrders(uid: string) {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      branches ( name ),
      order_items (
        quantity,
        total_price,
        menu_items ( name, image_url )
      )
    `)
    .eq('customer_id', uid)
    .order('placed_at', { ascending: false });

  return data || [];
}

export default async function MyOrdersPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('__session')?.value;

  if (!session) {
    redirect('/login');
  }

  let uid = '';
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    uid = decoded.uid;
  } catch (error) {
    redirect('/login');
  }

  const orders = await getMyOrders(uid);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Orders</h1>
          <p className="text-slate-500 mt-2 font-medium">Track your recent food deliveries.</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No orders yet</h3>
            <p className="text-slate-500 mb-6">Looks like you haven't placed any delivery orders yet.</p>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-colors">
              Browse Kitchens
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isActive = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
              const isDeliveryAddress = order.customer_note?.includes('DELIVERY ADDRESS:');
              const addressText = isDeliveryAddress 
                ? order.customer_note.replace('DELIVERY ADDRESS:', '').trim() 
                : order.customer_note || 'N/A';

              return (
                <div key={order.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className={`p-6 border-b border-slate-100 ${isActive ? 'bg-indigo-50/50' : 'bg-white'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="font-bold text-slate-900 text-lg">{order.branches?.name}</span>
                          <span className={`px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-full border ${
                            order.status === 'PLACED' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            order.status === 'PREPARING' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            order.status === 'READY' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {order.status === 'READY' ? 'OUT FOR DELIVERY' : order.status}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-slate-500 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          {new Date(order.placed_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900">${order.total.toFixed(2)}</div>
                        <div className="text-xs font-semibold text-slate-400 mt-1">Cash on Delivery</div>
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100">
                      <div className="relative">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-200">
                          <div style={{ width: 
                            order.status === 'PLACED' ? '25%' :
                            order.status === 'PREPARING' ? '50%' :
                            order.status === 'READY' ? '75%' : '100%'
                          }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                            order.status === 'PLACED' ? 'bg-blue-500' :
                            order.status === 'PREPARING' ? 'bg-amber-500' :
                            order.status === 'READY' ? 'bg-purple-500' : 'bg-emerald-500'
                          } transition-all duration-1000`}></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 px-1">
                          <span className={order.status === 'PLACED' ? 'text-blue-600' : ''}>Accepted</span>
                          <span className={order.status === 'PREPARING' ? 'text-amber-600' : ''}>Cooking</span>
                          <span className={order.status === 'READY' ? 'text-purple-600' : ''}>On the way</span>
                          <span className={order.status === 'DELIVERED' ? 'text-emerald-600' : ''}>Delivered</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="space-y-4">
                      {order.order_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                            {item.menu_items?.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.menu_items.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-300">IMG</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-900 text-sm">
                              {item.quantity}x {item.menu_items?.name}
                            </div>
                          </div>
                          <div className="font-semibold text-slate-700 text-sm">
                            ${item.total_price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-start space-x-3">
                      <div className="mt-0.5 bg-indigo-50 p-1.5 rounded-lg text-indigo-500">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Delivery Destination</div>
                        <div className="text-sm font-medium text-slate-900">{addressText}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
