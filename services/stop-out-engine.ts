import { SupabaseClient } from '@supabase/supabase-js';

let lastFetchUsersError = '';
const lastFetchPositionsErrorMap = new Map<string, string>();
const lastClosePositionErrorMap = new Map<string, string>();

export const runStopOutEngine = (supabase: SupabaseClient) => {
  setInterval(async () => {
    console.log('[StopOutEngine] Checking for stop-outs...');
    
    // 1. Fetch all users
    const { data: users, error: usersError } = await supabase.from('users').select('id, balance');
    if (usersError) {
      const errorMsg = usersError.message || JSON.stringify(usersError);
      if (errorMsg !== lastFetchUsersError) {
        console.error('[StopOutEngine] Error fetching users:', errorMsg);
        if (usersError.hint) {
          console.error('[StopOutEngine] Help hint:', usersError.hint);
        }
        lastFetchUsersError = errorMsg;
      }
      return;
    } else {
      lastFetchUsersError = ''; // Reset on success
    }

    for (const user of users) {
      // 2. Fetch user's positions
      const { data: positions, error: positionsError } = await supabase
        .from('trade_orders')
        .select('id, required_margin, entry_price, asset_symbol, type')
        .eq('user_id', user.id);
      
      if (positionsError) {
        const errorMsg = positionsError.message || JSON.stringify(positionsError);
        if (lastFetchPositionsErrorMap.get(user.id) !== errorMsg) {
          console.error('[StopOutEngine] Error fetching positions for user:', user.id, errorMsg);
          lastFetchPositionsErrorMap.set(user.id, errorMsg);
        }
        continue;
      } else {
        lastFetchPositionsErrorMap.delete(user.id);
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
            const errorMsg = deleteError.message || JSON.stringify(deleteError);
            if (lastClosePositionErrorMap.get(position.id) !== errorMsg) {
              console.error('[StopOutEngine] Error closing position:', position.id, errorMsg);
              lastClosePositionErrorMap.set(position.id, errorMsg);
            }
          } else {
            console.log('[StopOutEngine] Position closed:', position.id);
            lastClosePositionErrorMap.delete(position.id);
          }
        }
      }
    }
  }, 10000);
};
