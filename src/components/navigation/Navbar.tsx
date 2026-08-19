'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthProvider';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { Hotel, ChefHat, Bike, LayoutDashboard, ShoppingBag, LogOut, LogIn, Menu as MenuIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getActiveOrdersStatus } from '@/actions/orders/get-active-orders';

export function Navbar() {
  const { user, userRole, loading } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [toast, setToast] = useState<{ show: boolean; status: string; total: number } | null>(null);

  useEffect(() => {
    if (!user) return;

    let previousStatuses: { [orderId: string]: string } = {};
    let isInitial = true;

    const pollOrders = async () => {
      try {
        const res = await getActiveOrdersStatus();
        if (res.success && res.orders) {
          res.orders.forEach((order: any) => {
            const prevStatus = previousStatuses[order.id];
            if (!isInitial && prevStatus && prevStatus !== order.status) {
              setToast({ show: true, status: order.status, total: order.total });
            }
            previousStatuses[order.id] = order.status;
          });
          isInitial = false;
        }
      } catch (err) {
        console.error('Error polling order statuses:', err);
      }
    };

    pollOrders();
    const interval = setInterval(pollOrders, 6000); // Poll every 6 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Auto-hide toast when it appears
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Hide the navbar inside the admin dashboard as it has its own sidebar
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  if (!mounted) {
    return <div className="h-14 md:h-16 w-full" />; // Placeholder to prevent layout shift
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsMobileMenuOpen(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error', error);
    }
  };

  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MANAGER';
  const isKitchen = isAdmin || userRole === 'KITCHEN';
  const isDelivery = isAdmin || userRole === 'DELIVERY';

  const renderNavLinks = (mobile = false) => (
    <>
      {!loading && (
        <>
          {user && (
            <Link 
              href="/orders" 
              onClick={() => mobile && setIsMobileMenuOpen(false)}
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-semibold", pathname === '/orders' && "bg-slate-100 text-slate-900")}
            >
              <ShoppingBag className="w-5 h-5 mr-3 md:w-4 md:h-4 md:mr-2" />
              My Orders
            </Link>
          )}
          
          {isKitchen && (
            <Link 
              href="/kitchen" 
              onClick={() => mobile && setIsMobileMenuOpen(false)}
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-semibold", pathname === '/kitchen' && "bg-slate-100 text-slate-900")}
            >
              <ChefHat className="w-5 h-5 mr-3 md:w-4 md:h-4 md:mr-2" />
              Kitchen
            </Link>
          )}

          {isDelivery && (
            <Link 
              href="/delivery" 
              onClick={() => mobile && setIsMobileMenuOpen(false)}
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-semibold", pathname === '/delivery' && "bg-slate-100 text-slate-900")}
            >
              <Bike className="w-5 h-5 mr-3 md:w-4 md:h-4 md:mr-2" />
              Delivery
            </Link>
          )}

          {isAdmin && (
            <Link 
              href="/admin" 
              onClick={() => mobile && setIsMobileMenuOpen(false)}
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl font-semibold")}
            >
              <LayoutDashboard className="w-5 h-5 mr-3 md:w-4 md:h-4 md:mr-2" />
              Admin
            </Link>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="sticky top-0 md:top-4 z-40 w-full mx-auto max-w-7xl md:px-4 sm:px-6 lg:px-8 mb-4 md:mb-6 pointer-events-none">
      <nav className="flex w-full h-14 md:h-16 items-center justify-between md:rounded-2xl bg-white/80 md:bg-white/70 backdrop-blur-md border-b md:border border-slate-200/60 md:border-white/40 shadow-sm px-4 md:px-6 pointer-events-auto transition-all duration-300 hover:bg-white/90">
        
        <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex bg-slate-900 p-1.5 md:p-2 rounded-xl group-hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-900/10">
                <Hotel className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <span className="font-extrabold text-lg md:text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                HotelEats
              </span>
            </Link>

            <div className="hidden md:flex ml-8 space-x-1 min-h-[40px] items-center">
              {renderNavLinks()}
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 rounded-full px-2 md:px-3 py-1">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                        <span className="text-[10px] font-bold text-indigo-700">{user.email?.charAt(0).toUpperCase() || 'U'}</span>
                      </div>
                      <span className="hidden sm:inline-block text-sm font-medium text-slate-600 truncate max-w-[100px]">
                        {user.displayName || user.email?.split('@')[0]}
                      </span>
                    </div>
                    <Button onClick={handleSignOut} variant="ghost" size="icon" className="hidden md:flex rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Link href="/login" className={cn(buttonVariants(), "rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 font-bold px-4 md:px-4 h-9 md:h-10 text-xs md:text-sm")}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                )}
              </>
            )}
          </div>
      </nav>

      {/* Real-time Order Status Notification Toast */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-full md:max-w-sm z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-2xl flex items-start space-x-4 w-full relative overflow-hidden backdrop-blur-xl bg-opacity-95">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
            <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <ShoppingBag className="w-5 h-5 animate-bounce text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-sm font-bold text-slate-100">Order Status Update!</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Your order of <strong className="text-indigo-400">LKR {Number(toast.total).toFixed(2)}</strong> is now <span className="font-extrabold text-white bg-indigo-600 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase ml-1">{toast.status.replace(/_/g, ' ')}</span>.
              </p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
