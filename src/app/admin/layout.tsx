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
    <div className="flex h-screen bg-[#FAFAFA] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shadow-2xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-white">Admin Panel</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 hide-scrollbar">
          <Link href="/admin" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 hover:text-white font-medium group">
            <LayoutDashboard className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/branches" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 hover:text-white font-medium group">
            <Store className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Branches &amp; Rooms</span>
          </Link>
          <Link href="/admin/menu" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 hover:text-white font-medium group">
            <MenuIcon className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Menu Management</span>
          </Link>
          <Link href="/admin/staff" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 hover:text-white font-medium group">
            <Users className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Staff &amp; Users</span>
          </Link>
        </nav>

        <div className="p-5 border-t border-white/10 bg-slate-900/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
              <span className="text-xs font-bold text-white">{userRole.charAt(0)}</span>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Role</div>
              <div className="text-sm font-bold text-white leading-tight">{userRole}</div>
            </div>
          </div>
          <Link href="/" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center">
            <span className="mr-1">←</span> Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
