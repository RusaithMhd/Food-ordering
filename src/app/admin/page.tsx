import { createAdminClient } from '@/lib/supabase/server';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  Users, 
  Store, 
  ArrowRight, 
  TrendingUp, 
  DollarSign,
  Activity,
  Calendar,
  Clock,
  Phone,
  User as UserIcon,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { OrderStatusSelect } from './orders/OrderStatusSelect';
import { updateKitchenClosingTimes } from '@/actions/admin/branches';
import { parseClosingTimes } from '@/utils/closingTimes';
import { Button } from '@/components/ui/button';

export const revalidate = 0; // Disable caching so it's always live

async function getDashboardData() {
  const supabase = await createAdminClient();
  
  // 1. High level stats counts
  const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: menuItemsCount } = await supabase.from('menu_items').select('*', { count: 'exact', head: true });
  const { count: branchesCount } = await supabase.from('branches').select('*', { count: 'exact', head: true });
  const { count: staffCount } = await supabase.from('user_roles').select('*', { count: 'exact', head: true });
  
  // 2. Fetch all delivered orders to calculate revenue
  const { data: deliveredOrders } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'DELIVERED');
  
  const lifetimeRevenue = (deliveredOrders || []).reduce((sum, o) => sum + Number(o.total), 0);

  // 3. Fetch orders from the last 7 days for the chart
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: weeklyOrders } = await supabase
    .from('orders')
    .select('total, placed_at, status')
    .gte('placed_at', sevenDaysAgo.toISOString());

  // 4. Fetch the 5 most recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      status,
      placed_at,
      delivery_address_snapshot,
      profiles:customer_id (
        full_name,
        phone_number
      ),
      order_items (
        quantity,
        menu_items (
          name
        )
      )
    `)
    .order('placed_at', { ascending: false })
    .limit(5);

  // 5. Fetch default branch for closing times settings
  const { data: branches } = await supabase.from('branches').select('id, name, timezone').limit(1);
  const branch = branches?.[0] || null;

  return {
    ordersCount: ordersCount || 0,
    menuItemsCount: menuItemsCount || 0,
    branchesCount: branchesCount || 0,
    staffCount: staffCount || 0,
    lifetimeRevenue,
    weeklyOrders: weeklyOrders || [],
    recentOrders: recentOrders || [],
    branch
  };
}

export default async function AdminDashboardPage() {
  const {
    ordersCount,
    menuItemsCount,
    branchesCount,
    staffCount,
    lifetimeRevenue,
    weeklyOrders,
    recentOrders,
    branch
  } = await getDashboardData();

  // Process chart data for the last 7 days
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailySalesMap: Record<string, number> = {};
  
  // Initialize daily sales map for the last 7 days chronologically
  const chartDays: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = daysOfWeek[d.getDay()];
    dailySalesMap[dayName] = 0;
    chartDays.push(dayName);
  }
  
  weeklyOrders.forEach(order => {
    if (order.status === 'DELIVERED') {
      const dayName = daysOfWeek[new Date(order.placed_at).getDay()];
      if (dayName in dailySalesMap) {
        dailySalesMap[dayName] += Number(order.total);
      }
    }
  });

  const dailyData = chartDays.map(day => ({
    day,
    sales: dailySalesMap[day]
  }));

  // Chart configuration
  const maxSales = Math.max(...dailyData.map(d => d.sales), 100);
  const chartHeight = 140;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;

  const points = dailyData.map((d, index) => {
    const x = paddingX + (index * (chartWidth - paddingX * 2)) / 6;
    const y = chartHeight - paddingY - (d.sales / maxSales) * (chartHeight - paddingY * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 selection:bg-indigo-500/20 selection:text-indigo-200">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1.5 font-medium">Overview of your hotel ordering platform.</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-16 h-16 text-emerald-400 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Total Revenue
          </h3>
          <p className="text-3xl font-black text-white">LKR {lifetimeRevenue.toFixed(2)}</p>
          <div className="mt-4 flex items-center text-sm font-bold text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10 w-fit">
            <TrendingUp className="w-4 h-4 mr-1.5" />
            <span>Delivered orders</span>
          </div>
        </div>

        {/* Orders Stat */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingBag className="w-16 h-16 text-indigo-400 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Total Orders
          </h3>
          <p className="text-3xl font-black text-white">{ordersCount}</p>
          <div className="mt-4 flex items-center text-sm font-bold text-indigo-400 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10 w-fit">
            <Activity className="w-4 h-4 mr-1.5 animate-pulse" />
            <span>Lifetime count</span>
          </div>
        </div>

        {/* Menu Items Stat */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <UtensilsCrossed className="w-16 h-16 text-amber-400 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Menu Items
          </h3>
          <p className="text-3xl font-black text-white">{menuItemsCount}</p>
          <div className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Across all categories
          </div>
        </div>

        {/* Branches Stat */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 hover:border-slate-700 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Store className="w-16 h-16 text-rose-400 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Active Kitchens
          </h3>
          <p className="text-3xl font-black text-white">{branchesCount}</p>
          <div className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Operational locations
          </div>
        </div>
      </div>

      {/* Analytics & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Card */}
        <div className="bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-800 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-400" />
            Weekly Revenue Trend
          </h3>
          <div className="w-full h-[180px] flex flex-col justify-between">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#1e293b" strokeWidth="1" />
              <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#1e293b" strokeWidth="1" />
              <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#334155" strokeWidth="1" />

              {/* Area path */}
              <path
                d={`M ${paddingX} ${chartHeight - paddingY} L ${points} L ${chartWidth - paddingX} ${chartHeight - paddingY} Z`}
                fill="url(#chartGradient)"
              />
              
              {/* Line path */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />

              {/* Data dots */}
              {dailyData.map((d, index) => {
                const x = paddingX + (index * (chartWidth - paddingX * 2)) / 6;
                const y = chartHeight - paddingY - (d.sales / maxSales) * (chartHeight - paddingY * 2);
                return (
                  <g key={index} className="group/dot cursor-pointer">
                    <circle cx={x} cy={y} r="5" fill="#1e1b4b" stroke="#6366f1" strokeWidth="3" />
                    <circle cx={x} cy={y} r="8" fill="#6366f1" opacity="0" className="hover:opacity-20 transition-opacity" />
                  </g>
                );
              })}

              {/* Day Labels */}
              {dailyData.map((d, index) => {
                const x = paddingX + (index * (chartWidth - paddingX * 2)) / 6;
                return (
                  <text
                    key={index}
                    x={x}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {d.day}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Column: Quick Actions + Kitchen Closing Times */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions Panel */}
          <div className="bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link href="/admin/orders" className="group flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/20 hover:bg-slate-900 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-950 p-2 rounded-lg text-slate-400 group-hover:text-indigo-400 transition-colors">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-slate-300 group-hover:text-white transition-colors">Manage Orders</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:-rotate-45 transition-all" />
                </Link>

                <Link href="/admin/menu" className="group flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/20 hover:bg-slate-900 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-950 p-2 rounded-lg text-slate-400 group-hover:text-indigo-400 transition-colors">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-slate-300 group-hover:text-white transition-colors">Manage Menu</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:-rotate-45 transition-all" />
                </Link>
              </div>
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-6 pt-4 border-t border-slate-800/50">
              Need help? Contact support or consult documentation.
            </div>
          </div>

          {/* Kitchen Closing Times Panel */}
          {branch && (
            <div className="bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-800 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-rose-500" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-amber-400" />
                  Kitchen Closing Times
                </h3>
                <p className="text-slate-400 text-xs mb-5 font-medium">Set active kitchen closing limits. The times persist permanently.</p>
                
                <form action={async (fd) => { 'use server'; await updateKitchenClosingTimes(fd); }} className="space-y-4">
                  <input type="hidden" name="branch_id" value={branch.id} />
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Breakfast Close</label>
                    <input 
                      type="time" 
                      name="closing_breakfast" 
                      defaultValue={parseClosingTimes(branch.timezone).breakfast}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Lunch Close</label>
                    <input 
                      type="time" 
                      name="closing_lunch" 
                      defaultValue={parseClosingTimes(branch.timezone).lunch}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Dinner Close</label>
                    <input 
                      type="time" 
                      name="closing_dinner" 
                      defaultValue={parseClosingTimes(branch.timezone).dinner}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-white"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all">
                    Save Closing Times
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
          <h3 className="font-bold text-white text-lg">Recent Orders</h3>
          <Link href="/admin/orders" className="text-indigo-400 hover:text-indigo-300 text-sm font-bold flex items-center">
            View All Orders <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 font-bold">Order Details</th>
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Items</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                    No orders found.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order: any) => {
                  const snapshot = order.delivery_address_snapshot as any;
                  const recipientName = snapshot?.recipient_name || order.profiles?.full_name || 'Guest User';
                  const phone = snapshot?.phone || order.profiles?.phone_number || 'No phone';
                  const addressLine = snapshot?.address_line1
                    ? `${snapshot.address_line1}${snapshot.address_line2 ? `, ${snapshot.address_line2}` : ''}`
                    : null;

                  return (
                    <tr key={order.id} className="hover:bg-slate-950/20 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-white uppercase">#{order.id.split('-')[0]}</span>
                          <div className="flex items-center text-xs text-slate-500 mt-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {new Date(order.placed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col space-y-1">
                          <span className="font-extrabold text-white flex items-center">
                            <UserIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                            {recipientName}
                          </span>
                          <span className="text-xs text-indigo-400 font-bold flex items-center bg-indigo-500/5 px-2 py-0.5 rounded-lg w-fit border border-indigo-500/10">
                            <Phone className="w-3 h-3 mr-1.5" />
                            {phone}
                          </span>
                          {addressLine && (
                            <span className="text-xs text-slate-400 font-semibold flex items-center mt-1">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[180px]" title={addressLine}>{addressLine}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col text-slate-400 text-xs font-medium space-y-0.5">
                          {order.order_items?.map((item: any, i: number) => (
                            <div key={i}>{item.quantity}x {item.menu_items?.name}</div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-black text-white">LKR {Number(order.total).toFixed(2)}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-800">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium text-sm">
              No orders found.
            </div>
          ) : (
            recentOrders.map((order: any) => {
              const snapshot = order.delivery_address_snapshot as any;
              const recipientName = snapshot?.recipient_name || order.profiles?.full_name || 'Guest User';
              const phone = snapshot?.phone || order.profiles?.phone_number || 'No phone';
              const addressLine = snapshot?.address_line1
                ? `${snapshot.address_line1}${snapshot.address_line2 ? `, ${snapshot.address_line2}` : ''}`
                : null;

              return (
                <div key={order.id} className="p-4 space-y-3 hover:bg-slate-950/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white uppercase">#{order.id.split('-')[0]}</span>
                    <span className="font-black text-white">LKR {Number(order.total).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {new Date(order.placed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                  </div>
                  <div className="text-sm font-semibold text-white flex flex-col space-y-1.5">
                    <span className="flex items-center font-extrabold text-white">
                      <UserIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                      {recipientName}
                    </span>
                    <span className="text-xs text-indigo-400 font-bold flex items-center bg-indigo-500/5 px-2 py-0.5 rounded-lg w-fit border border-indigo-500/10">
                      <Phone className="w-3.5 h-3.5 mr-1.5" />
                      {phone}
                    </span>
                    {addressLine && (
                      <span className="text-xs text-slate-400 font-medium flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-500 shrink-0" />
                        {addressLine}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                    {order.order_items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.menu_items?.name}</span>
                        <span className="font-bold">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
