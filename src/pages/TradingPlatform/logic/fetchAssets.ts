// src/pages/TradingPlatform/logic/fetchAssets.ts
import { supabase } from '../../../../supabaseClient';

export const fetchAssets = async (setAssets: any, setAssetsLoading: any) => {
  const { data } = await supabase.from('trade_assets').select('*');
  if (data) {
    const sortedAssets = (data as any[]).sort((a, b) => a.symbol.localeCompare(b.symbol));
    setAssets(sortedAssets);
    setAssetsLoading(false);
  }
};
