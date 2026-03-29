import { SupabaseClient } from '@supabase/supabase-js';

export const runStopOutEngine = (supabase: SupabaseClient) => {
  setInterval(async () => {
    console.log('[StopOutEngine] Checking for stop-outs...');
    
    // 1. Fetch all users
    const { data: users, error: usersError } = await supabase.from('users').select('id, balance');
    if (usersError) {
      console.error('[StopOutEngine] Error fetching users:', usersError);
      return;
    }

    for (const user of users) {
      // 2. Fetch user's positions
      const { data: positions, error: positionsError } = await supabase
        .from('trade_orders')
        .select('id, required_margin, entry_price, asset_symbol, type')
        .eq('user_id', user.id);
      
      if (positionsError) {
        console.error('[StopOutEngine] Error fetching positions for user:', user.id, positionsError);
        continue;
      }

      if (positions.length === 0) continue;

      // 3. Calculate margin level
      // This is a simplified calculation. In a real system, we would need current market prices.
      // For now, we'll just check if balance is negative or close to zero.
      const usedMargin = positions.reduce((sum, pos) => sum + Number(pos.required_margin || 0), 0);
      const equity = Number(user.balance); // This is a simplification.
      
      if (equity <= 0) {
        console.log('[StopOutEngine] Stop-out triggered for user:', user.id);
        // 4. Close all positions
        for (const position of positions) {
          const { error: deleteError } = await supabase
            .from('trade_orders')
            .delete()
            .eq('id', position.id);
          
          if (deleteError) {
            console.error('[StopOutEngine] Error closing position:', position.id, deleteError);
          } else {
            console.log('[StopOutEngine] Position closed:', position.id);
          }
        }
      }
    }
  }, 10000);
};
