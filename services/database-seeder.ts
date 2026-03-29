import { SupabaseClient } from '@supabase/supabase-js';

const coreAssets = [
  { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'forex', price: 1.0842 },
  { symbol: 'GBPUSD', name: 'Great Britain Pound / US Dollar', type: 'forex', price: 1.2654 },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', type: 'forex', price: 151.42 },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', type: 'forex', price: 0.6542 },
  { symbol: 'EURJPY', name: 'Euro / Japanese Yen', type: 'forex', price: 164.20 },
  { symbol: 'GBPJPY', name: 'Great Britain Pound / Japanese Yen', type: 'forex', price: 191.54 },
  { symbol: 'EURGBP', name: 'Euro / Great Britain Pound', type: 'forex', price: 0.8564 },
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', type: 'metal', price: 2425.40 },
  { symbol: 'XAGUSD', name: 'Silver / US Dollar', type: 'metal', price: 28.42 },
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', type: 'crypto', price: 96420 },
  { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', type: 'crypto', price: 2842.50 },
  { symbol: 'US30', name: 'Dow Jones 30', type: 'index', price: 39120 },
  { symbol: 'NAS100', name: 'Nasdaq 100', type: 'index', price: 18240 },
  { symbol: 'WTI', name: 'Crude Oil WTI', type: 'energy', price: 82.40 }
];

export const seedAssets = async (supabase: SupabaseClient) => {
  console.log('[Seed] Starting asset verification...');
  try {
    console.log(`[Seed] Attempting to upsert ${coreAssets.length} core assets...`);
    const { error } = await supabase
      .from('trade_assets')
      .upsert(coreAssets, { onConflict: 'symbol' });

    if (error) {
      console.error('[Seed] Critical Error during seeding:', error.message);
    } else {
      console.log('[Seed] Assets successfully verified and updated in database.');
    }
  } catch (err: any) {
    console.error('[Seed] Unexpected error during seeding:', err.message);
  }
};
