'use client';

import { useCart } from './CartContext';
import { useBranch } from '@/features/branch/BranchContext';
import { useAuth } from '@/features/auth/AuthProvider';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { createOrder } from '@/actions/orders/create-order';
import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const { branchId, roomId } = useBranch();
  const { user } = useAuth();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    if (!user) {
      alert('Please log in to place an order.');
      setIsCartOpen(false);
      router.push('/login');
      return;
    }

    if (!branchId || !roomId) {
      alert('Missing branch or room context. Please scan the QR code in your room.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        branch_id: branchId,
        room_id: roomId,
        customer_id: user.uid,
        items: items.map(i => ({
          menu_item_id: i.menuItem.id,
          quantity: i.quantity,
          unit_price: i.menuItem.base_price,
          notes: i.notes
        })),
        customer_note: '', // Could add a field for this in the drawer
      };

      const result = await createOrder(orderData);
      
      if (result.success) {
        clearCart();
        setIsCartOpen(false);
        alert('Order placed successfully!');
      } else {
        alert(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error(error);
      alert('An unexpected error occurred');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const deliveryFee = 0;
  const tax = 0;
  const total = subtotal + deliveryFee + tax;

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-gray-50 p-0">
        <SheetHeader className="p-6 bg-white border-b border-gray-100">
          <SheetTitle className="text-2xl font-bold">Your Order</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-500">Your cart is empty</p>
              <Button variant="outline" onClick={() => setIsCartOpen(false)}>
                Browse Menu
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex flex-col p-4 bg-white rounded-xl shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 pr-8">{item.menuItem.name}</h3>
                  <span className="font-medium text-gray-900">${(item.menuItem.base_price * item.quantity).toFixed(2)}</span>
                </div>
                
                {item.notes && (
                  <p className="text-sm text-gray-500 mb-3 italic">"{item.notes}"</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-4 text-center font-medium">{item.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 rounded-md"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="bg-white p-6 border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-medium text-gray-900">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="font-bold text-gray-900 text-lg">Total</span>
                <span className="font-bold text-gray-900 text-xl">${total.toFixed(2)}</span>
              </div>
            </div>
            <Button 
              className="w-full h-14 text-lg font-medium bg-black hover:bg-gray-800 text-white shadow-xl shadow-gray-200" 
              onClick={handleCheckout} 
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? 'Processing...' : 'Place Order (Cash on Delivery)'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
