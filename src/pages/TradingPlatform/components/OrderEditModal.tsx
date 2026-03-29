import React, { useState } from 'react';
import { supabase } from '../../../../supabaseClient';
import { VisualOrder } from '../services/chartInteractionService';

interface OrderEditModalProps {
  order: VisualOrder;
  onClose: () => void;
  onUpdate: () => void;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({ order, onClose, onUpdate }) => {
  const [sl, setSl] = useState(order.sl?.toString() || '');
  const [tp, setTp] = useState(order.tp?.toString() || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData: any = {};
      if (sl !== '') updateData.sl = parseFloat(sl);
      else updateData.sl = null;
      if (tp !== '') updateData.tp = parseFloat(tp);
      else updateData.tp = null;

      const { error } = await supabase
        .from('trade_orders')
        .update(updateData)
        .eq('id', order.id);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to update order:', err);
      alert('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-[#1e2329] p-6 rounded-lg border border-white/10 w-80">
        <h2 className="text-white font-bold mb-4">Edit Order {order.id}</h2>
        <div className="mb-4">
          <label className="text-slate-400 text-xs">Stop Loss</label>
          <input 
            type="number" 
            value={sl} 
            onChange={(e) => setSl(e.target.value)}
            className="w-full bg-[#161a1e] text-white p-2 rounded border border-red-500"
          />
        </div>
        <div className="mb-4">
          <label className="text-slate-400 text-xs">Take Profit</label>
          <input 
            type="number" 
            value={tp} 
            onChange={(e) => setTp(e.target.value)}
            className="w-full bg-[#161a1e] text-white p-2 rounded border border-emerald-500"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
