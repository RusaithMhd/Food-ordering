'use client';

import { useState } from 'react';
import { cancelOrder } from '@/actions/orders/cancel-order';
import { updateOrderNote } from '@/actions/orders/update-order-note';
import { Button } from '@/components/ui/button';
import { Edit3, XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

interface OrderActionButtonsProps {
  orderId: string;
  status: string;
  placedAt: string;
  customerNote: string | null;
}

export function OrderActionButtons({ orderId, status, placedAt, customerNote }: OrderActionButtonsProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [note, setNote] = useState(customerNote || '');
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'PLACED') return null;

  const orderDate = new Date(placedAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - orderDate.getTime()) / (1000 * 60);
  const canCancel = diffMinutes <= 30;

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    setIsCancelling(true);
    setError(null);
    const res = await cancelOrder(orderId);
    
    if (!res.success) {
      setError(res.error || 'Failed to cancel order');
      alert(res.error || 'Failed to cancel order');
    }
    setIsCancelling(false);
  };

  const handleUpdateNote = async () => {
    setIsUpdatingNote(true);
    setError(null);
    const res = await updateOrderNote(orderId, note);
    
    if (res.success) {
      setIsNoteDialogOpen(false);
    } else {
      setError(res.error || 'Failed to update note');
    }
    setIsUpdatingNote(false);
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogTrigger>
          <div className="flex items-center justify-center flex-1 text-indigo-600 border border-indigo-200 hover:bg-indigo-50 bg-white font-bold rounded-xl h-11 px-4 cursor-pointer">
            <Edit3 className="w-4 h-4 mr-2" />
            {customerNote ? 'Edit Notes' : 'Add Instructions'}
          </div>
        </DialogTrigger>
        <DialogContent className="rounded-3xl p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Add Order Instructions</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none text-sm font-medium text-slate-700"
              placeholder="E.g. Please ring the doorbell, extra spicy, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsNoteDialogOpen(false)} className="rounded-xl font-bold flex-1 text-slate-600 hover:bg-slate-100">
              Cancel
            </Button>
            <Button onClick={handleUpdateNote} disabled={isUpdatingNote} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex-1">
              {isUpdatingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {canCancel && (
        <Button 
          variant="outline" 
          onClick={handleCancel}
          disabled={isCancelling}
          className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 font-bold rounded-xl h-11"
        >
          {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
          Cancel Order
        </Button>
      )}
    </div>
  );
}
