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
import { useState } from 'react';

export function Navbar() {
  const { user, userRole, loading } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide the navbar inside the admin dashboard as it has its own sidebar
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsMobileMenuOpen(false);
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
    <div className="sticky top-2 md:top-4 z-50 mx-auto max-w-7xl px-2 md:px-4 sm:px-6 lg:px-8 mb-6 pointer-events-none">
      <nav className="flex h-16 items-center justify-between rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-sm px-4 pointer-events-auto transition-all duration-300 hover:bg-white/90">
        
        <div className="flex items-center">
            {/* Mobile Menu Trigger */}
            <div className="md:hidden mr-2">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger render={<Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100 rounded-xl" />}>
                  <MenuIcon className="h-5 w-5" />
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 bg-white">
                  <SheetHeader className="p-6 text-left border-b border-slate-100">
                    <SheetTitle className="flex items-center space-x-2">
                      <div className="bg-slate-900 p-2 rounded-xl shadow-lg shadow-slate-900/10">
                        <Hotel className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-extrabold text-lg tracking-tight text-slate-900">
                        Menu
                      </span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="p-4 flex flex-col space-y-2">
                    {renderNavLinks(true)}
                    
                    {!loading && user && (
                       <Button onClick={handleSignOut} variant="ghost" className="justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-semibold mt-4">
                         <LogOut className="w-5 h-5 mr-3" />
                         Sign Out
                       </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <Link href="/" className="flex items-center space-x-2 group">
              <div className="hidden md:flex bg-slate-900 p-2 rounded-xl group-hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-900/10">
                <Hotel className="h-5 w-5 text-white" />
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
    </div>
  );
}
