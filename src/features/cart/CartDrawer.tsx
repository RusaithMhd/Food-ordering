'use client';

import { useCart } from './CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, MapPin } from 'lucide-react';
import { createOrder } from '../../actions/orders/create-order';
import { getUserAddresses, createAddress } from '@/actions/delivery/addresses';
import { getDeliveryZones } from '@/actions/delivery/zones';
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useRouter } from 'next/navigation';

export function CartDrawer() {
  const router = useRouter();
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  
  // New Address Form State
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    address_type: 'HOSTEL',
    recipient_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    zone_id: ''
  });

  useEffect(() => {
    if (isCartOpen && user) {
      loadAddressesAndZones();
    }
  }, [isCartOpen, user]);

  const loadAddressesAndZones = async () => {
    setIsLoadingAddresses(true);
    try {
      const [addressRes, zoneRes] = await Promise.all([
        getUserAddresses(),
        getDeliveryZones()
      ]);
      
      if (zoneRes.success && zoneRes.data) {
        setZones(zoneRes.data);
        if (zoneRes.data.length > 0) {
          setNewAddress(prev => ({ ...prev, zone_id: zoneRes.data[0].id }));
        }
      }

      if (addressRes.success && addressRes.data) {
        setAddresses(addressRes.data);
        if (addressRes.data.length > 0) {
          setSelectedAddressId(addressRes.data[0].id);
          setShowNewAddressForm(false);
        } else {
          setShowNewAddressForm(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddress.address_line1 || !newAddress.zone_id || !newAddress.recipient_name || !newAddress.phone) {
      setError('Please fill out all address fields.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    const res = await createAddress({
      address_type: newAddress.address_type as any,
      recipient_name: newAddress.recipient_name,
      phone: newAddress.phone,
      address_line1: newAddress.address_line1,
      address_line2: newAddress.address_line2,
      zone_id: newAddress.zone_id,
      is_default: true
    });

    if (res.success && res.data) {
      await loadAddressesAndZones();
      setSelectedAddressId(res.data.id);
      setShowNewAddressForm(false);
    } else {
      setError('Failed to save address');
    }
    setIsSubmitting(false);
  };

  const handleCheckout = async () => {
    if (!user) {
      setError('You must sign in to place a delivery order.');
      return;
    }
    if (!selectedAddressId && !showNewAddressForm) {
      setError('Please select a delivery address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const orderData = {
        delivery_address_id: selectedAddressId,
        customer_id: user.uid,
        items: items.map(i => ({
          menu_item_id: i.menuItem.id,
          quantity: i.quantity,
          unit_price: i.menuItem.base_price,
          notes: ''
        }))
      };

      const result = await createOrder(orderData);

      if (result.success) {
        clearCart();
        setIsCartOpen(false);
        router.push('/orders');
      } else {
        setError(result.error || 'Failed to place order');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const deliveryFee = selectedAddress?.delivery_zones?.delivery_fee || 0;
  const total = subtotal + deliveryFee;

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md bg-white/95 backdrop-blur-xl border-l border-slate-200/50 flex flex-col p-0 shadow-2xl">
        <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-white/50">
          <SheetTitle className="flex items-center text-xl font-bold text-slate-900">
            <ShoppingBag className="w-5 h-5 mr-2" />
            Your Order
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 hide-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border border-dashed border-slate-200">
                <ShoppingBag className="h-10 w-10 text-slate-300" />
              </div>
              <p className="font-medium text-slate-500">Your cart is empty</p>
              <Button 
                variant="outline" 
                className="mt-2 rounded-full border-slate-200"
                onClick={() => setIsCartOpen(false)}
              >
                Browse Menu
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.menuItem.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  {item.menuItem.image_url ? (
                    <div className="w-20 h-20 shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.menuItem.image_url} alt={item.menuItem.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 shrink-0 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 border-dashed">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">No Img</span>
                    </div>
                  )}
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-900 text-[15px] leading-tight pr-2">{item.menuItem.name}</h4>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1 -mr-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="text-slate-900 font-extrabold mt-1">
                      ${(item.menuItem.base_price * item.quantity).toFixed(2)}
                    </div>

                    <div className="flex items-center space-x-3 mt-auto pt-2">
                      <button 
                        className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors active:scale-95"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-semibold text-slate-900 min-w-[20px] text-center">{item.quantity}</span>
                      <button 
                        className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors active:scale-95"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-100 p-6 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10">
            {error && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100 flex items-start">
                <span className="font-medium">{error}</span>
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">Delivery Details</label>
                {!showNewAddressForm && addresses.length > 0 && (
                  <button onClick={() => setShowNewAddressForm(true)} className="text-xs font-bold text-amber-600 hover:text-amber-700">
                    + Add New
                  </button>
                )}
              </div>

              {!user ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-sm text-slate-600 mb-3">Sign in to choose a delivery address</p>
                  <Button onClick={() => router.push('/login')} variant="outline" className="w-full text-xs font-bold">Sign In</Button>
                </div>
              ) : isLoadingAddresses ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center animate-pulse text-slate-400 text-sm font-medium">
                  Loading addresses...
                </div>
              ) : showNewAddressForm ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium"
                    value={newAddress.address_type}
                    onChange={(e) => setNewAddress({...newAddress, address_type: e.target.value})}
                  >
                    <option value="HOSTEL">Hostel</option>
                    <option value="UNIVERSITY">University Campus</option>
                    <option value="PRIVATE_ADDRESS">Private Address</option>
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text"
                      placeholder="Recipient Name"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
                      value={newAddress.recipient_name}
                      onChange={(e) => setNewAddress({...newAddress, recipient_name: e.target.value})}
                    />
                    <input 
                      type="text"
                      placeholder="Phone Number"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                    />
                  </div>
                  
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium"
                    value={newAddress.zone_id}
                    onChange={(e) => setNewAddress({...newAddress, zone_id: e.target.value})}
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name} (+${z.delivery_fee})</option>
                    ))}
                  </select>

                  <input 
                    type="text"
                    placeholder="Address Line 1 (e.g., Block A, Room 204)"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
                    value={newAddress.address_line1}
                    onChange={(e) => setNewAddress({...newAddress, address_line1: e.target.value})}
                  />
                  
                  <div className="flex space-x-2 pt-2">
                    {addresses.length > 0 && (
                      <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowNewAddressForm(false)}>Cancel</Button>
                    )}
                    <Button className="flex-1 text-xs bg-slate-900 text-white" onClick={handleSaveAddress} disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Address'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map(addr => (
                    <div 
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${selectedAddressId === addr.id ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-300'}`}
                    >
                      <MapPin className={`w-5 h-5 mt-0.5 shrink-0 ${selectedAddressId === addr.id ? 'text-amber-500' : 'text-slate-400'}`} />
                      <div className="flex-1">
                        <div className="font-bold text-sm text-slate-900">{addr.address_type} - {addr.delivery_zones?.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{addr.address_line1}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2 mb-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-medium">Subtotal</span>
                <span className="text-sm font-bold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-medium">Delivery Fee</span>
                <span className="text-sm font-bold text-slate-900">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-800 font-bold">Total Amount</span>
                <span className="text-2xl font-black text-amber-600">${total.toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full h-14 rounded-2xl text-lg font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center"
              onClick={handleCheckout}
              disabled={isSubmitting || showNewAddressForm || !user}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  Processing...
                </div>
              ) : (
                <>
                  Place Order <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
            <p className="text-center text-xs text-slate-400 mt-4 font-medium flex items-center justify-center">
               Payment Method: Cash on Delivery
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
