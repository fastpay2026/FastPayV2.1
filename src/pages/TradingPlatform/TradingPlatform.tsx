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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trade_orders' }, (payload) => {
        const t = payload.new;
        const newTrade = {
          id: t.id,
          username: t.username || 'Trader',
          asset_symbol: t.asset_symbol,
          type: t.type as 'buy' | 'sell',
          amount: Number(t.amount || 0),
          entry_price: Number(t.entry_price || 0),
          created_at: t.timestamp || t.created_at || new Date().toISOString(),
          is_bot: t.is_bot
        };
        setTrades(prev => [newTrade, ...prev].slice(0, 30));
        if (t.status === 'open' && t.user_id === user.id) {
            setPositions(prev => [...prev, t]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trade_orders' }, (payload) => {
        const t = payload.new;
        if (t.status === 'open') {
            setPositions(prev => prev.map(p => p.id === t.id ? t : p));
        } else {
            setPositions(prev => prev.filter(p => p.id !== t.id));
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'trade_orders' }, (payload) => {
        setTrades(prev => prev.filter(t => t.id !== payload.old.id));
        setPositions(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, (payload) => {
        console.log('[Realtime] trades table change:', payload);
        fetchInitialTrades();
      })
      .subscribe();

    // 2. Wallet Subscription
    const walletChannel = supabase
      .channel(`wallet_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, fetchWallet)
      .subscribe();

    // 3. Asset Subscription
    const assetChannel = supabase
      .channel('public:trade_assets')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trade_assets' }, (payload) => {
        setAssets(current => {
          const index = current.findIndex(a => a.id === payload.new.id);
          if (index === -1) return [...current, payload.new as TradeAsset];
          const updated = [...current];
          updated[index] = { ...updated[index], ...payload.new };
          return updated;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(assetChannel);
    };
  }, [user?.id]);

  const fetchAssets = async () => {
    const { data } = await supabase.from('trade_assets').select('*');
    if (data) {
      setAssets(data as TradeAsset[]);
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
    await supabase.from('trade_orders').update({ status: 'closed' }).eq('id', position.id);
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
            <div className="flex-1 min-h-0">
              <LightweightChart 
                symbol={symbol} 
                livePrice={currentPrice}
                digits={currentAsset?.digits || 2}
              />
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
