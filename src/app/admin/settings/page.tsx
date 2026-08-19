import { createAdminClient } from '@/lib/supabase/server';
import { updateHotelBranding } from '@/actions/admin/branches';
import { Button } from '@/components/ui/button';
import { Store, Phone, MapPin, Sparkles, ShieldCheck } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const supabase = await createAdminClient();
  
  // Fetch current hotel
  const { data: hotels } = await supabase.from('hotels').select('*').limit(1);
  const hotel = hotels?.[0] || null;

  let hotelName = hotel?.name || 'Atheef Hotel';
  let hotelPhone = '769645828';
  let hotelAddress = '230,A Mahapola Road Oluvil - 0 4';

  if (hotel?.name && hotel.name.startsWith('{') && hotel.name.endsWith('}')) {
    try {
      const parsed = JSON.parse(hotel.name);
      hotelName = parsed.name || hotelName;
      hotelPhone = parsed.phone || hotelPhone;
      hotelAddress = parsed.address || hotelAddress;
    } catch (e) {
      // Ignored, fallback to defaults
    }
  }

  // Handle form submission via Server Action
  const handleSave = async (formData: FormData) => {
    'use server';
    await updateHotelBranding(formData);
    revalidatePath('/admin/settings');
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-3xl mx-auto selection:bg-indigo-500/20 selection:text-indigo-200">
      
      {/* Title Header */}
      <div className="flex flex-col space-y-1.5 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-center space-x-2 text-indigo-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">Branding System</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Hotel Settings</h1>
        <p className="text-sm text-slate-400 font-medium">Customize the public name, contact information, and address properties of your restaurant branch.</p>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative group animate-in fade-in slide-in-from-bottom-4 duration-400 delay-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        
        <form action={handleSave} className="p-6 md:p-8 space-y-6">
          <input type="hidden" name="hotel_id" value={hotel?.id || ''} />

          {/* Hotel Name Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Hotel Name / Brand Logo</label>
            <div className="relative">
              <Store className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                name="name"
                required
                defaultValue={hotelName}
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-white placeholder-slate-600"
                placeholder="e.g. Atheef Hotel"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">This name is used across the main header navigation, checkout page, order history, and receipts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Phone Number */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Contact Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  name="phone"
                  required
                  defaultValue={hotelPhone}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-white placeholder-slate-600"
                  placeholder="e.g. 769645828"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Hotel Location Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  name="address"
                  required
                  defaultValue={hotelAddress}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-white placeholder-slate-600"
                  placeholder="e.g. 230,A Mahapola Road Oluvil - 0 4"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-bold bg-emerald-500/5 px-3.5 py-1.5 rounded-xl border border-emerald-500/10">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Only administrators can update these properties</span>
            </div>
            <Button
              type="submit"
              className="w-full md:w-auto h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all shrink-0"
            >
              Save Branding Changes
            </Button>
          </div>

        </form>
      </div>

    </div>
  );
}
