import React, { useState, useEffect } from 'react';
import TradingViewChart from './components/TradingViewChart';
import LiveMarketFeed from './components/LiveMarketFeed';
import OrderBook from './components/OrderBook';
import { LayoutDashboard, BarChart3 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { User } from '../../../types';
import { useNotification } from '../../../components/NotificationContext';

interface TradingPlatformProps {
  user: User;
}

const TradingPlatform: React.FC<TradingPlatformProps> = ({ user }) => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [volume, setVolume] = useState(0.1);
  const [balance, setBalance] = useState({ balance: 31820, equity: 31820, margin: 0, freeMargin: 31820 });
  const [positions, setPositions] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({ BTCUSDT: 0, ETHUSDT: 0, SOLUSDT: 0 });
  const [priceColor, setPriceColor] = useState('text-white');
  const [prevPrice, setPrevPrice] = useState(0);
  const [trades, setTrades] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [orderBook, setOrderBook] = useState<{ bids: [number, number][], asks: [number, number][] }>({ bids: [], asks: [] });
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!user) return;
    fetchWallet();
    fetchPositions();

    // WebSocket Connection
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newPrice = parseFloat(data.c);
      setPrices(prev => {
        const oldPrice = prev[data.s] || 0;
        setPrevPrice(oldPrice);
        setPriceColor(newPrice > oldPrice ? 'text-emerald-400' : newPrice < oldPrice ? 'text-red-400' : 'text-white');
        return { ...prev, [data.s]: newPrice };
      });
    };

    // Direct Supabase Connection for Trades
    const fetchTradesDirect = async () => {
      try {
        console.log('TradingPlatform: Fetching trades directly from Supabase...');
        const { data, error } = await supabase
          .from('trade_orders')
          .select('*, users(username, is_bot)')
          .eq('status', 'open')
          .order('timestamp', { ascending: false })
          .limit(20);

        if (error) throw error;

        const flattenedData = (data || []).map((order: any) => ({
          ...order,
          username: order.users?.username || order.username || order.user_id,
          is_bot: order.users?.is_bot || false
        }));

        console.log('Direct Data Received:', flattenedData);
        setTrades(flattenedData);
        setIsConnected(true);
      } catch (err: any) {
        console.error('TradingPlatform: Direct fetch failed:', err.message);
      }
    };

    fetchTradesDirect();

    const channel = supabase
      .channel('realtime_trading')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, fetchWallet)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trade_orders' }, fetchPositions)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trade_orders' }, async (payload) => {
        console.log('TradingPlatform: [SUPABASE REALTIME] New trade detected:', payload.new);
        
        // Fetch the username for the new trade since the payload only has user_id
        const { data: userData } = await supabase
          .from('users')
          .select('username, is_bot')
          .eq('id', payload.new.user_id)
          .single();
          
        const tradeWithUser = {
          ...payload.new,
          username: userData?.username || 'Unknown',
          is_bot: userData?.is_bot || false
        };
        
        setTrades(prev => {
          const newTrades = [tradeWithUser, ...prev];
          // Sort by timestamp descending to mix bots and real users naturally
          return newTrades.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ).slice(0, 20);
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'trade_orders' }, (payload) => {
        console.log('TradingPlatform: [SUPABASE REALTIME] Trade deleted:', payload.old);
        setTrades(prev => prev.filter(t => t.id !== payload.old.id));
      })
      .subscribe((status) => {
        console.log('TradingPlatform: Supabase Realtime Status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    return () => {
      ws.close();
      supabase.removeChannel(channel);
    };
  }, [user, symbol]);

  const currentPrice = prices[symbol] || 0;

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
    if (isNaN(volume) || volume <= 0) { alert("يرجى إدخال كمية صحيحة!"); return; }
    if (isNaN(price) || price <= 0) { alert("بانتظار تحديث السعر..."); return; }
    
    const marginRequired = (volume * price) / 100;
    if (isNaN(marginRequired)) { alert("خطأ في حساب الهامش!"); return; }
    if (balance.freeMargin < marginRequired) { alert("الرصيد غير كافٍ!"); return; }

    const { data: pos, error: posError } = await supabase.from('trade_orders').insert({
      user_id: user.id, 
      username: user.username || 'User', 
      asset_symbol: symbol, 
      type: type.toLowerCase(), 
      amount: volume, 
      entry_price: price, 
      status: 'open',
      timestamp: new Date().toISOString()
    }).select().single();

    if (!posError && pos) {
      console.log('Trade Success:', pos);
      
      // Update wallet/balance
      const { error: walletUpdateError } = await supabase.from('wallets').update({ 
        free_margin: balance.freeMargin - marginRequired, 
        margin: balance.margin + marginRequired 
      }).eq('user_id', user.id);

      if (walletUpdateError) console.error('Wallet Update Error:', walletUpdateError);
      
      const { error: userUpdateError } = await supabase.from('users').update({ 
        balance: balance.balance - marginRequired 
      }).eq('id', user.id);

      if (userUpdateError) console.error('User Balance Update Error:', userUpdateError);
      
      fetchPositions();
      fetchWallet();
      
      showNotification(`Success: ${type} order for ${volume} ${symbol} executed at ${price.toFixed(2)}`, 'success');
      alert(`Success: ${type} order executed!`);
    } else {
      console.error('Trade Error:', posError);
      showNotification(`Trade Failed: ${posError?.message || 'Unknown error'}`, 'error');
      alert(`حدث خطأ أثناء تنفيذ الصفقة: ${posError?.message || 'Unknown error'}`);
    }
  };

  const closePosition = async (position: any) => {
    try {
      // 1. Update position status to CLOSED in Supabase
      const { error: posError } = await supabase
        .from('trade_orders')
        .update({ status: 'closed_profit' })
        .eq('id', position.id);

      if (posError) throw posError;

      // 2. Update user balance in Supabase
      // Use amount instead of volume as per handleTrade insert
      const amount = position.amount || position.volume || 0;
      const entryPrice = position.entry_price || 0;
      const marginToReturn = (amount * entryPrice) / 100;
      const profit = position.profit || 0;
      
      const { error: userError } = await supabase
        .from('users')
        .update({ balance: balance.balance + profit })
        .eq('id', user.id);
        
      if (userError) throw userError;

      // 3. Update wallet in Supabase
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          free_margin: balance.freeMargin + marginToReturn + profit, 
          margin: Math.max(0, balance.margin - marginToReturn)
        })
        .eq('user_id', user.id);
        
      if (walletError) throw walletError;

      // 4. Update UI immediately
      setPositions(prev => prev.filter(p => p.id !== position.id));
      fetchWallet();
      
      alert("تم إغلاق الصفقة بنجاح!");
    } catch (error: any) {
      console.error('Error closing order:', error);
      alert(`حدث خطأ أثناء إغلاق الصفقة: ${error.message}`);
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0e11] text-slate-300 font-sans overflow-hidden">
      <div className="w-64 bg-[#131722] border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 font-bold text-white flex items-center gap-2"><BarChart3 size={20} /> Market Watch</div>
        <div className="flex-1 overflow-y-auto">
          {['BTCUSDT', 'ETHUSDT', 'SOLUSDT'].map(s => (
            <button key={s} onClick={() => setSymbol(s)} className={`w-full p-4 text-left border-b border-white/5 ${symbol === s ? 'bg-sky-900/30 text-sky-400' : 'hover:bg-white/5'}`}>
              {s} <span className="float-right font-mono">{prices[s]?.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-[#131722] border-b border-white/10 flex items-center px-4 gap-4">
          <LayoutDashboard size={20} className="text-sky-400" />
          <button 
            onClick={async () => {
              try {
                const res = await fetch('/api/test-trade');
                const data = await res.json();
                console.log('Manual Trade Test:', data);
                if (data.success) {
                  showNotification('Manual test trade emitted successfully!');
                }
              } catch (err) {
                console.error('Manual Trade Test Failed:', err);
                alert('Manual Trade Test Failed. Check Console.');
              }
            }}
            className="px-2 py-0.5 text-[10px] bg-emerald-600 hover:bg-emerald-500 rounded border border-emerald-500 text-white font-bold"
          >
            Trigger Test Trade
          </button>
          <div className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold ${isConnected ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="flex-1 text-xs font-mono overflow-hidden whitespace-nowrap">
            {Object.entries(prices).map(([s, p]) => <span key={s} className="mx-4">{s}: {(p as number).toFixed(2)}</span>)}
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 p-2 flex flex-col">
            <div className="flex-1"><TradingViewChart symbol={`BINANCE:${symbol}`} /></div>
            <LiveMarketFeed trades={trades} />
          </div>
          <div className="w-48 bg-[#131722] border-l border-white/10 p-4 flex flex-col gap-4">
            <h3 className="text-white font-bold text-sm">Order: {symbol.split(':')[1]}</h3>
            <div className={`text-2xl font-bold ${priceColor}`}>{isNaN(currentPrice) ? '0.00' : currentPrice.toFixed(2)}</div>
            <input type="number" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value) || 0)} className="bg-[#1e2329] text-white p-2 rounded text-sm w-full" />
            <button onClick={() => handleTrade('Buy')} className="w-full bg-emerald-600 text-white py-1.5 rounded text-sm font-bold">BUY</button>
            <button onClick={() => handleTrade('Sell')} className="w-full bg-red-600 text-white py-1.5 rounded text-sm font-bold">SELL</button>
            <OrderBook symbol={symbol} bids={orderBook.bids} asks={orderBook.asks} />
          </div>
        </div>
        <div className="h-10 bg-[#1e2329] border-t border-white/10 flex items-center px-4 gap-6 text-xs font-mono">
          <span>Balance: ${isNaN(balance.balance) ? '0.00' : balance.balance.toFixed(2)}</span>
          <span>Free Margin: ${isNaN(balance.freeMargin) ? '0.00' : balance.freeMargin.toFixed(2)}</span>
        </div>
        <div className="h-48 bg-[#131722] border-t border-white/10 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e2329] text-slate-400 sticky top-0">
              <tr><th className="p-2">Symbol</th><th className="p-2">Type</th><th className="p-2">Volume</th><th className="p-2">Profit</th><th className="p-2">Action</th></tr>
            </thead>
            <tbody>
              {positions.map(p => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="p-2">{p.asset_symbol}</td>
                  <td className={p.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}>{p.type}</td>
                  <td className="p-2">{p.amount}</td>
                  <td className="text-slate-400">0.00</td>
                  <td className="p-2"><button onClick={() => closePosition(p)} className="bg-red-900/50 text-red-200 px-2 py-1 rounded">Close</button></td>
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
