import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/server';
import { redirect } from 'next/navigation';
import { Clock, Package, MapPin, Phone, User, DollarSign, Bike } from 'lucide-react';
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
        unit_price,
        menu_items ( name, image_url )
      )
    `)
    .eq('customer_id', uid)
    .order('placed_at', { ascending: false });

  return data || [];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  PLACED:           { label: 'Order Placed',     color: 'bg-blue-500',    step: 1 },
  CONFIRMED:        { label: 'Confirmed',         color: 'bg-blue-600',    step: 1 },
  PREPARING:        { label: 'Cooking',           color: 'bg-amber-500',   step: 2 },
  READY:            { label: 'Out for Delivery',  color: 'bg-purple-500',  step: 3 },
  OUT_FOR_DELIVERY: { label: 'On the way',        color: 'bg-purple-600',  step: 3 },
  DELIVERED:        { label: 'Delivered',         color: 'bg-emerald-500', step: 4 },
  CANCELLED:        { label: 'Cancelled',         color: 'bg-rose-500',    step: 0 },
};

export default async function MyOrdersPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('__session')?.value;

  if (!session) redirect('/login');

  let uid = '';
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    uid = decoded.uid;
  } catch {
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
            <p className="text-slate-500 mb-6">Looks like you haven&apos;t placed any delivery orders yet.</p>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-colors">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isActive = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
              const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'bg-slate-500', step: 0 };
              const snapshot = order.delivery_address_snapshot as any;

              // Build address display
              const addressLine = snapshot?.address_line1
                ? `${snapshot.address_line1}${snapshot.address_line2 ? `, ${snapshot.address_line2}` : ''}`
                : null;
              const addressType = snapshot?.address_type?.replace(/_/g, ' ') ?? null;
              const recipientName = snapshot?.recipient_name ?? null;
              const phone = snapshot?.phone ?? null;
              const deliveryFee = snapshot?.delivery_fee ?? order.delivery_fee ?? 0;

              return (
                <div key={order.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">

                  {/* Header */}
                  <div className={`p-5 border-b border-slate-100 ${isActive ? 'bg-gradient-to-r from-indigo-50 to-blue-50/40' : 'bg-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <span className="font-bold text-slate-900 text-base">{order.branches?.name ?? 'Restaurant'}</span>
                          <span className={`px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-full text-white ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(order.placed_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-black text-slate-900">${order.total.toFixed(2)}</div>
                        <div className="text-xs font-semibold text-slate-400 mt-0.5">Cash on Delivery</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isActive && statusCfg.step > 0 && (
                    <div className="px-5 py-4 bg-slate-50/60 border-b border-slate-100">
                      <div className="overflow-hidden h-1.5 rounded-full bg-slate-200 mb-3">
                        <div
                          style={{ width: `${(statusCfg.step / 4) * 100}%` }}
                          className={`h-full rounded-full ${statusCfg.color} transition-all duration-700`}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 px-0.5">
                        {['Placed', 'Cooking', 'On the way', 'Delivered'].map((label, i) => (
                          <span key={label} className={statusCfg.step === i + 1 ? 'text-slate-700' : ''}>{label}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Items Ordered</p>
                    <div className="space-y-3 mb-5">
                      {order.order_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                            {item.menu_items?.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.menu_items.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-300">IMG</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 text-sm">
                              <span className="text-slate-500 font-bold mr-1">{item.quantity}x</span>
                              {item.menu_items?.name}
                            </div>
                            <div className="text-xs text-slate-400">${item.unit_price?.toFixed(2)} each</div>
                          </div>
                          <div className="font-bold text-slate-700 text-sm">${item.total_price.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Subtotal</span>
                        <span className="font-semibold text-slate-700">${order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium flex items-center">
                          <Bike className="w-3.5 h-3.5 mr-1.5" /> Delivery Fee
                        </span>
                        <span className="font-semibold text-slate-700">${Number(deliveryFee).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-900">Total</span>
                        <span className="font-black text-slate-900">${order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Delivery Details
                      </p>
                      {addressLine ? (
                        <div className="space-y-2">
                          {addressType && (
                            <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                              {addressType}
                            </span>
                          )}
                          <p className="text-sm font-semibold text-slate-900">{addressLine}</p>
                          <div className="flex flex-wrap gap-3 mt-1">
                            {recipientName && (
                              <div className="flex items-center text-xs text-slate-600 space-x-1">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold">{recipientName}</span>
                              </div>
                            )}
                            {phone && (
                              <div className="flex items-center text-xs text-slate-600 space-x-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-medium">{phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 font-medium italic">No delivery address recorded</p>
                      )}
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
