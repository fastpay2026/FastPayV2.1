import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../../../supabaseClient';
import { fetchInitialPositions as fetchInitialPositionsFn } from '../logic/fetchInitialPositions';
import { fetchWallet as fetchWalletFn } from '../logic/fetchWallet';
import { closePosition } from '../logic/closePosition';
import { calculateBidAsk, getContractSize } from '../../../utils/marketUtils';

export const usePositionsTable = (user: any, setBalance: any, prices: any, assets: any, spreads: any) => {
  const [positions, setPositions] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [closedTrades, setClosedTrades] = useState<any[]>([]);
  const closingPositionsRef = useRef<Set<string>>(new Set());

  // ... (fetch functions remain the same)

  // Auto-Close Engine (SL/TP Monitor)
  useEffect(() => {
    console.log('[usePositionsTable] Prices updated:', prices);
    if (positions.length === 0) return;

    const interval = setInterval(() => {
      positions.forEach(pos => {
        if (pos.status !== 'open') return;
        if (closingPositionsRef.current.has(pos.id)) return;
        
        const currentPrice = prices[pos.asset_symbol];
        if (!currentPrice) return;

        const asset = assets.find((a: any) => a.symbol === pos.asset_symbol);
        const spread = spreads[pos.asset_symbol]?.value || asset?.spread || 0;
        const { bid: bidStr, ask: askStr } = calculateBidAsk(currentPrice, spread, pos.asset_symbol, asset?.type || 'forex', asset?.digits || 5);
        const bid = Number(bidStr);
        const ask = Number(askStr);

        let shouldClose = false;
        let closeReason = '';

        if (pos.type === 'buy') {
          if (pos.sl && bid <= pos.sl) { shouldClose = true; closeReason = 'Stop Loss'; }
          else if (pos.tp && bid >= pos.tp) { shouldClose = true; closeReason = 'Take Profit'; }
        } else if (pos.type === 'sell') {
          if (pos.sl && ask >= pos.sl) { shouldClose = true; closeReason = 'Stop Loss'; }
          else if (pos.tp && ask <= pos.tp) { shouldClose = true; closeReason = 'Take Profit'; }
        }

        if (shouldClose) {
          console.log(`[Auto-Close] Closing position ${pos.id} due to ${closeReason}`);
          closingPositionsRef.current.add(pos.id);
          const contractSize = getContractSize(pos.asset_symbol);
          const exitPrice = pos.type === 'buy' ? bid : ask;
          const entryPrice = Number(pos.entry_price);
          const amount = Number(pos.amount);
          const profit = (pos.type === 'buy' ? (exitPrice - entryPrice) : (entryPrice - exitPrice)) 
                        * amount * contractSize;
          const isWin = profit > 0;
          
          closePositionAction(pos, isWin, profit).finally(() => {
            closingPositionsRef.current.delete(pos.id);
          });
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [positions, prices, assets, spreads]);

  // ... (rest of the hook)

  const fetchInitialPositions = useCallback(async () => {
    if (!user?.id) return [];
    console.log('[usePositionsTable] Fetching initial positions for user:', user.id);
    const { data, error } = await supabase.from('trade_orders').select('*').eq('user_id', user.id).eq('status', 'open');
    if (error) {
      console.error('[usePositionsTable] Error fetching initial positions:', error);
      return [];
    }
    console.log('[usePositionsTable] Initial positions fetched, data:', data);
    setPositions(prev => {
        console.log('[usePositionsTable] Previous positions:', prev);
        const pending = prev.filter(p => p.pending);
        console.log('[usePositionsTable] Pending positions:', pending);
        const newData = [...(data || []), ...pending];
        console.log('[usePositionsTable] New positions:', newData);
        return newData;
    });
    return data || [];
  }, [user?.id]);

  const fetchInitialPendingOrders = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('trade_orders').select('*').eq('user_id', user.id).eq('status', 'pending');
    setPendingOrders(data || []);
  }, [user?.id]);

  const fetchInitialHistory = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('trade_orders')
      .select('*')
      .eq('user_id', user.id)
      .or('status.eq.closed_profit,status.eq.closed_loss')
      .order('closed_at', { ascending: false })
      .limit(50);
    setClosedTrades(data || []);
  }, [user?.id]);

  // Real-time subscription for trade_orders (Disabled)
  /*
  useEffect(() => {
    // ... (subscription logic)
  }, []);
  */

  const closePositionAction = async (position: any, isWin: boolean, profit: number) => {
    console.log('[closePositionAction] position to close:', position);
    console.log('[closePositionAction] position.pending:', position.pending);
    console.log('[closePositionAction] current positions:', positions);
    
    // 1. التحديث المتفائل: حذف الصفقة فوراً من الحالة المحلية
    const previousPositions = [...positions];
    setPositions(prev => prev.filter(p => {
        console.log(`[closePositionAction] comparing ${String(p.id)} with ${String(position.id)}`);
        return String(p.id) !== String(position.id);
    }));
    
    // التحقق من صحة UUID قبل محاولة الحذف من السيرفر
    const isUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);

    // إذا كانت الصفقة معلقة (Optimistic) أو المعرف ليس UUID، لا نحاول حذفها من السيرفر
    if (position.pending || !isUUID(String(position.id))) {
      console.log('[closePositionAction] Position is pending or invalid UUID, cancelling locally only.');
      toast.success(`Position ${position.asset_symbol} cancelled.`);
      return;
    }

    try {
      // 2. تنفيذ الإغلاق في الخلفية
      await closePosition(position, isWin, profit, user.id, fetchInitialPositions, () => fetchWalletFn(setBalance, user.id), true);
      toast.success(`Position ${position.asset_symbol} closed. PnL: ${profit.toFixed(2)}$`);
      
      // 3. تحديث البيانات يدوياً من السيرفر
      await fetchInitialPositions();
      await fetchInitialHistory();
    } catch (err: any) {
      // 4. في حال الفشل، استعادة الحالة السابقة
      setPositions(previousPositions);
      
      console.error('[closePositionAction] Error:', err);
      const errorMessage = err?.message || 'Failed to close position';
      toast.error(errorMessage);
    }
  };

  const cancelPendingOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from('trade_orders').delete().eq('id', orderId);
      if (error) throw error;
      toast.success('Pending order cancelled');
      fetchInitialPendingOrders();
    } catch (err: any) {
      toast.error('Failed to cancel order');
    }
  };

  return {
    positions, setPositions,
    pendingOrders, setPendingOrders,
    closedTrades, setClosedTrades,
    fetchInitialPositions,
    fetchInitialPendingOrders,
    fetchInitialHistory,
    closePositionAction,
    cancelPendingOrder
  };
};
