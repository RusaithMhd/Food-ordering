import { ReactNode } from 'react';
import Link from 'next/link';
import { getUser } from '@/lib/auth/getUser';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Menu as MenuIcon, Store, Users, Tags, Map, ShoppingBag } from 'lucide-react';

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
    <div className="flex flex-col md:flex-row h-screen bg-[#FAFAFA] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between h-16 bg-slate-950 px-4 shrink-0 shadow-sm z-30">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-white">Admin Panel</h1>
        </div>
        <Link href="/" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-md bg-white/10">
          Exit
        </Link>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-950 text-slate-300 flex-col shadow-2xl z-20 shrink-0">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe px-1">
        <Link href="/admin" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-indigo-600 transition-colors">
          <LayoutDashboard className="h-[22px] w-[22px] mb-1" />
          <span className="text-[9px] font-bold tracking-tight">Home</span>
        </Link>
        <Link href="/admin/orders" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-indigo-600 transition-colors">
          <ShoppingBag className="h-[22px] w-[22px] mb-1" />
          <span className="text-[9px] font-bold tracking-tight">Orders</span>
        </Link>
        <Link href="/admin/zones" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-indigo-600 transition-colors">
          <Map className="h-[22px] w-[22px] mb-1" />
          <span className="text-[9px] font-bold tracking-tight">Zones</span>
        </Link>
        <Link href="/admin/categories" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-indigo-600 transition-colors">
          <Tags className="h-[22px] w-[22px] mb-1" />
          <span className="text-[9px] font-bold tracking-tight">Categories</span>
        </Link>
        <Link href="/admin/menu" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-indigo-600 transition-colors">
          <MenuIcon className="h-[22px] w-[22px] mb-1" />
          <span className="text-[9px] font-bold tracking-tight">Menu</span>
        </Link>
        <Link href="/admin/staff" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-indigo-600 transition-colors">
          <Users className="h-[22px] w-[22px] mb-1" />
          <span className="text-[9px] font-bold tracking-tight">Staff</span>
        </Link>
      </nav>
    </div>
  );
}
