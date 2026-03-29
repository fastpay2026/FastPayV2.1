import { ablyService } from './ablyService';

// دالة جلب البيانات وتصديرها بالاسمين (لتجنب أخطاء الـ Export)
export const fetchMarketData = async (symbol: string, timeframe: string = '1m') => {
  console.log(`[marketService] Fetching market data for ${symbol}`);
  const response = await fetch(`/api/market/klines?symbols=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
  if (!response.ok) return [];
  const data = await response.json();
  return data[symbol.toUpperCase()] || [];
};
export const fetchHistoricalData = fetchMarketData;

// دالة الاشتراك الموحد (توحد السعر في الجدول والشارت)
export const subscribeToPrice = (symbol: string, callback: (data: any) => void) => {
  const channel = ablyService.getChannel(`market:${symbol}`);
  channel.subscribe('price-update', (msg) => {
    callback(msg.data); // يرسل السعر الجديد فوراً لكل المنصة
  });
  return () => { channel.unsubscribe(); channel.detach(); };
};

// دالة التذبذب لضمان عدم توقف الواجهة
export const getVolatility = (data: any[]) => {
  if (!data || data.length < 2) return 0;
  const last = data[data.length - 1][4];
  const prev = data[data.length - 2][4];
  return ((last - prev) / prev) * 100;
};
