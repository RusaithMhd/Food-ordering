'use client';

import { useAuth } from '@/features/auth/AuthProvider';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, Mail, LogOut, ChevronRight, ShoppingBag, MapPin, ShieldCheck, Lock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { syncUserProfile, changeUserPassword } from '@/actions/auth/supabase';

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [deliveryDetails, setDeliveryDetails] = useState({
    name: '',
    phone: '',
    location: ''
  });
  const [isDeliverySheetOpen, setIsDeliverySheetOpen] = useState(false);

  // Security sheet states
  const [isSecuritySheetOpen, setIsSecuritySheetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const saved = localStorage.getItem('deliveryDetails');
    if (saved) {
      setDeliveryDetails(JSON.parse(saved));
    } else if (user) {
      setDeliveryDetails(prev => ({ ...prev, name: user.displayName || '' }));
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error', error);
    }
  };

  const handleSaveDeliveryDetails = async () => {
    localStorage.setItem('deliveryDetails', JSON.stringify(deliveryDetails));
    if (user?.uid) {
      await syncUserProfile({
        userId: user.uid,
        name: deliveryDetails.name,
        phone: deliveryDetails.phone
      });
    }
    setIsDeliverySheetOpen(false);
  };

  const handleChangePassword = async () => {
    setSecurityError(null);
    setSecuritySuccess(null);

    if (newPassword.length < 6) {
      setSecurityError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setSecurityError('Passwords do not match.');
      return;
    }

    setSecurityLoading(true);
    try {
      const res = await changeUserPassword(newPassword);
      if (res.success) {
        setSecuritySuccess('Your password has been changed successfully.');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setIsSecuritySheetOpen(false);
          setSecuritySuccess(null);
        }, 2000);
      } else {
        setSecurityError(res.error || 'Failed to update password.');
      }
    } catch (e) {
      setSecurityError('An error occurred.');
    } finally {
      setSecurityLoading(false);
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

  // Use first name for avatar initial
  const firstName = user.displayName ? user.displayName.split(' ')[0] : 'User';
  const initial = firstName.charAt(0).toUpperCase();

  const menuItems = [
    { icon: ShoppingBag, label: 'My Orders', href: '/orders', color: 'text-indigo-500', bg: 'bg-indigo-100', isLink: true },
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
            <span className="text-2xl font-black text-indigo-700">{initial}</span>
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
          
          {/* Delivery Details (Opens Sheet) */}
          <Sheet open={isDeliverySheetOpen} onOpenChange={setIsDeliverySheetOpen}>
            <SheetTrigger className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors border-b border-slate-50">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-100">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-slate-700">Delivery Details</span>
                  {deliveryDetails.location && (
                    <span className="block text-xs text-slate-500">{deliveryDetails.location}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] md:h-auto rounded-t-3xl sm:rounded-3xl p-6 bg-white border-t border-slate-100">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold text-slate-900">Delivery Details</SheetTitle>
              </SheetHeader>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={deliveryDetails.name}
                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                    placeholder="E.g. Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                  <input 
                    type="tel" 
                    value={deliveryDetails.phone}
                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                    placeholder="E.g. +1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Delivery Location</label>
                  <input 
                    type="text" 
                    value={deliveryDetails.location}
                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                    placeholder="Ex: G-Villa 1, G-Villa 2, B-Villa 2 (G=Girls, B=Boys)"
                  />
                </div>
                <div className="pt-2">
                  <Button 
                    onClick={handleSaveDeliveryDetails}
                    className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                  >
                    Save Details
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Security / Password Sheet */}
          <Sheet open={isSecuritySheetOpen} onOpenChange={setIsSecuritySheetOpen}>
            <SheetTrigger className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors border-b border-slate-50">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-100">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-slate-700">Security</span>
                  <span className="block text-xs text-slate-500">Change password, manage security settings</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] md:h-auto rounded-t-3xl sm:rounded-3xl p-6 bg-white border-t border-slate-100">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold text-slate-900">Change Password</SheetTitle>
              </SheetHeader>
              
              {securityError && (
                <div className="mb-4 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100">
                  {securityError}
                </div>
              )}
              {securitySuccess && (
                <div className="mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-bold border border-emerald-100">
                  {securitySuccess}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">New Password (6+ chars)</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                    placeholder="••••••••"
                  />
                </div>
                <div className="pt-2">
                  <Button 
                    onClick={handleChangePassword}
                    disabled={securityLoading}
                    className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-lg active:scale-[0.98] transition-all"
                  >
                    {securityLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

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
