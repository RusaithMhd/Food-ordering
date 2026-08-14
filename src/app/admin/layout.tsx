import { ReactNode } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Menu as MenuIcon, Store, Users } from 'lucide-react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get('__session')?.value;

  if (!session) {
    redirect('/login?redirect=/admin');
  }

  let userRole = '';
  try {
    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    
    // Check role in Supabase
    const supabase = await createAdminClient();
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('roles ( name )')
      .eq('user_id', decodedToken.uid)
      .single();

    userRole = (userRoleData?.roles as any)?.name || '';
    
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'SUPER_ADMIN') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">You do not have permission to access the admin dashboard.</p>
            <Link href="/" className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800">
              Return Home
            </Link>
          </div>
        </div>
      );
    }
  } catch (error) {
    console.error('Admin layout auth error:', error);
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="font-bold text-xl tracking-tight text-gray-900">Admin Panel</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <Link href="/admin" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">
            <LayoutDashboard className="h-5 w-5 text-gray-500" />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/branches" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">
            <Store className="h-5 w-5 text-gray-500" />
            <span>Branches &amp; Rooms</span>
          </Link>
          <Link href="/admin/menu" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium bg-gray-100">
            <MenuIcon className="h-5 w-5 text-gray-900" />
            <span className="text-gray-900">Menu Management</span>
          </Link>
          <Link href="/admin/staff" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">
            <Users className="h-5 w-5 text-gray-500" />
            <span>Staff &amp; Users</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-900">Role: {userRole}</div>
          <Link href="/" className="text-xs text-blue-600 hover:underline mt-1 inline-block">Back to Customer View</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
