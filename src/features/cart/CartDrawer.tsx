'use client';

import { useCart } from './CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { createOrder } from '@/actions/orders/create-order';
import { useState } from 'react';
import { useBranch } from '../branch/BranchContext';
import { useAuth } from '../auth/AuthProvider';

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { branchId, roomId } = useBranch();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!branchId) {
      setError('Please scan a valid room QR code to place an order.');
      return;
    }
    if (!roomId && !user) {
      setError('You must either sign in or scan a room QR code to order.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const orderData = new FormData();
      orderData.append('branch_id', branchId);
      if (roomId) orderData.append('room_id', roomId);
      orderData.append('payment_method', 'CASH_ON_DELIVERY');
      orderData.append('items', JSON.stringify(
        items.map(i => ({ menu_item_id: i.menuItem.id, quantity: i.quantity, unit_price: i.menuItem.base_price }))
      ));

      const result = await createOrder(orderData);

      if (result.success) {
        clearCart();
        setIsCartOpen(false);
        alert('Order placed successfully! The kitchen is preparing your food.');
      } else {
        setError(result.error || 'Failed to place order');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                        onClick={() => removeItem(item.menuItem.id)}
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
                        onClick={() => updateQuantity(item.menuItem.id, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-semibold text-slate-900 min-w-[20px] text-center">{item.quantity}</span>
                      <button 
                        className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors active:scale-95"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
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
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-500 font-medium">Total Amount</span>
              <span className="text-2xl font-black text-slate-900">${totalPrice.toFixed(2)}</span>
            </div>
            
            <Button 
              className="w-full h-14 rounded-2xl text-lg font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center"
              onClick={handleCheckout}
              disabled={isSubmitting}
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
