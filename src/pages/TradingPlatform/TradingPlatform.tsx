import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import LightweightChart from './components/LightweightChart';
import LiveMarketFeed from './components/LiveMarketFeed';
import OrderBook from './components/OrderBook';
import MarketWatch from './components/MarketWatch';
import { LayoutDashboard } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { supabaseService } from '../../../supabaseService';
import { User, TradeAsset } from '../../../types';
import { useNotification } from '../../../components/NotificationContext';
import { useDynamicSpread } from '../../hooks/useDynamicSpread';
import { calculateAgentCommission } from '../../services/commissionService';

interface TradingPlatformProps {
  user: User;
  updateUserBalance: (userId: string, newBalance: number) => void;
}

const TradingPlatform: React.FC<TradingPlatformProps> = ({ user, updateUserBalance }) => {
  const getPrecision = (s: string): number => {
    if (s.includes('USD')) return 5;
    if (['XAUUSD', 'WTI', 'XAGUSD'].includes(s)) return 2;
    return 2;
  };

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Add sidebar state
  const [orderBook, setOrderBook] = useState<{ bids: [number, number][], asks: [number, number][] }>({ bids: [], asks: [] });
  const [spreads, setSpreads] = useState<Record<string, { value: number, mode: 'manual' | 'auto' }>>({});
  const { showNotification } = useNotification();

  const tradingStatus = useMemo(() => {
    const totalPnL = positions.reduce((acc, p) => {
      const asset = assets.find(a => a.symbol === p.asset_symbol);
      const price = Number(asset?.price || 0);
      const pnl = (price - p.entry_price) * p.amount * (p.type === 'buy' ? 1 : -1);
      return acc + pnl;
    }, 0);
    const equity = balance.balance + totalPnL;
    const margin = positions.reduce((acc, p) => acc + (Number(p.required_margin) || 0), 0);
    const freeMargin = equity - margin;
    const marginLevel = margin === 0 ? 0 : (equity / margin) * 100;
    return { equity, margin, freeMargin, marginLevel };
  }, [positions, assets, balance.balance]);

  const currentAsset = assets.find(a => a.symbol === symbol);
  const currentPrice = Number(currentAsset?.price || 0);
  const currentSpreadConfig = spreads[symbol] || { value: currentAsset?.spread || 0, mode: 'manual' };
  const dynamicSpread = useDynamicSpread(symbol, currentPrice, currentSpreadConfig.value, currentSpreadConfig.mode);
  const currentSpread = dynamicSpread;

  // Initial data fetch
  useEffect(() => {
    if (!user?.id) return;
    
    const init = async () => {
      await Promise.all([
        fetchWallet(),
        fetchInitialPositions(),
        fetchAssets(),
        fetchInitialTrades(),
        fetchSpreads()
      ]);
    };
    
    init();
  }, [user?.id]);

  const fetchSpreads = async () => {
    const { getSpreads } = await import('../../services/spreadService');
    const data = await getSpreads();
    setSpreads(data);
  };

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

    // 4. Fallback Polling (Ensures UI is ALWAYS up-to-date every 200ms)
    const pollingInterval = setInterval(() => {
        console.log('[Polling] Syncing trades and positions...');
        fetchInitialTrades();
        fetchInitialPositions();
    }, 200);

    // 2. Wallet Subscription
    const walletChannel = supabase
      .channel(`user_balance_${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, fetchWallet)
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
    let { data: userData } = await supabase.from('users').select('balance').eq('id', user.id).maybeSingle();
    if (userData) {
      setBalance(prev => ({ ...prev, balance: userData.balance || 0 }));
    }
  };

  const fetchInitialPositions = async () => {
    const { data } = await supabase
      .from('trade_orders')
      .select('*, platform_revenues(amount)')
      .eq('user_id', user.id)
      .eq('status', 'open');
    if (data) setPositions(data);
  };

  const handleTrade = async (type: 'Buy' | 'Sell') => {
    console.log('[TradingPlatform] handleTrade started:', { type, symbol, volume, currentPrice, currentSpread });

    if (!symbol) {
      console.error('[TradingPlatform] Symbol is missing!');
      alert("رمز الأصل غير محدد.");
      return;
    }

    if (!volume || volume <= 0) {
      console.error('[TradingPlatform] Invalid volume:', volume);
      alert("يرجى تحديد حجم صفقة صحيح.");
      return;
    }

    const { data: assetData, error: assetError } = await supabase
      .from('trade_assets')
      .select('price')
      .eq('symbol', symbol)
      .single();

    if (assetError || !assetData) {
      console.error('[TradingPlatform] Failed to fetch precise asset price:', assetError);
      alert("فشل جلب سعر الأصل. يرجى المحاولة مرة أخرى.");
      return;
    }

    const precision = getPrecision(symbol);
    const price = Number(assetData.price);
    
    // استخدام السبريد من الحالة المحلية بدلاً من قاعدة البيانات
    const spreadValue = (currentSpread || 0) * Math.pow(10, -precision);
    const executionPrice = type === 'Buy' ? price + spreadValue : price - spreadValue;

    console.log('[TradingPlatform] Execution details:', { price, spreadValue, executionPrice });

    // إضافة فحص للتأكد من وجود user.id
    if (!user || !user.id) {
      console.error('[TradingPlatform] User ID missing!');
      alert("خطأ: لم يتم التعرف على المستخدم. يرجى تسجيل الدخول مرة أخرى.");
      return;
    }

    const tradeAmount = volume * executionPrice;
    const spreadConfig = spreads[symbol] || { value: currentAsset?.spread || 0, mode: 'manual' };
    const commission = spreadConfig.value; // Assuming this is the value from Spread Manager
    const spread = currentSpread || 0;

    // 1. جلب بيانات الوكيل (إذا وجد)
    let agentProfit = 0;
    let adminProfit = commission; // الافتراضي أن كل الربح للمنصة
    let agentId = null;

    if (user.referred_by) {
      const { data: agent } = await supabase
        .from('users')
        .select('agent_percentage')
        .eq('id', user.referred_by)
        .single();

      if (agent && agent.agent_percentage > 0) {
        agentId = user.referred_by;
        agentProfit = calculateAgentCommission(agent.agent_percentage, commission);
        adminProfit = commission - agentProfit;
      }
    }

    // Margin Calculation (Leverage)
    const leverage = 100; 
    const contractSize = 100000;
    const requiredMargin = (volume * contractSize) / leverage;

    // Safety Lock: Check Free Margin
    const totalPnL = positions.reduce((acc, p) => {
      const asset = assets.find(a => a.symbol === p.asset_symbol);
      const price = Number(asset?.price || 0);
      const pnl = (price - p.entry_price) * p.amount * (p.type === 'buy' ? 1 : -1);
      return acc + pnl;
    }, 0);
    
    const equity = (user.balance || 0) + totalPnL;
    const totalMargin = positions.reduce((acc, p) => acc + (Number(p.required_margin) || 0), 0);
    const freeMargin = equity - totalMargin;

    // التحقق من الهامش المتاح قبل فتح الصفقة
    if (freeMargin < requiredMargin) {
      console.log('[TradingPlatform] Not enough Free Margin!');
      alert('الهامش المتاح غير كافٍ لفتح هذه الصفقة');
      return;
    }
    
    // إضافة فحص للتأكد من أن حجم التداول أكبر من صفر
    if (volume <= 0) {
      console.log('[TradingPlatform] Invalid volume:', volume);
      alert("يرجى إدخال حجم تداول صحيح أكبر من صفر!");
      return;
    }
    
    // استخدام الرصيد الحالي من الـ props مباشرة
    const currentBalance = user.balance || 0;
    
    // السبريد يُخصم فور فتح الصفقة
    // استخدام السبريد الفعلي من الأصل إذا كان متاحاً، وإلا نستخدم القيمة الافتراضية
    const totalDeduction = spread * volume * 1000; // مثال لحساب تكلفة السبريد
    
    console.log('[TradingPlatform] Trade check:', { volume, executionPrice, spread, totalDeduction, userBalance: currentBalance, user_id: user.id });
    
    if (currentBalance < totalDeduction) {
      console.log('[TradingPlatform] Insufficient balance for spread!');
      alert("الرصيد غير كافٍ لتغطية السبريد!");
      return;
    }

    // 2. Deduct amount
    console.log('[TradingPlatform] Deducting balance:', { oldBalance: currentBalance, totalDeduction, newBalance: currentBalance - totalDeduction });
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: currentBalance - totalDeduction })
      .eq('id', user.id);
      
    if (updateError) {
      console.error('[TradingPlatform] Deduct Error:', updateError);
      alert(`فشل خصم الرصيد: ${updateError.message}`);
      return;
    }
    console.log('[TradingPlatform] Balance deducted successfully.');
    updateUserBalance(user.id, currentBalance - totalDeduction);
    await fetchWallet();

    console.log('[TradingPlatform] Attempting trade:', { user_id: user.id, symbol, type, volume, executionPrice });

    const { data, error } = await supabase.from('trade_orders').insert({
      user_id: user.id, 
      username: user.username || 'User', 
      asset_symbol: symbol, 
      type: type.toLowerCase(), 
      amount: volume, 
      entry_price: executionPrice, 
      status: 'open',
      timestamp: new Date().toISOString(),
      required_margin: requiredMargin,
      bot_config: { commission, spread },
    }).select().single();

    if (error) {
      console.error('[TradingPlatform] Trade Insert Error:', error);
      // Rollback balance if trade insert fails
      console.log('[TradingPlatform] Rolling back balance...');
      await supabase.from('users').update({ balance: currentBalance }).eq('id', user.id);
      updateUserBalance(user.id, currentBalance);
      alert(`فشل تنفيذ الصفقة: ${error.message} (كود: ${error.code})`);
    } else {
      console.log('[TradingPlatform] Trade inserted successfully:', data);
      
      // Insert into platform_revenues
      supabase.from('platform_revenues').insert({
        trade_id: data.id,
        user_id: user.id,
        username: user.username || 'User',
        asset_symbol: symbol,
        amount: commission, // Use persistent commission
        agent_id: agentId,
        agent_profit: agentProfit,
        admin_profit: adminProfit,
        timestamp: new Date().toISOString() // Ensure timestamp is included
      }).then(async ({ error }) => {
        if (error) {
          console.error('[TradingPlatform] Revenue Log Error:', error);
        } else {
          // Update agent balance
          if (agentId && agentProfit > 0) {
            console.log('[TradingPlatform] Atomically updating agent balance:', { agentId, agentProfit });
            const { error: rpcError } = await supabase.rpc('increment_balance', {
              user_id: agentId,
              amount: agentProfit
            });
            
            if (rpcError) {
              console.error('[TradingPlatform] Error updating agent balance via RPC:', rpcError);
            } else {
              console.log('[TradingPlatform] Agent balance updated successfully via RPC.');
            }
          }

          // Update cumulative profits with logging
          const { data: stats, error: statsFetchError } = await supabase
            .from('platform_stats')
            .select('total_profits')
            .eq('id', 1)
            .single();

          if (statsFetchError) {
            console.error('[TradingPlatform] Error fetching stats:', statsFetchError);
          }

          const currentTotal = stats ? Number(stats.total_profits) : 0;
          const newTotal = currentTotal + commission;

          console.log('--- تتبع الأرباح ---');
          console.log('القيمة القديمة:', currentTotal);
          console.log('العمولة الجديدة:', commission);
          console.log('المجموع الجديد:', newTotal);

          const { error: upsertError } = await supabase
            .from('platform_stats')
            .upsert({ 
              id: 1, 
              total_profits: newTotal, 
              updated_at: new Date().toISOString() 
            }, { onConflict: 'id' });

          if (upsertError) {
            console.error('[TradingPlatform] Critical Update Error:', upsertError);
          } else {
            console.log('[TradingPlatform] Stats updated successfully to:', newTotal);
          }
        }
      });
      
      // Play sound on success
      const tradeSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      tradeSound.play().catch(e => console.error('Error playing sound:', e));

      // Log transaction
      await supabaseService.addTransaction({
        id: uuidv4(),
        userId: user.id,
        type: 'trade',
        amount: tradeAmount,
        relatedId: data.id,
        timestamp: new Date().toISOString(),
        status: 'completed',
        notes: `Trade opened for ${symbol}`
      });

      alert(`Success: ${type} order executed!`);
      // 3. Refresh UI
      fetchWallet(); // This fetches from 'wallets' table, might need to fetch from 'users' instead?
    }
  };

  const closePosition = async (position: any, isWin: boolean, profit: number) => {
    console.log('[TradingPlatform] Closing position:', position.id, { isWin, profit });

    if (isWin) {
      // 1. Fetch latest balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();
        
      if (userError || !userData) {
        alert("فشل التحقق من الرصيد!");
        return;
      }

      // 2. Add amount + profit
      const totalReturn = (position.amount * position.entry_price) + profit;
      console.log('[TradingPlatform] Adding profit:', { oldBalance: userData.balance, totalReturn, newBalance: userData.balance + totalReturn });
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: userData.balance + totalReturn })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('[TradingPlatform] Profit Error:', updateError);
        alert(`فشل تحديث الرصيد: ${updateError.message}`);
        return;
      }
      console.log('[TradingPlatform] Profit added successfully.');
      updateUserBalance(user.id, userData.balance + totalReturn);
      await fetchWallet();
      
      // 3. Show notification
      showNotification('Trade Result', `You won! Profit: $${profit.toFixed(2)}. Balance updated.`, 'money');
      
      // Log transaction
      await supabaseService.addTransaction({
        id: uuidv4(),
        userId: user.id,
        type: 'profit',
        amount: totalReturn,
        relatedId: position.id,
        timestamp: new Date().toISOString(),
        status: 'completed',
        notes: `Profit from trade ${position.id}`
      });
    } else {
      showNotification('Trade Result', 'You lost the trade.', 'money');
      
      // Log transaction
      await supabaseService.addTransaction({
        id: uuidv4(),
        userId: user.id,
        type: 'trade',
        amount: 0,
        relatedId: position.id,
        timestamp: new Date().toISOString(),
        status: 'completed',
        notes: `Loss from trade ${position.id}`
      });
    }

    // 4. Update status or delete
    const { error } = await supabase.from('trade_orders').delete().eq('id', position.id);
    if (error) {
      console.error('[TradingPlatform] Close Position Error:', error);
      alert(`فشل إغلاق الصفقة: ${error.message}`);
    } else {
      // Optimistic update
      setPositions(prev => prev.filter(p => p.id !== position.id));
      fetchWallet();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#0b0e11] text-slate-300 font-sans overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Compact Header */}
          <div className="h-10 bg-[#161a1e] border-b border-white/10 flex items-center px-2 gap-2 shrink-0">
            <button className="md:hidden p-1" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <LayoutDashboard size={18} className="text-white" />
            </button>
            <div className="flex-1 text-[10px] font-mono overflow-hidden whitespace-nowrap">
              {(assets || []).slice(0, 3).map(a => (
                <span key={a.id} className="mx-2">
                  {a.symbol}: <span className={(a.change_24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{Number(a.price || 0).toFixed(a.type === 'forex' ? 5 : 2)}</span>
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
            <div className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex w-80 flex-col absolute md:relative z-20 h-full bg-[#0b0e11] border-r border-white/10`}>
              <MarketWatch onSelectAsset={setSymbol} selectedSymbol={symbol} assets={assets} loading={assetsLoading} />
            </div>
            
            {/* Chart Area */}
            <div className="flex-1 p-1 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 relative">
                {assetsLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#161a1e] text-slate-400">
                    Loading Chart...
                  </div>
                ) : (
                  <LightweightChart 
                    symbol={symbol} 
                    livePrice={currentPrice}
                    digits={getPrecision(symbol)}
                    chartType={chartType}
                    setChartType={setChartType}
                    spread={currentSpread}
                  />
                )}
              </div>
              <div className="hidden md:block">
                <LiveMarketFeed trades={trades} />
              </div>
              <div className="hidden md:flex flex-1 bg-[#161a1e] border-t border-white/10 flex-col mt-2">
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#1e2329] text-slate-400 sticky top-0">
                      <tr>
                        <th className="p-2">Symbol</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Volume</th>
                        <th className="p-2">Entry</th>
                        <th className="p-2">Swap</th>
                        <th className="p-2">Comm</th>
                        <th className="p-2">Profit</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="relative">
                      <AnimatePresence>
                        {(positions || []).map(p => {
                          const asset = assets.find(a => a.symbol === p.asset_symbol);
                          const price = Number(asset?.price || 0);
                          const profit = ((price - (p?.entry_price || 0)) * (p?.amount || 0) * ((p?.type || 'buy') === 'buy' ? 1 : -1));
                          return (
                          <motion.tr 
                            key={p?.id} 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="p-2 font-bold text-white">{p?.asset_symbol}</td>
                            <td className={`p-2 font-bold uppercase ${(p?.type || 'buy') === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>{p?.type}</td>
                            <td className="p-2">{p?.amount}</td>
                            <td className="p-2 font-mono">{p?.entry_price?.toFixed(getPrecision(p.asset_symbol))}</td>
                            <td className="p-2 font-mono text-slate-400">0.00</td>
                            <td className="p-2 font-mono text-slate-400">{p?.bot_config?.commission ? `-${Number(p.bot_config.commission).toFixed(2)}` : '0.00'}</td>
                            <td className={`p-2 font-mono ${profit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                              {profit.toFixed(2)}
                            </td>
                            <td className="p-2">
                              <button onClick={() => {
                                closePosition(p, profit > 0, profit);
                              }} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors">
                                Close
                              </button>
                            </td>
                          </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                      <tr className="bg-[#1e2329] text-slate-200 font-bold border-t-2 border-white/10">
                        <td className="p-2" colSpan={2}>Account Summary</td>
                        <td className="p-2">Bal: {balance.balance.toFixed(2)}$</td>
                        <td className="p-2">Eq: {tradingStatus.equity.toFixed(2)}$</td>
                        <td className="p-2">Mar: {tradingStatus.margin.toFixed(2)}$</td>
                        <td className="p-2">Free: {tradingStatus.freeMargin.toFixed(2)}$</td>
                        <td className="p-2">Lev: {tradingStatus.marginLevel.toFixed(2)}%</td>
                        <td className="p-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="hidden md:flex w-64 bg-[#161a1e] border-l border-white/10 p-4 flex-col gap-4 shrink-0">
              {/* ... (Keep desktop controls) ... */}
              <div className="flex flex-col gap-1">
                <div className="text-xs text-slate-400 font-bold uppercase">Bid</div>
                <div className={`text-2xl font-mono font-bold text-red-400`}>{(currentPrice).toFixed(getPrecision(symbol))}</div>
                <div className="text-xs text-slate-400 font-bold uppercase mt-2">Ask</div>
                <div className={`text-2xl font-mono font-bold text-emerald-400`}>{(currentPrice + (currentSpread || 0)).toFixed(getPrecision(symbol))}</div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Lot Size</label>
                <input type="number" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value) || 0)} className="bg-[#1e2329] text-white p-2 rounded text-sm w-full border border-white/5 focus:border-sky-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => handleTrade('Buy')} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded text-sm font-bold transition-colors" disabled={!currentAsset}>BUY</button>
                <button onClick={() => handleTrade('Sell')} className="bg-red-600 hover:bg-red-500 text-white py-3 rounded text-sm font-bold transition-colors" disabled={!currentAsset}>SELL</button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Sticky Controls */}
        <div className="md:hidden h-24 bg-[#161a1e] border-t border-white/10 p-2 flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Lot</label>
                <input type="number" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value) || 0)} className="bg-[#1e2329] text-white p-2 rounded text-sm w-full border border-white/5 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2 h-full">
                <button onClick={() => handleTrade('Buy')} className="bg-emerald-600 text-white rounded text-lg font-bold transition-colors" disabled={!currentAsset}>BUY</button>
                <button onClick={() => handleTrade('Sell')} className="bg-red-600 text-white rounded text-lg font-bold transition-colors" disabled={!currentAsset}>SELL</button>
            </div>
        </div>
      </div>
  );

};

export default TradingPlatform;
