// src/pages/TradingPlatform/logic/fetchInitialPositions.ts
import { supabase } from '../../../../supabaseClient';

export const fetchInitialPositions = async (setPositions: any, userId: string) => {
  const { data } = await supabase
    .from('trade_orders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open');
  if (data) setPositions(data);
};
