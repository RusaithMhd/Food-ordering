'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCart } from '@/features/cart/CartContext';
import { Home, ShoppingBag, ShoppingCart, User, LogIn, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function MobileNav() {
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide the mobile nav inside the admin dashboard or on the login page
  if (pathname?.startsWith('/admin') || pathname === '/login') {
    return null;
  }

  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MANAGER';

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      href: '/',
      isActive: pathname === '/',
    },
    {
      label: 'Orders',
      icon: ShoppingBag,
      href: '/orders',
      isActive: pathname === '/orders',
      hide: !mounted || !user,
    },
    {
      label: 'Admin',
      icon: LayoutDashboard,
      href: '/admin',
      isActive: pathname?.startsWith('/admin'),
      hide: !mounted || !isAdmin,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 pb-safe shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-2 py-2 h-[68px]">
        
        {navItems.filter(item => !item.hide).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center justify-center w-16 h-full gap-1 active:scale-95 transition-transform"
          >
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
              item.isActive ? "bg-indigo-100 text-indigo-700" : "text-slate-500"
            )}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className={cn(
              "text-[10px] font-medium transition-colors",
              item.isActive ? "text-indigo-700 font-bold" : "text-slate-500"
            )}>
              {item.label}
            </span>
          </Link>
        ))}

        {/* Cart Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center w-16 h-full gap-1 active:scale-95 transition-transform relative"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 relative">
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium text-slate-500">
            Cart
          </span>
        </button>

        {/* Account / Login Button */}
        {mounted && !loading ? (
          <Link
            href={user ? "/account" : "/login"}
            className="flex flex-col items-center justify-center w-16 h-full gap-1 active:scale-95 transition-transform"
          >
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
              pathname === '/account' ? "bg-indigo-100 text-indigo-700" : "text-slate-500"
            )}>
              {user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </div>
            <span className={cn(
              "text-[10px] font-medium transition-colors",
              pathname === '/account' ? "text-indigo-700 font-bold" : "text-slate-500"
            )}>
              {user ? 'Account' : 'Sign In'}
            </span>
          </Link>
        ) : (
          <div className="flex flex-col items-center justify-center w-16 h-full gap-1 opacity-50">
            <div className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-slate-500">
              Account
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
