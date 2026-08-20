import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OrderHistoryClient } from './OrderHistoryClient';
import { getUser } from '@/lib/auth/getUser';

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

export default async function MyOrdersPage() {
  const { user } = await getUser();

  if (!user) redirect('/login');

  const orders = await getMyOrders(user.uid);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-8 md:pt-12 pb-24 font-sans selection:bg-indigo-200 selection:text-indigo-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 px-2">My Orders</h1>
          <p className="text-slate-500 mt-1 font-medium px-2">Track your recent food deliveries.</p>
        </div>

        <OrderHistoryClient initialOrders={orders} />
      </div>
    </div>
  );
}
