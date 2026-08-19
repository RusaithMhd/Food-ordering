import { createAdminClient } from '@/lib/supabase/server';
import { ShoppingBag, UtensilsCrossed, Users, Store, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const supabase = await createAdminClient();
  
  // Fetch high level stats
  const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: menuItemsCount } = await supabase.from('menu_items').select('*', { count: 'exact', head: true });
  const { count: branchesCount } = await supabase.from('branches').select('*', { count: 'exact', head: true });
  const { count: staffCount } = await supabase.from('user_roles').select('*', { count: 'exact', head: true });
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1.5 font-medium">Overview of your hotel ordering platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Orders Stat */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="w-16 h-16 text-indigo-600 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
            Total Orders
          </h3>
          <p className="text-4xl font-black text-slate-900">{ordersCount || 0}</p>
          <div className="mt-4 flex items-center text-sm font-medium text-emerald-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+12% this week</span>
          </div>
        </div>

        {/* Menu Items Stat */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <UtensilsCrossed className="w-16 h-16 text-amber-500 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
            Menu Items
          </h3>
          <p className="text-4xl font-black text-slate-900">{menuItemsCount || 0}</p>
          <div className="mt-4 flex items-center text-sm font-medium text-slate-400">
            Across all categories
          </div>
        </div>

        {/* Branches Stat */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Store className="w-16 h-16 text-emerald-500 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
            Active Kitchens
          </h3>
          <p className="text-4xl font-black text-slate-900">{branchesCount || 0}</p>
          <div className="mt-4 flex items-center text-sm font-medium text-slate-400">
            Operational locations
          </div>
        </div>

        {/* Staff Stat */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-rose-500 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
            Staff Members
          </h3>
          <p className="text-4xl font-black text-slate-900">{staffCount || 0}</p>
          <div className="mt-4 flex items-center text-sm font-medium text-slate-400">
            Registered accounts
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Quick Actions Panel */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/orders" className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-indigo-600 transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-indigo-900 transition-colors">Manage Orders</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:-rotate-45 transition-all" />
            </Link>

            <Link href="/admin/menu" className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-indigo-600 transition-colors">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-indigo-900 transition-colors">Manage Menu</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:-rotate-45 transition-all" />
            </Link>
            
            <Link href="/admin/branches" className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-indigo-600 transition-colors">
                  <Store className="w-5 h-5" />
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-indigo-900 transition-colors">Kitchens</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:-rotate-45 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sparkles Icon component (inline to avoid extra imports if it's missing from lucide)
function Sparkles(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
