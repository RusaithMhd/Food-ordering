import { ReactNode } from 'react';
import Link from 'next/link';
import { getUser } from '@/lib/auth/getUser';
import { Store, ArrowLeft } from 'lucide-react';
import { AdminMobileNav } from './AdminMobileNav';
import { AdminSidebarNav } from './AdminSidebarNav';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { role } = await getUser();

  if (!role || (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center max-w-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
          <h1 className="text-2xl font-black text-red-500 mb-2">Access Denied</h1>
          <p className="text-slate-400 text-sm font-semibold mb-6">You do not have permission to access the admin dashboard.</p>
          <Link href="/" className="inline-block bg-white text-slate-950 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-200 transition-all duration-300">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Curated role avatar gradients
  const avatarGradient = 
    role === 'SUPER_ADMIN' ? 'from-purple-500 to-indigo-500 shadow-indigo-500/20' :
    role === 'ADMIN' ? 'from-indigo-500 to-blue-500 shadow-blue-500/20' :
    'from-blue-500 to-cyan-500 shadow-cyan-500/20';

  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-slate-900/40 backdrop-blur-xl shrink-0 h-full">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <Link href="/admin" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-tr from-indigo-500 to-violet-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/10 group-hover:scale-105 transition-transform duration-350">
              <Store className="h-5 w-5" />
            </div>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent group-hover:text-white transition-colors duration-300">Admin Console</span>
          </Link>
        </div>

        <AdminSidebarNav />

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-white/5 bg-slate-950/20">
          <div className="flex items-center space-x-3.5 mb-4">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br text-white flex items-center justify-center font-black text-sm uppercase shadow-md ${avatarGradient}`}>
              {role?.charAt(0)}
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none mb-1">Access Role</div>
              <div className="text-xs font-black text-white leading-tight">{role}</div>
            </div>
          </div>
          <Link href="/" className="text-xs font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors duration-300 flex items-center group pl-0.5">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5 transform group-hover:-translate-x-0.5 transition-transform" /> 
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 pb-24 md:pb-10 bg-gradient-to-b from-slate-900/10 to-slate-950">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminMobileNav />
    </div>
  );
}
