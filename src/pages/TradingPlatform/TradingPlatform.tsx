import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LightweightChart from './components/LightweightChart';
import LiveMarketFeed from './components/LiveMarketFeed';
import OrderBook from './components/OrderBook';
import MarketWatch from './components/MarketWatch';
import { LayoutDashboard } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { User, TradeAsset } from '../../../types';
import { useNotification } from '../../../components/NotificationContext';

interface TradingPlatformProps {
  user: User;
}

const TradingPlatform: React.FC<TradingPlatformProps> = ({ user }) => {
  const [symbol, setSymbol] = useState('EURUSD');
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [volume, setVolume] = useState(0.1);
  const [balance, setBalance] = useState({ balance: 31820, equity: 31820, margin: 0, freeMargin: 31820 });
  const [positions, setPositions] = useState<any[]>([]);
  const [assets, setAssets] = useState<TradeAsset[]>([]);
  const [priceColor, setPriceColor] = useState('text-white');
  const [trades, setTrades] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [orderBook, setOrderBook] = useState<{ bids: [number, number][], asks: [number, number][] }>({ bids: [], asks: [] });
  const { showNotification } = useNotification();

  const currentAsset = assets.find(a => a.symbol === symbol);
  const currentPrice = Number(currentAsset?.price || 0);

  // Initial data fetch
  useEffect(() => {
    if (!user?.id) return;
    
    const init = async () => {
      await Promise.all([
        fetchWallet(),
        fetchInitialPositions(),
        fetchAssets(),
        fetchInitialTrades()
      ]);
    };
    
    init();
  }, [user?.id]);

  // Real-time synchronization
  useEffect(() => {
    if (!user?.id) return;

    console.log('[TradingPlatform] Setting up full real-time synchronization...');

    // 1. Unified Trade Subscription (Listening to BOTH tables)
    const tradesChannel = supabase
      .channel('trades-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trade_orders' }, (payload) => {
        console.log('[Realtime] trade_orders change:', payload);
        // Refresh data on any change
        fetchInitialTrades();
        fetchInitialPositions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, (payload) => {
        console.log('[Realtime] trades table change:', payload);
        fetchInitialTrades();
      })
      .subscribe();

    // 4. Fallback Polling (Ensures UI is ALWAYS up-to-date every 3 seconds)
    const pollingInterval = setInterval(() => {
        console.log('[Polling] Syncing trades and positions...');
        fetchInitialTrades();
        fetchInitialPositions();
    }, 3000);

    // 2. Wallet Subscription
    const walletChannel = supabase
      .channel(`wallet_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, fetchWallet)
      .subscribe();

    // 3. Asset Subscription
    const assetChannel = supabase
      .channel('public:trade_assets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trade_assets' }, (payload) => {
        console.log('[Realtime] Asset change:', payload);
        fetchAssets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(assetChannel);
      clearInterval(pollingInterval); // Clear polling
    };
  }, [user?.id]);

  const fetchAssets = async () => {
    const { data } = await supabase.from('trade_assets').select('*');
    if (data) {
      const sortedAssets = (data as TradeAsset[]).sort((a, b) => a.symbol.localeCompare(b.symbol));
      setAssets(sortedAssets);
      setAssetsLoading(false);
    }
  };

  const fetchInitialTrades = async () => {
    const { data } = await supabase
        .from('trade_orders')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(30);
    if (data) setTrades(data);
  };

  const fetchWallet = async () => {
    let { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
    if (walletData) {
      setBalance({ balance: walletData.balance || 0, equity: walletData.equity || 0, margin: walletData.margin || 0, freeMargin: walletData.free_margin || 0 });
    }
  };

  const fetchInitialPositions = async () => {
    const { data } = await supabase.from('trade_orders').select('*').eq('user_id', user.id).eq('status', 'open');
    if (data) setPositions(data);
  };

  const handleTrade = async (type: 'Buy' | 'Sell') => {
    const price = currentPrice;
    if (!currentAsset) return;
    
    const spreadValue = (currentAsset.spread || 0) * Math.pow(10, -(currentAsset.digits || 2));
    const executionPrice = type === 'Buy' ? price + spreadValue : price - spreadValue;

    const marginRequired = (volume * executionPrice) / 100;
    if (balance.freeMargin < marginRequired) { alert("الرصيد غير كافٍ!"); return; }

    console.log('[TradingPlatform] Attempting trade:', { user_id: user.id, symbol, type, volume, executionPrice });

    const { data, error } = await supabase.from('trade_orders').insert({
      user_id: user.id, 
      username: user.username || 'User', 
      asset_symbol: symbol, 
      type: type.toLowerCase(), 
      amount: volume, 
      entry_price: executionPrice, 
      status: 'open',
      timestamp: new Date().toISOString()
    });

    if (error) {
      console.error('[TradingPlatform] Trade Insert Error:', error);
      alert(`فشل تنفيذ الصفقة: ${error.message} (كود: ${error.code})`);
    } else {
      alert(`Success: ${type} order executed!`);
    }
  };

  const closePosition = async (position: any) => {
    console.log('[TradingPlatform] Deleting position:', position.id);
    const { error } = await supabase.from('trade_orders').delete().eq('id', position.id);
    if (error) {
      console.error('[TradingPlatform] Close Position Error:', error);
      alert(`فشل إغلاق الصفقة: ${error.message}`);
    } else {
      // Optimistic update
      setPositions(prev => prev.filter(p => p.id !== position.id));
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0e11] text-slate-300 font-sans overflow-hidden">
      <div className="w-80 flex flex-col">
        <MarketWatch onSelectAsset={setSymbol} selectedSymbol={symbol} assets={assets} loading={assetsLoading} />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-[#161a1e] border-b border-white/10 flex items-center px-4 gap-4">
          <LayoutDashboard size={20} className="text-sky-400" />
          <div className="flex-1 text-xs font-mono overflow-hidden whitespace-nowrap">
            {assets.slice(0, 5).map(a => (
              <span key={a.id} className="mx-4">
                {a.symbol}: <span className={a.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>{Number(a.price || 0).toFixed(a.type === 'forex' ? 5 : 2)}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 p-2 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 relative">
              {assetsLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#161a1e] text-slate-400">
                  Loading Chart...
                </div>
              ) : (
                <>
                  <div className="absolute top-2 right-2 z-20 flex bg-[#1e2329] rounded border border-white/5">
                    <button 
                      onClick={() => setChartType('candlestick')}
                      className={`px-3 py-1 text-[10px] uppercase font-bold ${chartType === 'candlestick' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Candles
                    </button>
                    <button 
                      onClick={() => setChartType('line')}
                      className={`px-3 py-1 text-[10px] uppercase font-bold ${chartType === 'line' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Line
                    </button>
                  </div>
                  <LightweightChart 
                    symbol={symbol} 
                    livePrice={currentPrice}
                    digits={currentAsset?.digits || 2}
                    chartType={chartType}
                  />
                </>
              )}
            </div>
            <LiveMarketFeed trades={trades} />
          </div>
          <div className="w-64 bg-[#161a1e] border-l border-white/10 p-4 flex flex-col gap-4">
            <div className={`text-3xl font-mono font-bold ${priceColor}`}>
              {Number(currentPrice || 0).toFixed(currentAsset?.digits || 2)}
            </div>
            <input 
              type="number" 
              step="0.01"
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value) || 0)} 
              className="bg-[#1e2329] text-white p-2 rounded text-sm w-full border border-white/5 focus:border-sky-500 outline-none" 
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                onClick={() => handleTrade('Buy')} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded text-sm font-bold flex flex-col items-center transition-colors"
                disabled={!currentAsset}
              >
                BUY
                <span className="text-[10px] opacity-80 font-normal">
                  {currentAsset ? (currentPrice + (currentAsset.spread || 0) * Math.pow(10, -(currentAsset.digits || 2))).toFixed(currentAsset.digits || 2) : '---'}
                </span>
              </button>
              <button 
                onClick={() => handleTrade('Sell')} 
                className="bg-red-600 hover:bg-red-500 text-white py-3 rounded text-sm font-bold flex flex-col items-center transition-colors"
                disabled={!currentAsset}
              >
                SELL
                <span className="text-[10px] opacity-80 font-normal">
                  {currentAsset ? (currentPrice - (currentAsset.spread || 0) * Math.pow(10, -(currentAsset.digits || 2))).toFixed(currentAsset.digits || 2) : '---'}
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className="h-48 bg-[#161a1e] border-t border-white/10 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e2329] text-slate-400 sticky top-0">
              <tr>
                <th className="p-2">Symbol</th>
                <th className="p-2">Type</th>
                <th className="p-2">Volume</th>
                <th className="p-2">Entry</th>
                <th className="p-2">Profit</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody className="relative">
              <AnimatePresence>
                {positions.map(p => (
                  <motion.tr 
                    key={p.id} 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-2 font-bold text-white">{p.asset_symbol}</td>
                    <td className={`p-2 font-bold uppercase ${p.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>{p.type}</td>
                    <td className="p-2">{p.amount}</td>
                    <td className="p-2 font-mono">{p.entry_price?.toFixed(assets.find(a => a.symbol === p.asset_symbol)?.digits || 2)}</td>
                    <td className="p-2 font-mono text-slate-400">
                      {((currentPrice - p.entry_price) * p.amount * (p.type === 'buy' ? 1 : -1)).toFixed(2)}
                    </td>
                    <td className="p-2">
                      <button onClick={() => closePosition(p)} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors">
                        Close
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradingPlatform;
