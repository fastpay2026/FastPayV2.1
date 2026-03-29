export const getEffectiveSpread = (spread: number, symbol: string, assetType?: string) => {
  // Simple implementation for now, should be adjusted based on business logic
  return spread;
};

export const getContractSize = (symbol: string) => {
  const s = symbol.toUpperCase();
  
  // Crypto: Contract size is 1
  if (s.includes('BTC') || s.includes('ETH') || s.includes('SOL') || s.includes('XRP')) return 1;
  
  // Gold: Contract size is 100
  if (s === 'XAUUSD' || s === 'GOLD') return 100;
  
  // Forex: Standard contract size is 100,000
  return 100000;
};

export const calculateRequiredMargin = (volume: number, price: number, leverage: number = 100, symbol: string = '') => {
  const contractSize = getContractSize(symbol);
  return (volume * contractSize * price) / leverage;
};

export const getPrecision = (symbol: string, assetDigits?: number) => {
  const s = symbol.toUpperCase();
  
  // Hardcoded overrides for specific assets to ensure consistency
  if (s.includes('BTC') || s.includes('ETH') || s.includes('SOL')) return 2;
  if (['XAUUSD', 'XAGUSD', 'WTI', 'BRENT', 'US30', 'NAS100', 'GER40', 'SPX500'].includes(s)) return 2;
  if (s.includes('JPY')) return 3;

  // Use assetDigits if provided and not caught by overrides
  if (assetDigits !== undefined && assetDigits !== null) return assetDigits;
  
  // Fallbacks
  if (s.length === 6 || s.includes('USD')) return 5;
  return 2;
};

export const formatPrice = (price: number, symbol: string, assetDigits?: number): string => {
  const precision = getPrecision(symbol, assetDigits);
  return Number(price).toFixed(precision);
};

export const formatCurrency = (value: number): string => {
  return Number(value).toFixed(2);
};

export const calculateBidAsk = (price: number | string | null | undefined, spread: number | string | null | undefined, symbol: string, assetType?: string, digits?: number) => {
  const numPrice = parseFloat(String(price));
  const numSpread = parseFloat(String(spread));

  // Validation: If price is invalid or zero, return price as is for both bid and ask
  if (isNaN(numPrice) || numPrice <= 0) {
      return { bid: numPrice || 0, ask: numPrice || 0 };
  }
  
  // If spread is invalid, treat as 0
  const safeSpread = isNaN(numSpread) ? 0 : numSpread;

  const precision = getPrecision(symbol, digits);
  
  // Determine conversion factor based on precision
  let factor = 1;
  if (precision === 5) factor = 100000;
  else if (precision === 4) factor = 10000;
  else if (precision === 3) factor = 1000;
  else factor = 1;

  const convertedSpread = safeSpread / factor;

  const bid = numPrice - (convertedSpread / 2);
  const ask = numPrice + (convertedSpread / 2);
  
  return {
    bid: Number(bid.toFixed(precision)),
    ask: Number(ask.toFixed(precision))
  };
};
