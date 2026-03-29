import WebSocket from 'ws';

export const runPriceFeed = async (priceChannel: any, latestPrices: Record<string, number>) => {
  console.log('[Price Feed] runPriceFeed called!');
  console.log('[Price Feed] Master Sync started with Tiingo WebSockets.');

  const TIINGO_API_KEY = process.env.TIINGO_API_KEY || process.env.VITE_TIINGO_API_KEY;
  if (!TIINGO_API_KEY) {
    console.error('[Tiingo] CRITICAL: TIINGO_API_KEY is missing!');
    return;
  }

  const fxTickers = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'EURJPY', 'GBPJPY', 'EURGBP', 'XAUUSD', 'XAGUSD'];
  const cryptoTickers = ['BTCUSD', 'ETHUSD', 'SOLUSD'];
  
  const connectWS = (endpoint: string, tickers: string[], isCrypto: boolean) => {
    const ws = new WebSocket(`wss://api.tiingo.com/${endpoint}`);

    ws.on('open', () => {
      console.log(`[Tiingo WS ${endpoint}] Connected`);
      ws.send(JSON.stringify({
        eventName: 'subscribe',
        eventData: {
          authToken: TIINGO_API_KEY,
          tickers: tickers.map(t => t.toLowerCase())
        }
      }));
    });

    ws.on('message', (data: any) => {
      if (!data) return;
      const dataStr = data.toString();
      if (dataStr === 'undefined') return;
      try {
        const message = JSON.parse(dataStr);
        
        if (message.messageType === 'A' && Array.isArray(message.data)) {
          const d = message.data;
          const symbol = d[1].toUpperCase();
          
          let price = 0;
          if (isCrypto) {
            // Crypto format: ['T', 'btcusd', 'date', 'exchange', size, price]
            price = Number(d[5]);
          } else {
            // FX format: ['Q', 'eurusd', 'date', bidSize, bidPrice, midPrice, askSize, askPrice]
            // Use midPrice (d[5]) or bidPrice (d[4])
            price = Number(d[5] || d[4]);
          }
          
          if (!isNaN(price) && price > 0 && price !== 1000000) {
            latestPrices[symbol] = price;
            
            console.log(`[Price Engine] Publishing update for ${symbol}: ${price}`);
            
            priceChannel.publish('update', {
              symbol: symbol,
              price: price
            }).catch((err: any) => {
              console.error(`[Price Engine] Publish error for ${symbol}:`, err);
            });
          }
        }
      } catch (err) {
        console.error(`[Price Engine ${endpoint}] ❌ Parser Error:`, err);
      }
    });

    ws.on('close', () => {
      console.warn(`[Tiingo WS ${endpoint}] Disconnected. Reconnecting in 5s...`);
      setTimeout(() => connectWS(endpoint, tickers, isCrypto), 5000);
    });

    ws.on('error', (err) => {
      console.error(`[Tiingo WS ${endpoint}] Error:`, err);
      ws.close();
    });
  };

  let lastFetchTime = 0;

  // Fetch initial prices via REST API for weekend/fallback in a single request
  const fetchInitialPrices = async () => {
    // Cache: Don't fetch if last fetch was less than 1 minute ago
    if (Date.now() - lastFetchTime < 60000) {
      console.log('[Price Engine] Using cached prices, skipping fetch.');
      return;
    }

    console.log('[Price Engine] Fetching initial prices in a single REST API request...');
    
    try {
      const tickersParam = fxTickers.map(t => t.toLowerCase()).join(',');
      const url = `https://api.tiingo.com/tiingo/fx/top?tickers=${tickersParam}&token=${TIINGO_API_KEY}`;
      
      console.log(`[Price Engine] Fetching REST prices from ${url}`);
      const response = await fetch(url);
      
      if (response.status === 429) {
        console.warn('[Price Engine] Rate limited (429). Retrying in 30 seconds...');
        setTimeout(fetchInitialPrices, 30000);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          lastFetchTime = Date.now(); // Update cache time
          console.log('[REST] Success');
          for (const item of data) {
            const symbol = item.ticker.toUpperCase();
            const price = Number(item.midPrice || item.askPrice || item.bidPrice);
            
            if (price > 0) {
              latestPrices[symbol] = price;
              // console.log(`[Ably] Publishing update for ${symbol}: ${price}`);
              priceChannel.publish('update', { symbol, price });
            } else {
              console.warn(`[REST] Price for ${symbol} is 0 or invalid.`);
            }
          }
        } else {
          console.warn(`[REST] No data returned`);
        }
      } else {
        console.error(`[Price Engine] REST API failed: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error(`[Price Engine] Failed to fetch initial prices:`, err);
    }
  };
  
  // Run immediately and then every 5 minutes
  fetchInitialPrices();
  setInterval(fetchInitialPrices, 5 * 60 * 1000);

  connectWS('fx', fxTickers, false);
  connectWS('crypto', cryptoTickers, true);

  // Simulated live feed for assets not supported by Tiingo WS (Indices, Commodities)
  const simulatedTickers = ['US30', 'NAS100', 'SPX500', 'GER40', 'WTI', 'BRENT'];
  
  // Base prices to start the simulation if no real price is known yet
  const basePrices: Record<string, number> = {
    'US30': 39000,
    'NAS100': 18000,
    'SPX500': 5100,
    'GER40': 18200,
    'WTI': 82.5,
    'BRENT': 86.5
  };

  setInterval(() => {
    simulatedTickers.forEach(symbol => {
      // Use the latest known price or the base price
      let currentPrice = latestPrices[symbol] || basePrices[symbol];
      
      // Random walk: +/- 0.01% max change per tick
      const changePercent = (Math.random() - 0.5) * 0.0002; 
      currentPrice = currentPrice * (1 + changePercent);
      
      // Round to appropriate decimals
      const decimals = ['WTI', 'BRENT'].includes(symbol) ? 2 : 1;
      currentPrice = Number(currentPrice.toFixed(decimals));
      
      latestPrices[symbol] = currentPrice;

      priceChannel.publish('update', {
        symbol: symbol,
        price: currentPrice
      }).catch((err: any) => {
        console.error(`[Price Engine] Publish error for simulated ${symbol}:`, err);
      });
    });
  }, 2000); // Update every 2 seconds
};
