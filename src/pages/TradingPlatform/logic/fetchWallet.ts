// src/pages/TradingPlatform/logic/fetchWallet.ts
import { supabase } from '../../../../supabaseClient';

export const fetchWallet = async (setBalance: any, userId: string) => {
  const { data } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single();
  if (data) setBalance({ balance: data.balance });
};
