// src/pages/TradingPlatform/logic/handleTrade.ts
import { supabase } from '../../../../supabaseClient';

export const handleTrade = async (
  type: 'Buy' | 'Sell', 
  symbol: string, 
  volume: number, 
  marketData: any, 
  userId: string, 
  fetchInitialPositions: any, 
  fetchWallet: any, 
  commission: number, 
  requiredMargin: number, 
  sl?: number, 
  tp?: number,
  status: 'open' | 'pending' = 'open',
  triggerPrice?: number,
  orderType: string = 'market',
  skipFetch: boolean = false
) => {
  // Pre-Trade Validation: Check if Free Margin covers the trade
  const { data: userData, error: userError } = await supabase.from('users').select('balance, username').eq('id', userId).single();
  if (userError) {
    console.error('[handleTrade] Error fetching user balance:', userError);
    throw new Error('Failed to fetch user balance');
  }
  const { data: positionsData, error: positionsError } = await supabase.from('trade_orders').select('required_margin').eq('user_id', userId);
  if (positionsError) {
    console.error('[handleTrade] Error fetching positions:', positionsError);
    throw new Error('Failed to fetch positions');
  }
  const usedMargin = positionsData.reduce((sum, pos) => sum + Number(pos.required_margin || 0), 0);
  const freeMargin = Number(userData.balance) - usedMargin;
  
  if (freeMargin < requiredMargin) {
    throw new Error('Insufficient Margin');
  }

  let price = type === 'Buy' ? Number(marketData.ask) : Number(marketData.bid);
  
  if (status === 'pending') {
    price = Number(triggerPrice);
  }

  if (!price || isNaN(price) || price <= 0) {
    console.error('[handleTrade] Invalid price:', price, 'marketData:', marketData);
    throw new Error('Invalid price. Please check your entry price.');
  }

  const username = userData?.username || 'Unknown';

  const { error } = await supabase.from('trade_orders').insert({
    user_id: userId,
    username: username,
    asset_symbol: symbol,
    type: type.toLowerCase(),
    amount: volume,
    entry_price: price,
    commission: commission || 0,
    required_margin: requiredMargin || 0,
    status: status,
    sl: sl || null,
    tp: tp || null,
    trigger_price: triggerPrice || null,
    order_type: orderType
  });

  if (error) {
    console.error('[handleTrade] Error inserting trade:', error);
    throw new Error(error.message || 'Failed to insert trade into database');
  }

  console.log('[handleTrade] Trade inserted successfully:', {
    userId,
    symbol,
    type,
    volume,
    price,
    status
  });

  // Deduct commission from user balance
  let newBalance = undefined;
  const { data: currentBalanceData } = await supabase.from('users').select('balance').eq('id', userId).single();
  if (currentBalanceData) {
    newBalance = Number(currentBalanceData.balance) - (commission || 0);
    const { error: updateError } = await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
    if (updateError) {
      console.error('[handleTrade] Error updating balance:', updateError);
    }
  }

  if (!skipFetch) {
    await fetchInitialPositions();
    await fetchWallet();
  }
  return { success: true, newBalance };
};
