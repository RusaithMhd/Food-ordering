'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Map, Tags, Menu as MenuIcon, Users, Settings, BarChart3, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminMobileNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Home', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/delivery', label: 'Delivery', icon: Truck },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { href: '/admin/menu', label: 'Menu', icon: MenuIcon },
    { href: '/admin/staff', label: 'Staff', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 flex justify-around items-center h-16 z-50 shadow-[0_-10px_35px_rgba(0,0,0,0.4)] pb-safe px-2 pointer-events-auto">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || (link.href !== '/admin' && pathname?.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative",
              isActive 
                ? "text-indigo-400 scale-[1.05]" 
                : "text-slate-500 hover:text-slate-350"
            )}
          >
            {isActive && (
              <span className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse" />
            )}
            <Icon className={cn("h-5 w-5 mb-1", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
            <span className="text-[9px] font-black tracking-tight">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
