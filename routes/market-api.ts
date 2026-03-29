import { Router } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { generateDummyKlines } from '../utils/helpers';

export const marketRouter = (supabase: SupabaseClient) => {
  const router = Router();
  
  router.use((req, res, next) => {
    console.log(`[MarketAPI] Received request: ${req.method} ${req.originalUrl}`);
    next();
  });

  const klineCache = new Map<string, { data: any[], timestamp: number }>();
  const KLINE_CACHE_TTL = 300000; // 5 minutes

  router.get('/debug', (req, res) => {
    res.json({
      now: Date.now(),
      nowStr: new Date().toISOString()
    });
  });

  router.get('/klines', async (req, res) => {
    console.log(`[Klines] Received request for symbols: ${req.query.symbols}, timeframe: ${req.query.timeframe}`);
    try {
      const { symbols, timeframe = '1m' } = req.query;
      if (!symbols) return res.json({});

      const rawSymbols = symbols.toString().split(',').map(s => s.trim().toUpperCase());
      const tf = timeframe.toString();
      const now = Date.now();
      const results: Record<string, any[]> = {};

      for (const rawSymbol of rawSymbols) {
        const cacheKey = `${rawSymbol}_${tf}`;
        const cached = klineCache.get(cacheKey);
        if (cached && (now - cached.timestamp < KLINE_CACHE_TTL)) {
          results[rawSymbol] = cached.data;
          continue;
        }

        const isIndexOrCommodity = ['US30', 'NAS100', 'SPX500', 'GER40', 'WTI', 'BRENT'].includes(rawSymbol);
        
        let klines: any[] = [];
        // ... (rest of the logic for fetching klines)
        // I need to implement the fetching logic here.
        // This is going to be a large edit.

      if (!isIndexOrCommodity) {
        console.log(`[Klines] Fetching live historical data for ${rawSymbol} (${tf}) from Tiingo...`);
        
        const TIINGO_API_KEY = process.env.TIINGO_API_KEY || process.env.VITE_TIINGO_API_KEY;

        if (TIINGO_API_KEY) {
          try {
            const tfLower = tf.toLowerCase();
            const tfMap: Record<string, string> = {
              '1m': '1min', '5m': '5min', '15m': '15min', '30m': '30min',
              '1h': '1hour', '4h': '4hour', '1d': '1day', '1w': '1week'
            };
            const resampleFreq = tfMap[tfLower] || '1min';
            const isCrypto = ['BTCUSD', 'ETHUSD', 'SOLUSD'].includes(rawSymbol);
            const endpoint = isCrypto ? 'crypto' : 'fx';
            
            // Request enough data based on timeframe to ensure enough candles for indicators (like EMA 200)
            const startDate = new Date();
            if (['1d', '1w'].includes(tfLower)) {
              startDate.setFullYear(startDate.getFullYear() - 1); // 1 year for daily/weekly to avoid limits
            } else if (['1h', '4h'].includes(tfLower)) {
              startDate.setDate(startDate.getDate() - 30); // 30 days for hourly (720 candles)
            } else {
              startDate.setHours(startDate.getHours() - 12); // 12 hours for minutes (720 candles)
            }
            const startDateStr = startDate.toISOString().split('T')[0];
            
            const url = `https://api.tiingo.com/tiingo/${endpoint}/prices?tickers=${rawSymbol.toLowerCase()}&resampleFreq=${resampleFreq}&startDate=${startDateStr}&token=${TIINGO_API_KEY}`;
            console.log(`[Klines] Tiingo API URL for ${rawSymbol}: ${url}`);
            
            const fetchTiingoData = async (url: string) => {
              const response = await fetch(url);
              if (response.ok) {
                const data = await response.json();
                let priceData = [];
                if (isCrypto && data && data.length > 0 && data[0].priceData) {
                  priceData = data[0].priceData;
                } else if (!isCrypto && Array.isArray(data)) {
                  priceData = data;
                }
                return { ok: true, data: priceData };
              }
              return { ok: false, status: response.status, statusText: response.statusText };
            };

            let response = await fetchTiingoData(url);
            console.log(`[Klines] Tiingo API response status for ${rawSymbol}: ${response.ok ? 'OK' : response.status}`);
            if (!response.ok) {
              console.log(`[Klines] Tiingo API response body: ${JSON.stringify(response)}`);
            }
            
            if (!response.ok && response.status === 429) {
              console.warn(`[Klines] Tiingo API returned 429 for ${rawSymbol}. Retrying once after 5s...`);
              await new Promise(resolve => setTimeout(resolve, 5000));
              response = await fetchTiingoData(url);
            }

            if (response.ok) {
              const priceData = response.data;
              if (priceData.length > 0) {
                klines = priceData.map((d: any) => [
                  new Date(d.date).getTime(),
                  d.open,
                  d.high,
                  d.low,
                  d.close,
                  d.volume || 0
                ]);
                
                klines.sort((a, b) => a[0] - b[0]);

                if (klines.length > 1000) {
                  klines = klines.slice(-1000);
                }

                const lastCandleTime = klines[klines.length - 1][0];
                if (now - lastCandleTime > 2 * 24 * 60 * 60 * 1000) {
                  console.warn(`[Klines] Tiingo data is too old (last candle: ${new Date(lastCandleTime).toISOString()}). Discarding and using fallback...`);
                  klines = [];
                }
              } else {
                console.warn(`[Klines] Tiingo returned empty data for ${rawSymbol}.`);
              }
            } else {
              console.warn(`[Klines] Tiingo API returned ${response.status} ${response.statusText} for ${rawSymbol}.`);
            }
          } catch (err) {
            console.error(`[Klines] Error fetching from Tiingo for ${rawSymbol}:`, err);
          }
        } else {
          console.warn(`[Klines] Tiingo API key is missing. Skipping Tiingo fetch for ${rawSymbol}.`);
        }
      }

      // Fallback to Binance (Crypto) or Yahoo Finance (FX) if Tiingo fails or returns empty
      if (klines.length === 0) {
        if (!isIndexOrCommodity) {
          console.info(`[Klines] Tiingo data unavailable for ${rawSymbol}, using fallback API.`);
        } else {
          console.log(`[Klines] Fetching historical data for ${rawSymbol} (${tf}) from Yahoo Finance...`);
        }
        try {
          const tfLower = tf.toLowerCase();
          const isCrypto = ['BTCUSD', 'ETHUSD', 'SOLUSD'].includes(rawSymbol);
          
          if (isCrypto) {
            // Binance Fallback
            const binanceSymbol = rawSymbol === 'BTCUSD' ? 'BTCUSDT' : (rawSymbol === 'ETHUSD' ? 'ETHUSDT' : 'SOLUSDT');
            const binanceIntervals: Record<string, string> = {
              '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
              '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w'
            };
            const interval = binanceIntervals[tfLower] || '1m';
            const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=1000`;
            
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              klines = data.map((d: any) => [
                d[0], // timestamp
                parseFloat(d[1]), // open
                parseFloat(d[2]), // high
                parseFloat(d[3]), // low
                parseFloat(d[4]), // close
                parseFloat(d[5])  // volume
              ]);
            }
          } else {
            // Yahoo Finance Fallback for FX, Metals, Indices, Commodities
            const yahooSymbolMap: Record<string, string> = {
              'US30': 'YM=F',
              'NAS100': 'NQ=F',
              'SPX500': 'ES=F',
              'GER40': '^GDAXI',
              'XAUUSD': 'GC=F',
              'XAGUSD': 'SI=F',
              'WTI': 'CL=F',
              'BRENT': 'BZ=F'
            };
            const yahooSymbol = yahooSymbolMap[rawSymbol] || `${rawSymbol}=X`;
            
            const yahooIntervals: Record<string, string> = {
              '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
              '1h': '1h', '4h': '1h', // Yahoo doesn't have 4h, fallback to 1h
              '1d': '1d', '1w': '1wk'
            };
            const interval = yahooIntervals[tfLower] || '1m';
            
            // Determine range based on interval
            let range = '5d';
            if (['1d', '1w'].includes(tfLower)) range = '2y';
            else if (['1h', '4h'].includes(tfLower)) range = '1mo';
            else range = '5d';

            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
            console.log(`[Klines] Yahoo Finance URL: ${url}`);
            
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              const result = data.chart?.result?.[0];
              if (result && result.timestamp && result.indicators?.quote?.[0]) {
                const timestamps = result.timestamp;
                const quote = result.indicators.quote[0];
                
                let currentCandle: any = null;

                for (let i = 0; i < timestamps.length; i++) {
                  if (quote.open[i] !== null && quote.high[i] !== null && quote.low[i] !== null && quote.close[i] !== null) {
                    const timeMs = timestamps[i] * 1000;
                    
                    // Align timestamp to timeframe
                    let periodStartMs = timeMs;
                    const date = new Date(timeMs);
                    
                    if (tfLower === '1d') {
                      date.setUTCHours(0, 0, 0, 0);
                      periodStartMs = date.getTime();
                    } else if (tfLower === '1w') {
                      const day = date.getUTCDay();
                      const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                      date.setUTCDate(diff);
                      date.setUTCHours(0, 0, 0, 0);
                      periodStartMs = date.getTime();
                    } else if (tfLower === '4h') {
                      const hours = date.getUTCHours();
                      const periodStartHours = Math.floor(hours / 4) * 4;
                      date.setUTCHours(periodStartHours, 0, 0, 0);
                      periodStartMs = date.getTime();
                    } else if (tfLower === '1h') {
                      date.setUTCMinutes(0, 0, 0);
                      periodStartMs = date.getTime();
                    } else if (tfLower === '30m') {
                      const mins = date.getUTCMinutes();
                      date.setUTCMinutes(Math.floor(mins / 30) * 30, 0, 0);
                      periodStartMs = date.getTime();
                    } else if (tfLower === '15m') {
                      const mins = date.getUTCMinutes();
                      date.setUTCMinutes(Math.floor(mins / 15) * 15, 0, 0);
                      periodStartMs = date.getTime();
                    } else if (tfLower === '5m') {
                      const mins = date.getUTCMinutes();
                      date.setUTCMinutes(Math.floor(mins / 5) * 5, 0, 0);
                      periodStartMs = date.getTime();
                    } else {
                      date.setUTCSeconds(0, 0);
                      periodStartMs = date.getTime();
                    }

                    if (!currentCandle || currentCandle[0] !== periodStartMs) {
                      if (currentCandle) klines.push(currentCandle);
                      currentCandle = [
                        periodStartMs,
                        quote.open[i],
                        quote.high[i],
                        quote.low[i],
                        quote.close[i],
                        quote.volume?.[i] || 0
                      ];
                    } else {
                      currentCandle[2] = Math.max(currentCandle[2], quote.high[i]);
                      currentCandle[3] = Math.min(currentCandle[3], quote.low[i]);
                      currentCandle[4] = quote.close[i];
                      currentCandle[5] += quote.volume?.[i] || 0;
                    }
                  }
                }
                if (currentCandle) klines.push(currentCandle);
              }
            }
          }
        } catch (fallbackErr) {
          console.error(`[Klines] Fallback API error:`, fallbackErr);
        }
      }

      // Final fallback to dummy data if everything fails
      if (klines.length === 0) {
        console.log(`[Klines] All APIs failed. Falling back to simulated historical data for ${rawSymbol}...`);
        const { data: asset } = await supabase.from('trade_assets').select('price').eq('symbol', rawSymbol).single();
        klines = generateDummyKlines(100, Number(asset?.price || 1.1));
      }

        klineCache.set(cacheKey, { data: klines, timestamp: now });
        results[rawSymbol] = klines;
      }
      return res.json(results);
    } catch (e) {
      res.json({});
    }
  });

  return router;
};
