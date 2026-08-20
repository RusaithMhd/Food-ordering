'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Menu as MenuIcon, Users, Tags, Map, ShoppingBag, Settings } from 'lucide-react';

export function AdminSidebarNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/zones', label: 'Delivery Zones', icon: Map },
    { href: '/admin/categories', label: 'Categories', icon: Tags },
    { href: '/admin/menu', label: 'Menu Management', icon: MenuIcon },
    { href: '/admin/staff', label: 'Staff & Users', icon: Users },
    { href: '/admin/settings', label: 'Hotel Settings', icon: Settings },
  ];

  return (
    <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 hide-scrollbar">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || (link.href !== '/admin' && pathname?.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center space-x-3.5 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm relative group",
              isActive 
                ? "bg-indigo-600/10 text-indigo-400 border-l-[3.5px] border-indigo-500 shadow-md shadow-indigo-500/5" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className={cn("h-5 w-5 transition-colors duration-300", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-350")} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
