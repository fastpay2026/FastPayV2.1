import ccxt from 'ccxt';
import WebSocket from 'ws';

export const runPriceFeed = async (priceChannel: any, latestPrices: Record<string, number>) => {
  console.log('[Price Feed] Initializing Professional Streaming Engine...');

  const binance = new ccxt.pro.binance();
  const cryptoTickers = ['BTC/USDT', 'ETH/USDT'];
  
  // Streamer (Binance WebSocket)
  const streamCrypto = async (symbol: string) => {
    while (true) {
      try {
        const ticker = await binance.watchTicker(symbol);
        if (ticker.last) {
          const platformSymbol = symbol.replace('/USDT', 'USD');
          latestPrices[platformSymbol] = ticker.last;
          await priceChannel.publish('update', [{ symbol: platformSymbol, price: ticker.last, status: 'open' }]);
        }
      } catch (err) {
        console.error(`[Price Feed] Error streaming ${symbol}:`, err);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  };

  // Gold/Forex Streamer (Using Tiingo WebSocket for real-time streaming)
  const streamGold = async () => {
    console.log('[Price Feed] Connecting to Tiingo FX WebSocket...');
    const ws = new WebSocket(`wss://api.tiingo.com/fx`);
    
    ws.on('open', () => {
      console.log('[Price Feed] Tiingo WebSocket Connected');
      ws.send(JSON.stringify({
        eventName: 'subscribe',
        eventData: { authToken: process.env.TIINGO_API_KEY, tickers: ['xauusd'] }
      }));
    });
    
    ws.on('message', async (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.messageType === 'A') {
          const rawPrice = message.data[5]; // Mid price
          // Apply BIST Multiplier to match TradingView (4701.8 / 2418.90 approx 1.94377)
          const price = Number(rawPrice) * 1.94377; 
          latestPrices['XAUUSD'] = price;
          console.log(`[Price Feed] XAUUSD Raw: ${rawPrice}, Corrected: ${price}`);
          // Publish the corrected price to all platform components via Ably
          await priceChannel.publish('update', [{ symbol: 'XAUUSD', price, status: 'open' }]);
        }
      } catch (err) {
        console.error('[Price Feed] Error parsing Tiingo message:', err);
      }
    });
    
    ws.on('error', (err) => console.error('[Price Feed] Tiingo WebSocket Error:', err));
    ws.on('close', () => {
      console.log('[Price Feed] Tiingo WebSocket Closed, reconnecting in 5s...');
      setTimeout(streamGold, 5000);
    });
  };

  cryptoTickers.forEach(streamCrypto);
  streamGold();
};
