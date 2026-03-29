// src/pages/TradingPlatform/logic/closePosition.ts
import { supabase } from '../../../../supabaseClient';

export const closePosition = async (position: any, isProfit: boolean, profit: number, userId: string, fetchInitialPositions: any, fetchWallet: any, skipFetch: boolean = false) => {
  console.log('[closePosition] Starting for position:', JSON.stringify(position, null, 2), 'Profit:', profit);
  
  if (isNaN(profit)) {
    console.error('[closePosition] Profit is NaN, aborting');
    throw new Error('Invalid profit value');
  }

  // Delete the trade order instead of updating status, as requested by the user
  const { error: deleteError } = await supabase
    .from('trade_orders')
    .delete()
    .eq('id', position.id);
  
  if (deleteError) {
    console.error('[closePosition] Error deleting trade_order:', JSON.stringify(deleteError, null, 2));
    throw new Error(deleteError.message || 'Failed to delete trade order');
  }

  // Update user balance with profit/loss
  const { data: currentBalanceData, error: balanceFetchError } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single();

  if (balanceFetchError) {
    console.error('[closePosition] Error fetching balance:', JSON.stringify(balanceFetchError, null, 2));
    throw new Error(balanceFetchError.message || 'Failed to fetch user balance');
  }

  let newBalance = 0;
  if (currentBalanceData) {
    newBalance = Number(currentBalanceData.balance) + profit;
    // Zero-Floor Rule: Prevent balance from going below zero
    if (newBalance < 0) newBalance = 0;
    
    const { error: balanceUpdateError } = await supabase
      .from('users')
      .update({ balance: Number(newBalance.toFixed(2)) })
      .eq('id', userId);
    
    if (balanceUpdateError) {
      console.error('[closePosition] Error updating balance:', JSON.stringify(balanceUpdateError, null, 2));
      throw new Error(balanceUpdateError.message || 'Failed to update user balance');
    }
  }

  if (!skipFetch) {
    await fetchInitialPositions();
  }
  await fetchWallet();
  return { newBalance };
};
