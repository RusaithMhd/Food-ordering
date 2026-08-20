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
        <h1 className="text-3xl font-black tracking-tight text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1.5 font-medium">Overview of your hotel ordering platform.</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue */}
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl shadow-md border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-16 h-16 text-emerald-400 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Total Revenue
            </h3>
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">LKR {lifetimeRevenue.toFixed(2)}</p>
          <div className="mt-4 flex items-center text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/10 w-fit">
            <TrendingUp className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
            <span>DELIVERED ORDERS</span>
          </div>
        </div>

        {/* Orders Stat */}
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl shadow-md border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingBag className="w-16 h-16 text-indigo-400 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Total Orders
            </h3>
            <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{ordersCount}</p>
          <div className="mt-4 flex items-center text-xs font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/10 w-fit">
            <Activity className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
            <span>LIFETIME COUNT</span>
          </div>
        </div>

        {/* Menu Items Stat */}
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl shadow-md border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <UtensilsCrossed className="w-16 h-16 text-amber-400 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Menu Items
            </h3>
            <div className="bg-amber-500/10 p-2 rounded-xl text-amber-400">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{menuItemsCount}</p>
          <div className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Across all categories
          </div>
        </div>

        {/* Branches Stat */}
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl shadow-md border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Store className="w-16 h-16 text-rose-400 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Active Kitchens
            </h3>
            <div className="bg-rose-500/10 p-2 rounded-xl text-rose-400">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{branchesCount}</p>
          <div className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Operational locations
          </div>
        </div>
      </div>

      {/* Analytics & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Card */}
        <div className="bg-slate-900/50 backdrop-blur-md p-6 md:p-8 rounded-[2rem] shadow-md border border-slate-800/80 lg:col-span-2">
          <h3 className="text-lg font-black text-white mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-400" />
            Weekly Revenue Trend
          </h3>
          <div className="w-full h-[180px] flex flex-col justify-between select-none">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#1e293b/60" strokeWidth="1" strokeDasharray="3 3" />
              <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#1e293b/60" strokeWidth="1" strokeDasharray="3 3" />
              <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#334155/60" strokeWidth="1.5" />

              {/* Area path */}
              <path
                d={`M ${paddingX} ${chartHeight - paddingY} L ${points} L ${chartWidth - paddingX} ${chartHeight - paddingY} Z`}
                fill="url(#chartGradient)"
              />
              
              {/* Line path with glow filter */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                filter="url(#glow)"
              />

              {/* Data dots */}
              {dailyData.map((d, index) => {
                const x = paddingX + (index * (chartWidth - paddingX * 2)) / 6;
                const y = chartHeight - paddingY - (d.sales / maxSales) * (chartHeight - paddingY * 2);
                return (
                  <g key={index} className="group/dot cursor-pointer">
                    <circle cx={x} cy={y} r="5.5" fill="#0f172a" stroke="#818cf8" strokeWidth="3" />
                    <circle cx={x} cy={y} r="10" fill="#6366f1" opacity="0" className="hover:opacity-25 transition-all duration-300" />
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
                    fontWeight="800"
                    className="uppercase tracking-wider"
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
          <div className="bg-slate-900/50 backdrop-blur-md p-6 md:p-8 rounded-[2rem] shadow-md border border-slate-800/80 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div>
              <h3 className="text-lg font-black text-white mb-6 flex items-center">
                Quick Actions
              </h3>
              <div className="space-y-3.5">
                <Link href="/admin/orders" className="group flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-950 transition-all duration-300">
                  <div className="flex items-center space-x-3.5">
                    <div className="bg-slate-900 p-2 rounded-xl text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors duration-300">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-350 group-hover:text-white transition-colors">Manage Orders</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:-rotate-45 transition-all duration-300" />
                </Link>

                <Link href="/admin/menu" className="group flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-950 transition-all duration-300">
                  <div className="flex items-center space-x-3.5">
                    <div className="bg-slate-900 p-2 rounded-xl text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors duration-300">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-350 group-hover:text-white transition-colors">Manage Menu</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:-rotate-45 transition-all duration-300" />
                </Link>
              </div>
            </div>
            <div className="text-xs text-slate-500 font-extrabold uppercase tracking-widest mt-6 pt-4 border-t border-slate-850">
              Support Center
            </div>
          </div>

          {/* Kitchen Closing Times Panel */}
          {branch && (
            <div className="bg-slate-900/50 backdrop-blur-md p-6 md:p-8 rounded-[2rem] shadow-md border border-slate-800/80 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-rose-500" />
              <div>
                <h3 className="text-lg font-black text-white mb-2 flex items-center">
                  <Clock className="w-5 h-5 mr-2.5 text-amber-400" />
                  Closing Settings
                </h3>
                <p className="text-slate-400 text-xs mb-5 font-semibold leading-relaxed">Set active kitchen closing limits. The times persist permanently.</p>
                
                <form action={async (fd) => { 'use server'; await updateKitchenClosingTimes(fd); }} className="space-y-4">
                  <input type="hidden" name="branch_id" value={branch.id} />
                  
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider pl-1">Breakfast Close</label>
                    <input 
                      type="time" 
                      name="closing_breakfast" 
                      defaultValue={parseClosingTimes(branch.timezone).breakfast}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider pl-1">Lunch Close</label>
                    <input 
                      type="time" 
                      name="closing_lunch" 
                      defaultValue={parseClosingTimes(branch.timezone).lunch}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider pl-1">Dinner Close</label>
                    <input 
                      type="time" 
                      name="closing_dinner" 
                      defaultValue={parseClosingTimes(branch.timezone).dinner}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-white"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs active:scale-[0.98] transition-all border border-slate-850 mt-2 shadow-sm">
                    Save Closing Times
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-[2rem] border border-slate-800/80 shadow-md overflow-hidden">
        <div className="p-6 border-b border-slate-850 flex items-center justify-between bg-slate-950/30">
          <h3 className="font-extrabold text-white text-lg">Recent Orders</h3>
          <Link href="/admin/orders" className="text-indigo-450 hover:text-indigo-400 text-sm font-black flex items-center group">
            View All <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-950/40 text-xs font-black text-slate-400 uppercase tracking-widest select-none">
                <th className="px-6 py-4 font-bold">Order Details</th>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Items</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50 text-sm">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-semibold">
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
                    <tr key={order.id} className="hover:bg-slate-900/10 transition-colors duration-300">
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-white uppercase tracking-wider text-xs">#{order.id.split('-')[0]}</span>
                          <div className="flex items-center text-xs text-slate-500 mt-1 font-bold">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {new Date(order.placed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
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
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col text-slate-400 text-xs font-semibold space-y-0.5">
                          {order.order_items?.map((item: any, i: number) => (
                            <div key={i}>{item.quantity}x {item.menu_items?.name}</div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                      </td>
                      <td className="px-6 py-4.5 text-right">
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
        <div className="md:hidden divide-y divide-slate-850">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-semibold text-sm">
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
                <div key={order.id} className="p-4 space-y-3 hover:bg-slate-900/10 transition-colors duration-300">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-white uppercase text-xs">#{order.id.split('-')[0]}</span>
                    <span className="font-black text-white">LKR {Number(order.total).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-bold flex items-center justify-between">
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
