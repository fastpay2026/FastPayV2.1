// src/pages/TradingPlatform/logic/fetchInitialTrades.ts
import { supabase } from '../../../../supabaseClient';

export const fetchInitialTrades = async (setTrades: any, userId: string) => {
  const { data } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (data) setTrades(data);
};
