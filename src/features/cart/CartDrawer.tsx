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
  
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({
    name: '',
    phone: '',
    location: ''
  });

  useEffect(() => {
    if (isCartOpen) {
      const saved = localStorage.getItem('deliveryDetails');
      if (saved) {
        setDeliveryDetails(JSON.parse(saved));
        setShowNewAddressForm(false);
      } else {
        setShowNewAddressForm(true);
        if (user) {
          setDeliveryDetails(prev => ({ ...prev, name: user.displayName || '' }));
        }
      }
    }
  }, [isCartOpen, user]);

  const handleSaveAddress = () => {
    if (!deliveryDetails.name || !deliveryDetails.phone || !deliveryDetails.location) {
      setError('Please fill out all delivery details.');
      return;
    }
    setError(null);
    localStorage.setItem('deliveryDetails', JSON.stringify(deliveryDetails));
    setShowNewAddressForm(false);
  };

  const handleCheckout = async () => {
    if (!user) {
      setError('You must sign in to place a delivery order.');
      return;
    }
    if (!deliveryDetails.location || !deliveryDetails.name || !deliveryDetails.phone) {
      setError('Please save your delivery details before checkout.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const orderData = {
        manual_delivery_details: deliveryDetails,
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

  const deliveryFee = 2.50;
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
                      LKR {(item.menuItem.base_price * item.quantity).toFixed(2)}
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
                {!showNewAddressForm && (
                  <button onClick={() => setShowNewAddressForm(true)} className="text-xs font-bold text-amber-600 hover:text-amber-700">
                    {deliveryDetails.location ? 'Change' : '+ Add Details'}
                  </button>
                )}
              </div>

              {!user ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-sm text-slate-600 mb-3">Sign in to choose a delivery address</p>
                  <Button onClick={() => router.push('/login')} variant="outline" className="w-full text-xs font-bold">Sign In</Button>
                </div>
              ) : showNewAddressForm ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <input 
                    type="text"
                    placeholder="Full Name (e.g. Jane Doe)"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium"
                    value={deliveryDetails.name}
                    onChange={(e) => setDeliveryDetails({...deliveryDetails, name: e.target.value})}
                  />
                  <input 
                    type="tel"
                    placeholder="Phone Number (e.g. +1 234 567 890)"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium"
                    value={deliveryDetails.phone}
                    onChange={(e) => setDeliveryDetails({...deliveryDetails, phone: e.target.value})}
                  />
                  <input 
                    type="text"
                    placeholder="Ex: G-Villa 1, G-Villa 2, B-Villa 2 (G=Girls, B=Boys)"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium"
                    value={deliveryDetails.location}
                    onChange={(e) => setDeliveryDetails({...deliveryDetails, location: e.target.value})}
                  />
                  
                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" className="flex-1 text-xs" onClick={() => {
                       const saved = localStorage.getItem('deliveryDetails');
                       if (saved) setDeliveryDetails(JSON.parse(saved));
                       setShowNewAddressForm(false);
                    }}>Cancel</Button>
                    <Button className="flex-1 text-xs bg-slate-900 text-white" onClick={handleSaveAddress}>
                      Save Details
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border bg-amber-50 border-amber-500 shadow-sm flex items-start space-x-3">
                    <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
                    <div className="flex-1">
                      {deliveryDetails.location ? (
                        <>
                          <div className="font-bold text-sm text-slate-900">{deliveryDetails.name}</div>
                          <div className="text-xs text-slate-700 mt-0.5">{deliveryDetails.location}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{deliveryDetails.phone}</div>
                        </>
                      ) : (
                        <div className="text-sm font-medium text-slate-500 mt-0.5">No delivery details set</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2 mb-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-medium">Subtotal</span>
                <span className="text-sm font-bold text-slate-900">LKR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-medium">Delivery Fee</span>
                <span className="text-sm font-bold text-slate-900">LKR {deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-800 font-bold">Total Amount</span>
                <span className="text-2xl font-black text-amber-600">LKR {total.toFixed(2)}</span>
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
