'use client';

import { useAuth } from '@/features/auth/AuthProvider';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, Mail, LogOut, ChevronRight, ShoppingBag, MapPin, CreditCard, Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center pb-24">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your account...</p>
      </div>
    );
  }

  const menuItems = [
    { icon: ShoppingBag, label: 'My Orders', href: '/orders', color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { icon: MapPin, label: 'Saved Addresses', href: '#', color: 'text-emerald-500', bg: 'bg-emerald-100' },
    { icon: CreditCard, label: 'Payment Methods', href: '#', color: 'text-amber-500', bg: 'bg-amber-100' },
    { icon: Bell, label: 'Notifications', href: '#', color: 'text-rose-500', bg: 'bg-rose-100' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans selection:bg-indigo-200 selection:text-indigo-900">
      <div className="max-w-2xl mx-auto px-4 pt-6 md:pt-10">
        
        {/* Header */}
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-6 px-2">My Account</h1>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8 flex items-center space-x-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-transparent rounded-full -mr-10 -mt-10 blur-2xl" />
          
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-md relative z-10">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-indigo-700">{user.email?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>
          
          <div className="flex-1 relative z-10">
            <h2 className="text-xl font-bold text-slate-900 mb-1">{user.displayName || 'Food Lover'}</h2>
            <div className="flex items-center text-slate-500 text-sm font-medium">
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              {user.email}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
          {menuItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.href}
              className={`flex items-center justify-between p-5 hover:bg-slate-50 transition-colors ${index !== menuItems.length - 1 ? 'border-b border-slate-50' : ''}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.bg}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="font-semibold text-slate-700">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </Link>
          ))}
        </div>

        {/* Sign Out Button */}
        <Button 
          variant="outline" 
          onClick={handleSignOut}
          className="w-full h-14 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-bold text-base transition-all flex items-center justify-center shadow-sm"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>

      </div>
    </div>
  );
}
