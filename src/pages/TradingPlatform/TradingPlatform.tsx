import React, { useState, useEffect } from 'react';
import TradingViewChart from './components/TradingViewChart';
import LiveMarketFeed from './components/LiveMarketFeed';
import OrderBook from './components/OrderBook';
import MarketWatch from './components/MarketWatch';
import { LayoutDashboard, BarChart3 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
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
  const [orderBook, setOrderBook] = useState<{ bids: [number, number][], asks: [number, number][] }>({ bids: [], asks: [] });
  const { showNotification } = useNotification();

  const currentAsset = assets.find(a => a.symbol === symbol);
  const currentPrice = currentAsset?.price || 0;

  useEffect(() => {
    if (!user) return;
    fetchWallet();
    fetchPositions();
    fetchAssets();

    // Direct Supabase Connection for Trades
    const fetchTradesDirect = async () => {
      try {
        // 1. جلب الصفقات الحقيقية
        const { data: realTrades } = await supabase
          .from('trade_orders')
          .select('*, users(username, is_bot)')
          .eq('status', 'open')
          .order('timestamp', { ascending: false })
          .limit(10);

        // 2. جلب صفقات البوتات مع أسماء البوتات الحقيقية
        const { data: botSimTrades } = await supabase
          .from('bot_trades_simulation')
          .select('*, bot_instances(name)')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(20);

        const flattenedReal = (realTrades || []).map((order: any) => ({
          ...order,
          username: order.users?.username || order.username || order.user_id,
          is_bot: order.users?.is_bot || false
        }));

        const flattenedBots = (botSimTrades || []).map((order: any) => ({
          ...order,
          id: order.id,
          username: order.bot_instances?.name || 'Bot Trader',
          asset_symbol: order.symbol,
          entry_price: order.price,
          timestamp: order.created_at,
          is_bot: true
        }));

        const allTrades = [...flattenedReal, ...flattenedBots].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 20);

        setTrades(allTrades);
        setIsConnected(true);
      } catch (err: any) {
        console.error('TradingPlatform Error:', err.message);
      }
    };

    fetchTradesDirect();

    const channel = supabase
      .channel('realtime_trading_v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, fetchWallet)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trade_orders' }, fetchTradesDirect)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bot_trades_simulation' }, fetchTradesDirect)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bot_instances' }, fetchTradesDirect)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trade_assets' }, (payload) => {
        setAssets(current => 
          current.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a)
        );
        if (payload.new.symbol === symbol) {
          const oldPrice = assets.find(a => a.symbol === symbol)?.price || 0;
          const newPrice = payload.new.price;
          setPriceColor(newPrice > oldPrice ? 'text-emerald-400' : newPrice < oldPrice ? 'text-red-400' : 'text-white');
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, symbol, assets.length]);

  const fetchAssets = async () => {
    console.log('[TradingPlatform] Fetching assets...');
    const { data, error } = await supabase.from('trade_assets').select('*');
    if (error) {
      console.error('[TradingPlatform] Asset Fetch Error:', error.message);
    } else if (data) {
      console.log('[TradingPlatform] Assets fetched:', data.length);
      setAssets(data as TradeAsset[]);
    }
  };

  const fetchWallet = async () => {
    let { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
    if (walletData) {
      setBalance({ balance: walletData.balance || 0, equity: walletData.equity || 0, margin: walletData.margin || 0, freeMargin: walletData.free_margin || 0 });
    } else {
      let { data: userData } = await supabase.from('users').select('balance').eq('id', user.id).single();
      setBalance({ balance: userData?.balance || 0, equity: userData?.balance || 0, margin: 0, freeMargin: userData?.balance || 0 });
    }
  };

  const fetchPositions = async () => {
    const { data } = await supabase.from('trade_orders').select('*').eq('user_id', user.id).eq('status', 'open');
    if (data) setPositions(data);
  };

  const handleTrade = async (type: 'Buy' | 'Sell') => {
    const price = currentPrice;
    if (!currentAsset) return;
    if (isNaN(volume) || volume <= 0) { alert("يرجى إدخال كمية صحيحة!"); return; }
    if (isNaN(price) || price <= 0) { alert("بانتظار تحديث السعر..."); return; }
    
    // حساب السعر مع السبريد
    const spreadValue = (currentAsset.spread || 0) * Math.pow(10, -(currentAsset.digits || 2));
    const executionPrice = type === 'Buy' ? price + spreadValue : price - spreadValue;

    const marginRequired = (volume * executionPrice) / 100;
    if (isNaN(marginRequired)) { alert("خطأ في حساب الهامش!"); return; }
    if (balance.freeMargin < marginRequired) { alert("الرصيد غير كافٍ!"); return; }

    const { data: pos, error: posError } = await supabase.from('trade_orders').insert({
      user_id: user.id, 
      username: user.username || 'User', 
      asset_symbol: symbol, 
      type: type.toLowerCase(), 
      amount: volume, 
      entry_price: executionPrice, 
      status: 'open',
      timestamp: new Date().toISOString()
    }).select().single();

    if (!posError && pos) {
      // Update wallet/balance
      await supabase.from('wallets').update({ 
        free_margin: balance.freeMargin - marginRequired, 
        margin: balance.margin + marginRequired 
      }).eq('user_id', user.id);

      await supabase.from('users').update({ 
        balance: balance.balance - marginRequired 
      }).eq('id', user.id);
      
      fetchPositions();
      fetchWallet();
      
      showNotification(`Success: ${type} order for ${volume} ${symbol} executed at ${executionPrice.toFixed(currentAsset.digits || 2)}`, 'success');
      alert(`Success: ${type} order executed!`);
    } else {
      showNotification(`Trade Failed: ${posError?.message || 'Unknown error'}`, 'error');
      alert(`حدث خطأ أثناء تنفيذ الصفقة: ${posError?.message || 'Unknown error'}`);
    }
  };

  const closePosition = async (position: any) => {
    try {
      const { error: posError } = await supabase
        .from('trade_orders')
        .update({ status: 'closed_profit' })
        .eq('id', position.id);

      if (posError) throw posError;

      const amount = position.amount || 0;
      const entryPrice = position.entry_price || 0;
      const marginToReturn = (amount * entryPrice) / 100;
      const profit = position.profit || 0;
      
      await supabase.from('users').update({ balance: balance.balance + profit }).eq('id', user.id);
      await supabase.from('wallets').update({ 
        free_margin: balance.freeMargin + marginToReturn + profit, 
        margin: Math.max(0, balance.margin - marginToReturn)
      }).eq('user_id', user.id);

      setPositions(prev => prev.filter(p => p.id !== position.id));
      fetchWallet();
      alert("تم إغلاق الصفقة بنجاح!");
    } catch (error: any) {
      alert(`حدث خطأ أثناء إغلاق الصفقة: ${error.message}`);
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0e11] text-slate-300 font-sans overflow-hidden">
      <div className="w-80 flex flex-col">
        <MarketWatch onSelectAsset={setSymbol} selectedSymbol={symbol} />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-[#131722] border-b border-white/10 flex items-center px-4 gap-4">
          <LayoutDashboard size={20} className="text-sky-400" />
          <div className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold ${isConnected ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="flex-1 text-xs font-mono overflow-hidden whitespace-nowrap">
            {assets.slice(0, 5).map(a => (
              <span key={a.id} className="mx-4">
                {a.symbol}: <span className={a.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>{a.price?.toFixed(a.digits || 2)}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 p-2 flex flex-col">
            <div className="flex-1"><TradingViewChart symbol={symbol.includes('USD') && !symbol.includes('BTC') ? `FX_IDC:${symbol}` : `BINANCE:${symbol}T`} /></div>
            <LiveMarketFeed trades={trades} />
          </div>
          <div className="w-64 bg-[#131722] border-l border-white/10 p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-white font-bold text-sm flex justify-between items-center">
                {symbol}
                <span className="text-[10px] text-slate-500 font-normal uppercase">{currentAsset?.category}</span>
              </h3>
              <p className="text-[10px] text-slate-500 italic">{currentAsset?.description}</p>
            </div>
            
            <div className={`text-3xl font-mono font-bold ${priceColor}`}>
              {currentPrice.toFixed(currentAsset?.digits || 2)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-slate-500">
              <div className="bg-white/5 p-2 rounded">
                Spread: <span className="text-white float-right">{currentAsset?.spread}</span>
              </div>
              <div className="bg-white/5 p-2 rounded">
                Digits: <span className="text-white float-right">{currentAsset?.digits}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-slate-500">Volume (Lots)</label>
              <input 
                type="number" 
                step="0.01"
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value) || 0)} 
                className="bg-[#1e2329] text-white p-2 rounded text-sm w-full border border-white/5 focus:border-sky-500 outline-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                onClick={() => handleTrade('Buy')} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded text-sm font-bold flex flex-col items-center transition-colors"
              >
                BUY
                <span className="text-[10px] opacity-80 font-normal">{(currentPrice + (currentAsset?.spread || 0) * Math.pow(10, -(currentAsset?.digits || 2))).toFixed(currentAsset?.digits || 2)}</span>
              </button>
              <button 
                onClick={() => handleTrade('Sell')} 
                className="bg-red-600 hover:bg-red-500 text-white py-3 rounded text-sm font-bold flex flex-col items-center transition-colors"
              >
                SELL
                <span className="text-[10px] opacity-80 font-normal">{(currentPrice - (currentAsset?.spread || 0) * Math.pow(10, -(currentAsset?.digits || 2))).toFixed(currentAsset?.digits || 2)}</span>
              </button>
            </div>
            
            <OrderBook symbol={symbol} bids={orderBook.bids} asks={orderBook.asks} />
          </div>
        </div>
        <div className="h-10 bg-[#1e2329] border-t border-white/10 flex items-center px-4 gap-6 text-xs font-mono">
          <span className="flex items-center gap-2">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Balance:</span> 
            <span className="text-white">${balance.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Free Margin:</span> 
            <span className="text-white">${balance.freeMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </span>
        </div>
        <div className="h-48 bg-[#131722] border-t border-white/10 overflow-y-auto">
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
            <tbody>
              {positions.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-2 font-bold text-white">{p.asset_symbol}</td>
                  <td className={`p-2 font-bold uppercase ${p.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>{p.type}</td>
                  <td className="p-2">{p.amount}</td>
                  <td className="p-2 font-mono">{p.entry_price?.toFixed(assets.find(a => a.symbol === p.asset_symbol)?.digits || 2)}</td>
                  <td className="p-2 font-mono text-slate-400">0.00</td>
                  <td className="p-2">
                    <button onClick={() => closePosition(p)} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors">
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradingPlatform;
