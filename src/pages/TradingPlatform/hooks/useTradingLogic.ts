import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../../../supabaseClient';
import { ablyService } from '../../../services/ablyService';
import { listener } from '../logic/listener';
import { initApp } from '../logic/init';
import { fetchSpreads as fetchSpreadsFn } from '../logic/fetchSpreads';
import { fetchAssets as fetchAssetsFn } from '../logic/fetchAssets';
import { fetchInitialTrades as fetchInitialTradesFn } from '../logic/fetchInitialTrades';
import { fetchWallet as fetchWalletFn } from '../logic/fetchWallet';
import { fetchInitialPositions as fetchInitialPositionsFn } from '../logic/fetchInitialPositions';
import { handleTrade } from '../logic/handleTrade';
import { closePosition } from '../logic/closePosition';
import { TradeAsset } from '../../../../types';
import { calculateRequiredMargin, getContractSize, calculateBidAsk, getPrecision } from '../../../utils/marketUtils';
import { usePriceStore } from '../store/usePriceStore';
import { checkPendingOrders } from '../services/pendingOrdersService';

export const useTradingLogic = (user: any, updateUserBalance: (userId: string, newBalance: number) => void) => {
  const [symbol, setSymbol] = useState('EURUSD');
  const [marketData, setMarketData] = useState<any>({ bid: '0.00', ask: '0.00', price: '0.00', symbol: '' });
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [volume, setVolume] = useState<number>(0.1);
  const [sl, setSl] = useState<number | ''>('');
  const [tp, setTp] = useState<number | ''>('');
  const [isSlManuallyEdited, setIsSlManuallyEdited] = useState(false);
  const [isTpManuallyEdited, setIsTpManuallyEdited] = useState(false);
  const isInitialLoad = useRef(true);
  const lastCalculatedSymbol = useRef<string | null>(null);

  // Helper to get pip size
  const getPipSize = (symbol: string, precision: number) => {
    const s = symbol.toUpperCase();
    if (['US30', 'NAS100', 'GER40', 'SPX500'].includes(s)) return 1.0;
    if (s.includes('JPY')) return 0.01;
    if (s === 'XAUUSD' || s === 'XAGUSD') return 0.1;
    return 0.0001; // Default for Forex
  };

  const [spreads, setSpreads] = useState<Record<string, { value: number, mode: 'manual' | 'auto' }>>({});

  // Set default SL/TP
  useEffect(() => {
    // 3. Strict Symbol Validation: Ensure marketData matches active symbol
    if (marketData.symbol !== symbol) return;

    // حساب السبريد الفعلي من Ask و Bid
    const bid = Number(marketData.bid);
    const ask = Number(marketData.ask);
    const spread = Math.max(ask - bid, 0.0001); // ضمان قيمة موجبة على الأقل لمنع التلاصق

    // Throttling: 500ms
    const timeout = setTimeout(() => {
      if (isInitialLoad.current && bid && bid !== 0) {
        const precision = getPrecision(symbol);
        
        // المعادلة الجديدة: SL = Bid - (Spread * 1.5), TP = Bid + (Spread * 3)
        const slOffset = 1.5 * spread;
        const tpOffset = 3 * spread;
        
        if (!isSlManuallyEdited) setSl(Number((bid - slOffset).toFixed(precision)));
        if (!isTpManuallyEdited) setTp(Number((bid + tpOffset).toFixed(precision)));
        
        isInitialLoad.current = false;
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [marketData.bid, marketData.ask, symbol, marketData.symbol, isSlManuallyEdited, isTpManuallyEdited]);

  // Reset manual flags when symbol changes
  useEffect(() => {
    setIsSlManuallyEdited(false);
    setIsTpManuallyEdited(false);
    isInitialLoad.current = true;
  }, [symbol]);

  const setSlManual = (value: number | '') => {
    setSl(value);
    setIsSlManuallyEdited(true);
  };

  const setTpManual = (value: number | '') => {
    setTp(value);
    setIsTpManuallyEdited(true);
  };
  const commission = useMemo(() => {
    const spreadVal = spreads[symbol]?.value || 0;
    return volume * spreadVal * 10;
  }, [volume, symbol, spreads]);
  const [balance, setBalance] = useState({ balance: user?.balance || 0 });
  const [positions, setPositions] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [closedTrades, setClosedTrades] = useState<any[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assets, setAssets] = useState<TradeAsset[]>([]);
  const [orderMode, setOrderMode] = useState<'market' | 'pending'>('market');
  const [pendingType, setPendingType] = useState<'buy_limit' | 'sell_limit' | 'buy_stop' | 'sell_stop'>('buy_limit');
  const [triggerPrice, setTriggerPrice] = useState<number | ''>('');

  const latestPriceRef = useRef<number>(0);
  const candleSeriesRef = useRef<any>(null);
  const closingPositionsRef = useRef<Set<string>>(new Set());

  const prices = usePriceStore((state) => state.prices);

  // Reset and calculate SL/TP when symbol changes
  useEffect(() => {
    // 1. Calculate new values immediately based on current price
    const currentPrice = prices[symbol];
    if (currentPrice) {
        const bid = Number(currentPrice);
        const ask = Number(marketData.ask && marketData.symbol === symbol ? marketData.ask : currentPrice * 1.0001); // Fallback if ask not available
        const spread = Math.max(ask - bid, 0.0001);
        const precision = getPrecision(symbol);
        
        // المعادلة الجديدة: SL = Bid - (Spread * 2), TP = Bid + (Spread * 4)
        const slOffset = 2 * spread;
        const tpOffset = 4 * spread;
        
        setSl(Number((bid - slOffset).toFixed(precision)));
        setTp(Number((bid + tpOffset).toFixed(precision)));
        isInitialLoad.current = false; // Only set to false if calculated
    } else {
        // Fallback if price not available
        setSl('');
        setTp('');
        isInitialLoad.current = true; // Keep it true to try again in the other useEffect
    }
    lastCalculatedSymbol.current = symbol;
  }, [symbol, prices, marketData.ask, marketData.symbol]);

  // Auto-Close Engine (SL/TP Monitor)
  useEffect(() => {
    if (positions.length === 0) return;

    const interval = setInterval(() => {
      positions.forEach(pos => {
        if (pos.status !== 'open') return;
        if (closingPositionsRef.current.has(pos.id)) return;
        
        const currentPrice = pricesRef.current[pos.asset_symbol];
        if (!currentPrice) return;

        const asset = assetsRef.current.find(a => a.symbol === pos.asset_symbol);
        const spread = spreadsRef.current[pos.asset_symbol]?.value || asset?.spread || 0;
        const { bid: bidStr, ask: askStr } = calculateBidAsk(currentPrice, spread, pos.asset_symbol, asset?.type || 'forex', asset?.digits || 5);
        const bid = Number(bidStr);
        const ask = Number(askStr);

        let shouldClose = false;
        let closeReason = '';

        if (pos.type === 'buy') {
          // Buy positions close on Bid
          if (pos.sl && bid <= pos.sl) {
            shouldClose = true;
            closeReason = 'Stop Loss';
          } else if (pos.tp && bid >= pos.tp) {
            shouldClose = true;
            closeReason = 'Take Profit';
          }
        } else if (pos.type === 'sell') {
          // Sell positions close on Ask
          if (pos.sl && ask >= pos.sl) {
            shouldClose = true;
            closeReason = 'Stop Loss';
          } else if (pos.tp && ask <= pos.tp) {
            shouldClose = true;
            closeReason = 'Take Profit';
          }
        }

        if (shouldClose) {
          console.log(`[Auto-Close] Closing position ${pos.id} due to ${closeReason}`);
          closingPositionsRef.current.add(pos.id);
          const contractSize = getContractSize(pos.asset_symbol);
          const exitPrice = pos.type === 'buy' ? bid : ask;
          const entryPrice = Number(pos.entry_price);
          const amount = Number(pos.amount);
          const profit = (pos.type === 'buy' ? (exitPrice - entryPrice) : (entryPrice - exitPrice)) 
                        * amount * contractSize;
          const isWin = profit > 0;
          
          closePositionAction(pos, isWin, profit).finally(() => {
            closingPositionsRef.current.delete(pos.id);
          });
        }
      });
    }, 1000); // Check every second instead of on every price tick

    return () => clearInterval(interval);
  }, [positions]);

  const pricesRef = useRef(prices);
  const assetsRef = useRef(assets);
  const spreadsRef = useRef(spreads);

  useEffect(() => {
    pricesRef.current = prices;
    assetsRef.current = assets;
    spreadsRef.current = spreads;
  }, [prices, assets, spreads]);

  const fetchInitialPositions = useCallback(async () => {
    if (!user?.id) return;
    console.log('[useTradingLogic] Fetching initial positions for user:', user.id);
    const { data, error } = await supabase.from('trade_orders').select('*').eq('user_id', user.id).eq('status', 'open');
    if (error) {
      console.error('[useTradingLogic] Error fetching initial positions:', error);
      return;
    }
    console.log('[useTradingLogic] Initial positions fetched:', data?.length);
    setPositions(data || []);
  }, [user?.id]);

  const fetchInitialPendingOrders = useCallback(async () => {
    if (!user?.id) return;
    console.log('[useTradingLogic] Fetching initial pending orders for user:', user.id);
    const { data } = await supabase.from('trade_orders').select('*').eq('user_id', user.id).eq('status', 'pending');
    console.log('[useTradingLogic] Initial pending orders fetched:', data?.length);
    setPendingOrders(data || []);
  }, [user?.id]);

  // Pending Orders Engine
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      checkPendingOrders(pricesRef.current, assetsRef.current, spreadsRef.current, user.id, () => {
        fetchInitialPositions();
        fetchInitialPendingOrders();
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [user?.id, fetchInitialPositions, fetchInitialPendingOrders]);

  const tradingStatus = useMemo(() => {
    // 1. حساب إجمالي الأرباح والخسائر العائمة (Total Floating PnL)
    const totalPnL = positions.reduce((acc, p) => {
      const currentPrice = prices[p.asset_symbol] || p.entry_price;
      const contractSize = getContractSize(p.asset_symbol);
      
      // Profit = (Current Price - Entry Price) * Volume * Contract_Size (BUY)
      // Profit = (Entry Price - Current Price) * Volume * Contract_Size (SELL)
      const pnl = (p.type === 'buy' ? (currentPrice - p.entry_price) : (p.entry_price - currentPrice)) 
                  * p.amount * contractSize;
      return acc + pnl;
    }, 0);

    // 2. حساب السيولة (Equity)
    const equity = balance.balance + totalPnL;
    
    // 3. حساب الهامش الإجمالي المستخدم (Total Used Margin)
    // المعادلة: (Lot_Size * Contract_Size * Current_Price) / Leverage
    const leverage = 100; // الرافعة المالية الافتراضية
    const usedMargin = positions.reduce((acc, p) => {
      const contractSize = getContractSize(p.asset_symbol);
      const currentPrice = prices[p.asset_symbol] || p.entry_price;
      return acc + ((p.amount * contractSize * currentPrice) / leverage);
    }, 0);

    // 4. حساب الهامش الحر (Free Margin)
    const freeMargin = equity - usedMargin;
    
    // 5. حساب مستوى الهامش (Margin Level %)
    const marginLevel = usedMargin === 0 ? 0 : (equity / usedMargin) * 100;

    return { equity, margin: usedMargin, freeMargin, marginLevel };
  }, [positions, assets, balance.balance, prices]);

  const fetchAssets = useCallback(async () => {
    const { data } = await supabase.from('trade_assets').select('*');
    if (data) {
      const sortedAssets = (data as TradeAsset[]).sort((a, b) => a.symbol.localeCompare(b.symbol));
      setAssets(sortedAssets);
      setAssetsLoading(false);
    }
  }, []);

  const fetchInitialTrades = useCallback(async () => {
    console.log('[useTradingLogic] Fetching initial trades...');
    const { data, error } = await supabase.from('trade_orders').select('*, commission').eq('status', 'open').order('timestamp', { ascending: false }).limit(30);
    if (error) {
      console.error('[useTradingLogic] Error fetching initial trades:', error);
      return;
    }
    console.log('[useTradingLogic] Initial trades fetched:', data?.length);
    if (data) setTrades(data);
  }, []);

  const refreshWallet = useCallback(async () => {
    if (!user?.id) return;
    let { data: userData } = await supabase.from('users').select('balance').eq('id', user.id).maybeSingle();
    if (userData) setBalance(prev => ({ ...prev, balance: userData.balance || 0 }));
  }, [user?.id]);

  const fetchInitialHistory = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('trade_orders')
      .select('*')
      .eq('user_id', user.id)
      .or('status.eq.closed_profit,status.eq.closed_loss')
      .order('closed_at', { ascending: false })
      .limit(50);
    setClosedTrades(data || []);
  }, [user?.id]);

  const fetchSpreads = useCallback(async () => {
    const { getSpreads } = await import('../../../services/spreadService');
    const data = await getSpreads();
    setSpreads(data);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    initApp(
      () => fetchWalletFn(setBalance, user.id),
      fetchInitialPositions,
      fetchAssets,
      fetchInitialTrades,
      fetchSpreads
    );
    fetchInitialPendingOrders();
    fetchInitialHistory();

    // Real-time subscription for global trades
    const tradesSubscription = supabase
      .channel('public:trade_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trade_orders' }, (payload) => {
        console.log('[useTradingLogic] Trade change detected:', payload);
        
        if (payload.eventType === 'INSERT') {
          if (payload.new.status === 'open') {
            setTrades(prev => [payload.new, ...prev].slice(0, 30));
          }
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.status === 'open') {
            setTrades(prev => {
              const exists = prev.find(t => t.id === payload.new.id);
              if (exists) {
                return prev.map(t => t.id === payload.new.id ? payload.new : t);
              } else {
                return [payload.new, ...prev].slice(0, 30);
              }
            });
          } else {
            setTrades(prev => prev.filter(t => t.id !== payload.new.id));
          }
        } else if (payload.eventType === 'DELETE') {
          setTrades(prev => prev.filter(t => t.id !== payload.old.id));
        }
        
        // If it's the current user's trade, refresh their positions
        if ((payload.new as any)?.user_id === user.id || (payload.old as any)?.user_id === user.id) {
          fetchInitialPositions();
          fetchInitialPendingOrders();
          fetchInitialHistory();
        }
      })
      .subscribe();

    // Real-time subscription for spreads (site_config)
    const spreadsSubscription = supabase
      .channel('public:site_config')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_config', filter: 'id=eq=1' }, () => {
        console.log('[useTradingLogic] Spreads updated from control panel');
        fetchSpreads();
      })
      .subscribe();

    // Real-time subscription for assets
    const assetsSubscription = supabase
      .channel('public:trade_assets')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trade_assets' }, () => {
        console.log('[useTradingLogic] Assets updated from control panel');
        fetchAssets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tradesSubscription);
      supabase.removeChannel(spreadsSubscription);
      supabase.removeChannel(assetsSubscription);
    };
  }, [user?.id, fetchInitialPositions, fetchAssets, fetchInitialTrades, fetchSpreads, fetchInitialPendingOrders, fetchInitialHistory]);

  useEffect(() => {
    const asset = assets.find(a => a.symbol === symbol);
    if (asset) {
      const livePrice = pricesRef.current[symbol] || Number(asset.price);
      const correctedPrice = symbol === 'XAUUSD' ? livePrice * 1.94377 : livePrice;
      const spreadConfig = spreads[symbol] || { value: asset.spread || 0 };
      const { bid, ask } = calculateBidAsk(correctedPrice, spreadConfig.value, symbol, asset.type, asset.digits);
      setMarketData({
        price: correctedPrice,
        bid: Number(bid),
        ask: Number(ask),
        lastUpdate: Date.now(),
        symbol: symbol
      });
    }
  }, [symbol, assets, spreads]);

  const handleTradeAction = async (type: 'Buy' | 'Sell', skipFetch: boolean = false) => {
    const price = Number(marketData.price || 0);
    const requiredMargin = calculateRequiredMargin(volume, price, 100, symbol);

    if (tradingStatus.freeMargin < requiredMargin) {
      toast.error('Insufficient Margin');
      throw new Error('Insufficient Margin');
    }

    if (orderMode === 'pending' && (!triggerPrice || triggerPrice <= 0)) {
      toast.error('Invalid Entry Price');
      throw new Error('Invalid Entry Price');
    }

    // SL/TP Validation for Market Orders
    if (orderMode === 'market') {
      const asset = assets.find(a => a.symbol === symbol);
      const spread = spreads[symbol]?.value || asset?.spread || 0;
      const { bid: bidStr, ask: askStr } = calculateBidAsk(price, spread, symbol, asset?.type || 'forex', asset?.digits || 5);
      const bid = Number(bidStr);
      const ask = Number(askStr);

      if (type === 'Buy') {
        if (sl !== '' && sl >= bid) {
          toast.error('Stop Loss must be below current Bid price');
          throw new Error('Stop Loss must be below current Bid price');
        }
        if (tp !== '' && tp <= bid) {
          toast.error('Take Profit must be above current Bid price');
          throw new Error('Take Profit must be above current Bid price');
        }
      } else {
        if (sl !== '' && sl <= ask) {
          toast.error('Stop Loss must be above current Ask price');
          throw new Error('Stop Loss must be above current Ask price');
        }
        if (tp !== '' && tp >= ask) {
          toast.error('Take Profit must be below current Ask price');
          throw new Error('Take Profit must be below current Ask price');
        }
      }
    }

    try {
      const result = await handleTrade(
        type, 
        symbol, 
        volume, 
        marketData, 
        user.id, 
        () => {
          fetchInitialPositions();
          fetchInitialPendingOrders();
          fetchInitialTrades(); // Refresh global trades list
        }, 
        () => fetchWalletFn(setBalance, user.id), 
        commission, 
        requiredMargin,
        sl === '' ? undefined : sl,
        tp === '' ? undefined : tp,
        orderMode === 'pending' ? 'pending' : 'open',
        orderMode === 'pending' ? triggerPrice : undefined,
        orderMode === 'pending' ? pendingType : 'market',
        skipFetch
      );
      if (result && result.newBalance !== undefined) {
        updateUserBalance(user.id, result.newBalance);
      }
      toast.success(orderMode === 'pending' ? `Pending Order ${pendingType} placed` : `Position ${type} ${symbol} opened successfully`);
      setSl('');
      setTp('');
      setTriggerPrice('');
    } catch (err: any) {
      console.error('[handleTradeAction] Error:', err);
      const errorMessage = err?.message || 'Failed to open position';
      toast.error(errorMessage);
      throw err; // Re-throw to allow rollback in TradingPlatform
    }
  };

  const cancelPendingOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from('trade_orders').delete().eq('id', orderId);
      if (error) throw error;
      toast.success('Pending order cancelled');
      fetchInitialPendingOrders();
    } catch (err: any) {
      toast.error('Failed to cancel order');
    }
  };

  const closePositionAction = async (position: any, isWin: boolean, profit: number) => {
    // إذا كانت الصفقة معلقة (Optimistic)، لا نحاول حذفها من السيرفر
    if (position.pending) {
      setPositions(prev => prev.filter(p => p.id !== position.id));
      toast.success(`Position ${position.asset_symbol} cancelled.`);
      return;
    }

    try {
      const result = await closePosition(position, isWin, profit, user.id, () => fetchInitialPositionsFn(setPositions, user.id), () => fetchWalletFn(setBalance, user.id));
      if (result && result.newBalance !== undefined) {
        updateUserBalance(user.id, result.newBalance);
      }
      toast.success(`Position ${position.asset_symbol} closed. PnL: ${profit.toFixed(2)}$`);
    } catch (err: any) {
      console.error('[closePositionAction] Error:', err);
      const errorMessage = err?.message || 'Failed to close position';
      toast.error(errorMessage);
    }
  };

  const [isFeedActive, setIsFeedActive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const isWeekend = [0, 6].includes(new Date().getDay());
      if (!isWeekend && marketData.lastUpdate && Date.now() - marketData.lastUpdate > 10000) {
        setIsFeedActive(false);
      } else {
        setIsFeedActive(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [marketData.lastUpdate]);

  return {
    symbol, setSymbol,
    chartType, setChartType,
    volume, setVolume,
    sl, setSl, setSlManual,
    tp, setTp, setTpManual,
    orderMode, setOrderMode,
    pendingType, setPendingType,
    triggerPrice, setTriggerPrice,
    commission,
    balance, setBalance,
    tradingStatus,
    marketData, setMarketData,
    positions, setPositions,
    pendingOrders, setPendingOrders,
    closedTrades, setClosedTrades,
    assets, setAssets,
    trades, setTrades,
    assetsLoading, setAssetsLoading,
    spreads, setSpreads,
    latestPriceRef,
    candleSeriesRef,
    isFeedActive,
    fetchAssets,
    fetchInitialTrades,
    refreshWallet,
    fetchInitialPositions,
    fetchInitialPendingOrders,
    fetchInitialHistory,
    fetchSpreads,
    handleTradeAction,
    cancelPendingOrder,
    closePositionAction
  };
};
