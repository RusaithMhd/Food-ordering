import { ReactNode } from 'react';
import Link from 'next/link';
import { getUser } from '@/lib/auth/getUser';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Menu as MenuIcon, Store, Users, Tags, Map, ShoppingBag, Settings } from 'lucide-react';
import { AdminMobileNav } from './AdminMobileNav';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { role } = await getUser();

  if (!role || (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'SUPER_ADMIN')) {
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

  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-slate-900 shrink-0 h-full">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center space-x-2.5">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Store className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 hide-scrollbar">
          <Link href="/admin" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 hover:text-white font-medium group">
            <LayoutDashboard className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 hover:text-white font-medium group">
            <ShoppingBag className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Orders</span>
          </Link>
          <Link href="/admin/zones" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 hover:text-white font-medium group">
            <Map className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Delivery Zones</span>
          </Link>
          <Link href="/admin/categories" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 hover:text-white font-medium group">
            <Tags className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Categories</span>
          </Link>
          <Link href="/admin/menu" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 hover:text-white font-medium group">
            <MenuIcon className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Menu Management</span>
          </Link>
          <Link href="/admin/staff" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 hover:text-white font-medium group">
            <Users className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Staff &amp; Users</span>
          </Link>
          <Link href="/admin/settings" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 hover:text-white font-medium group">
            <Settings className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Hotel Settings</span>
          </Link>
        </nav>

        <div className="p-5 border-t border-white/10 bg-slate-900/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
              <span className="text-xs font-bold text-white">{role?.charAt(0)}</span>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Role</div>
              <div className="text-sm font-bold text-white leading-tight">{role}</div>
            </div>
          </div>
          <Link href="/" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center">
            <span className="mr-1">←</span> Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminMobileNav />
    </div>
  );
}
