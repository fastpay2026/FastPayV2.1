import { supabase } from '../../supabaseClient';

export const getSpreads = async (): Promise<Record<string, { value: number, mode: 'manual' | 'auto', commission?: number }>> => {
  const { data, error } = await supabase
    .from('site_config')
    .select('config')
    .eq('id', 1)
    .single();

  if (error || !data) return {};
  // ضمان التوافق مع الهيكلية القديمة والجديدة
  const spreads = data.config.spreads || {};
  const formattedSpreads: Record<string, { value: number, mode: 'manual' | 'auto', commission?: number }> = {};
  
  Object.keys(spreads).forEach(key => {
    const val = spreads[key];
    formattedSpreads[key] = typeof val === 'number' 
      ? { value: val, mode: 'manual' } 
      : val;
  });
  
  return formattedSpreads;
};

export const updateSpread = async (symbol: string, spread: { value: number, mode: 'manual' | 'auto', commission?: number }) => {
  const { data: currentConfig, error: fetchError } = await supabase
    .from('site_config')
    .select('config')
    .eq('id', 1)
    .single();

  if (fetchError || !currentConfig) return;

  const newConfig = {
    ...currentConfig.config,
    spreads: {
      ...currentConfig.config.spreads,
      [symbol]: spread
    }
  };

  await supabase
    .from('site_config')
    .update({ config: newConfig })
    .eq('id', 1);

  // Update trade_assets table to keep it in sync
  await supabase
    .from('trade_assets')
    .update({ spread: spread.value, commission: spread.commission })
    .eq('symbol', symbol);
};
