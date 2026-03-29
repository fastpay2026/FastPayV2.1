// src/pages/TradingPlatform/services/pendingOrdersService.ts
import { supabase } from '../../../../supabaseClient';
import { calculateBidAsk } from '../../../utils/marketUtils';

export const checkPendingOrders = async (
  prices: Record<string, number>,
  assets: any[],
  spreads: Record<string, any>,
  userId: string,
  onOrderTriggered: () => void
) => {
  // 1. Fetch pending orders for the user
  const { data: pendingOrders, error } = await supabase
    .from('trade_orders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error || !pendingOrders || pendingOrders.length === 0) return;

  for (const order of pendingOrders) {
    const currentPrice = prices[order.asset_symbol];
    if (!currentPrice) continue;

    const asset = assets.find(a => a.symbol === order.asset_symbol);
    const spread = spreads[order.asset_symbol]?.value || asset?.spread || 0;
    const { bid: bidStr, ask: askStr } = calculateBidAsk(
      currentPrice,
      spread,
      order.asset_symbol,
      asset?.type || 'forex',
      asset?.digits || 5
    );
    const bid = Number(bidStr);
    const ask = Number(askStr);

    const triggerPrice = Number(order.trigger_price);
    let shouldTrigger = false;

    // Buy orders execute on Ask
    // Sell orders execute on Bid
    if (order.order_type === 'buy_limit') {
      if (ask <= triggerPrice) shouldTrigger = true;
    } else if (order.order_type === 'buy_stop') {
      if (ask >= triggerPrice) shouldTrigger = true;
    } else if (order.order_type === 'sell_limit') {
      if (bid >= triggerPrice) shouldTrigger = true;
    } else if (order.order_type === 'sell_stop') {
      if (bid <= triggerPrice) shouldTrigger = true;
    }

    if (shouldTrigger) {
      console.log(`[PendingOrdersService] Triggering order ${order.id} (${order.order_type}) at ${triggerPrice}`);
      
      // Update order to 'open'
      const { error: updateError } = await supabase
        .from('trade_orders')
        .update({
          status: 'open',
          entry_price: triggerPrice,
          timestamp: new Date().toISOString()
        })
        .eq('id', order.id);

      if (!updateError) {
        onOrderTriggered();
      }
    }
  }
};
