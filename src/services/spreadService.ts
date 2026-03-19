import { supabase } from '../../supabaseClient';

export const getSpreads = async (): Promise<Record<string, number>> => {
  const { data, error } = await supabase
    .from('site_config')
    .select('config')
    .eq('id', 1)
    .single();

  if (error || !data) return {};
  return data.config.spreads || {};
};

export const updateSpread = async (symbol: string, spread: number) => {
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
};
