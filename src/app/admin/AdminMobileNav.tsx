'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Map, Tags, Menu as MenuIcon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminMobileNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Home', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/zones', label: 'Zones', icon: Map },
    { href: '/admin/categories', label: 'Categories', icon: Tags },
    { href: '/admin/menu', label: 'Menu', icon: MenuIcon },
    { href: '/admin/staff', label: 'Staff', icon: Users },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 flex justify-around items-center h-16 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] pb-safe px-2 pointer-events-auto">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative",
              isActive 
                ? "text-indigo-600 scale-[1.05]" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {isActive && (
              <span className="absolute top-0 w-8 h-1 bg-indigo-600 rounded-full" />
            )}
            <Icon className={cn("h-5 w-5 mb-1", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
            <span className="text-[9px] font-bold tracking-tight">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
