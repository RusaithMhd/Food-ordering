import { createAdminClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await createAdminClient();
  
  // Fetch some high level stats
  const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: menuItemsCount } = await supabase.from('menu_items').select('*', { count: 'exact', head: true });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your hotel ordering platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{ordersCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Menu Items</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{menuItemsCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 bg-blue-50 border-blue-100">
          <h3 className="text-sm font-medium text-blue-800">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <a href="/admin/menu" className="block text-sm text-blue-600 hover:underline">→ Manage Menu Items</a>
            <a href="/admin/branches" className="block text-sm text-blue-600 hover:underline">→ View Branches</a>
          </div>
        </div>
      </div>
    </div>
  );
}
