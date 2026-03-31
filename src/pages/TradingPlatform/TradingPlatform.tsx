
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';
import { ablyService } from '../../services/ablyService';
import { User, TradeAsset } from '../../../types';
import { useNotification } from '../../../components/NotificationContext';
import { useTradingLogic } from './hooks/useTradingLogic';
import { usePositionsTable } from './hooks/usePositionsTable';
import { usePriceStore } from './store/usePriceStore';
import { useDynamicSpread } from '../../hooks/useDynamicSpread';
import { getPrecision, calculateBidAsk, formatPrice } from '../../utils/marketUtils';

// Import modular logic
import { listener } from './logic/listener';

import LightweightChart from './components/LightweightChart';
import LiveMarketFeed from './components/LiveMarketFeed';
import TradingHeader from './components/TradingHeader';
import MarketWatchSidebar from './components/MarketWatchSidebar';
import ChartArea from './components/ChartArea';
import MultiChartLayout from './components/MultiChartLayout';
import PositionsTable from './components/PositionsTable';
import TradeControls from './components/TradeControls';

interface TradingPlatformProps {
  user: User;
  updateUserBalance: (userId: string, newBalance: number) => void;
}

const TradingPlatform: React.FC<TradingPlatformProps> = ({ user, updateUserBalance }) => {
  const {
    symbol, setSymbol,
    chartType, setChartType,
    volume, setVolume,
    sl, setSl,
    tp, setTp,
    orderMode, setOrderMode,
    pendingType, setPendingType,
    triggerPrice, setTriggerPrice,
    commission,
    balance, setBalance,
    tradingStatus,
    marketData, setMarketData,
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
    fetchSpreads,
    handleTradeAction
  } = useTradingLogic(user, updateUserBalance);

  const {
    positions, setPositions,
    pendingOrders, setPendingOrders,
    closedTrades, setClosedTrades,
    fetchInitialPositions: fetchPositionsFromTable,
    fetchInitialPendingOrders: fetchPendingFromTable,
    fetchInitialHistory,
    closePositionAction,
    cancelPendingOrder
  } = usePositionsTable(user, setBalance, usePriceStore((state) => state.prices), assets, spreads);

  const refreshAll = () => {
    fetchPositionsFromTable();
    fetchPendingFromTable();
    fetchInitialHistory();
  };

  const handleTradeActionWrapper = async (type: 'Buy' | 'Sell') => {
    // 1. Optimistic Add
    const tempId = Date.now().toString();
    const tempPosition = { 
        id: tempId, 
        asset_symbol: symbol, 
        type: type.toLowerCase(), 
        amount: volume, 
        entry_price: marketData.price, 
        status: 'open', 
        pending: true 
    };
    setPositions(prev => [tempPosition, ...prev]);

    try {
        await handleTradeAction(type, true); // skipFetch: true
        // On success, update the optimistic position to confirmed
        setPositions(prev => prev.map(p => p.id === tempId ? { ...p, pending: false } : p));
        // Refresh after a delay to ensure data is consistent
        setTimeout(refreshAll, 2000);
    } catch (err) {
        // Rollback
        setPositions(prev => prev.filter(p => p.id !== tempId));
        // Error handling is already in handleTradeAction
    }
  };

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [liveSpread, setLiveSpread] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [layout, setLayout] = useState<'1' | '2v' | '2h' | '4'>('1');
  const [charts, setCharts] = useState([{ id: '1', symbol: 'EURUSD', timeframe: '1H' }]);
  const [activeChartId, setActiveChartId] = useState('1');

  useEffect(() => {
    // Update charts list based on layout
    const count = layout === '4' ? 4 : (layout === '1' ? 1 : 2);
    setCharts(prev => {
      const newCharts = [...prev];
      while (newCharts.length < count) newCharts.push({ id: (newCharts.length + 1).toString(), symbol: 'EURUSD', timeframe: '1H' });
      return newCharts.slice(0, count);
    });
  }, [layout]);
  
  const { showNotification } = useNotification();

  // Sync selected order values to sidebar inputs
  useEffect(() => {
    if (selectedOrderId) {
      const order = [...positions, ...pendingOrders].find(o => o.id === selectedOrderId);
      if (order) {
        // Only update if the values are different to avoid unnecessary state updates
        if (order.sl !== undefined && order.sl !== sl) setSl(order.sl === null ? '' : order.sl);
        if (order.tp !== undefined && order.tp !== tp) setTp(order.tp === null ? '' : order.tp);
        if (order.status === 'pending') {
          const price = order.trigger_price || order.entry_price;
          if (price !== undefined && price !== triggerPrice) setTriggerPrice(price === null ? '' : price);
          if (orderMode !== 'pending') setOrderMode('pending');
        }
        if (order.amount !== undefined && order.amount !== volume) setVolume(order.amount);
      }
    }
  }, [selectedOrderId, positions, pendingOrders]);

  // ... (rest of the component remains the same, but calls the imported functions)


  useEffect(() => {

    if (!user?.id) return;

    const channel = ablyService.getChannel(`balance-updates-${user.id}`);

    channel.subscribe('balance-update', (message) => {

      setBalance(prev => ({ ...prev, balance: message.data.newBalance }));

    });

    return () => channel.unsubscribe();

  }, [user?.id]);

  const handleSetSymbol = (newSymbol: string) => {
    setSymbol(newSymbol);
    setCharts(prev => prev.map(c => c.id === activeChartId ? { ...c, symbol: newSymbol } : c));
  };

  const currentAsset = assets.find(a => a.symbol === symbol);
  const rawPrice = usePriceStore((state) => state.prices[symbol] || Number(currentAsset?.price || 0));
  const digits = currentAsset?.digits !== undefined ? currentAsset.digits : getPrecision(symbol);
  const spreadValue = spreads[symbol]?.value || currentAsset?.spread || 0;
  
  const { bid, ask } = calculateBidAsk(rawPrice, spreadValue, symbol, currentAsset?.type || 'forex', digits);
  
  // Use these unified values for UI components
  const formattedBid = formatPrice(bid, symbol, digits);
  const formattedAsk = formatPrice(ask, symbol, digits);


  const symbolRef = useRef(symbol);


  useEffect(() => {

    symbolRef.current = symbol;

  }, [symbol]);


  // 2. الاتصال بـ Ably لتحديثات الأسعار
  useEffect(() => {
    console.log('[TradingPlatform] Attempting to subscribe to market-data channel');
    console.log('[TradingPlatform] Ably connection state:', ablyService.ably.connection.state);
    
    if (ablyService.ably.connection.state !== 'connected') {
      console.log('[TradingPlatform] Ably not connected, waiting...');
      const onConnected = () => {
        console.log('[TradingPlatform] Ably connected, subscribing...');
        subscribe();
        ablyService.ably.connection.off('connected', onConnected);
      };
      ablyService.ably.connection.on('connected', onConnected);
      return () => ablyService.ably.connection.off('connected', onConnected);
    } else {
      subscribe();
    }

    function subscribe() {
      const channel = ablyService.getChannel('market-data');
      
      const listenerCallback = (message: any) => {
        console.log('[TradingPlatform] Received message on market-data:', message);
        listener(message);
      };

      channel.subscribe('update', listenerCallback)
        .then(() => console.log('[TradingPlatform] Successfully subscribed to market-data:update'))
        .catch((err) => console.error('[TradingPlatform] Failed to subscribe to market-data:update', err));

      return () => {
        console.log('[TradingPlatform] Unsubscribing from market-data channel');
        channel.unsubscribe('update', listenerCallback);
      };
    }
  }, []);







  return (

    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#0b0e11] text-slate-300 font-sans overflow-hidden">

        <div className="flex-1 flex flex-col min-h-0">

          {/* Compact Header */}
          <TradingHeader 
            isSidebarOpen={isSidebarOpen} 
            setIsSidebarOpen={setIsSidebarOpen} 
            assets={assets} 
            isFeedActive={isFeedActive} 
            layout={layout}
            setLayout={setLayout}
          />

         

          <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">

              <MarketWatchSidebar 
                isSidebarOpen={isSidebarOpen} 
                setSymbol={handleSetSymbol} 
                symbol={symbol} 
                assets={assets} 
                assetsLoading={assetsLoading} 
                spreads={spreads} 
              />

           

              {/* Chart Area */}
              <div className="flex-1 flex flex-col min-h-0 relative group/chart">
                <div className="h-[70%] min-h-0">
                  <MultiChartLayout
                    layout={layout}
                    charts={charts}
                    activeChartId={activeChartId}
                    setActiveChartId={setActiveChartId}
                    positions={positions}
                    pendingOrders={pendingOrders}
                    assetsLoading={assetsLoading} 
                    symbol={symbol} 
                    marketData={marketData} 
                    chartType={chartType} 
                    setChartType={setChartType} 
                    currentSpread={spreadValue} 
                    currentAsset={currentAsset} 
                    candleSeriesRef={candleSeriesRef} 
                    trades={trades} 
                    assets={assets}
                    spreads={spreads}
                    selectedOrderId={selectedOrderId}
                    onUpdateOrders={useCallback(() => {
                      fetchPositionsFromTable();
                      fetchPendingFromTable();
                    }, [fetchPositionsFromTable, fetchPendingFromTable])}
                    onSelectOrder={setSelectedOrderId}
                    onPriceChange={useCallback((orderId: string, type: 'sl' | 'tp' | 'entry', price: number) => {
                      console.log(`[TradingPlatform] onPriceChange: ${orderId}, ${type}, ${price}`);
                      if (orderId === 'draft') {
                        if (type === 'sl') setSl(price);
                        if (type === 'tp') setTp(price);
                        if (type === 'entry') setTriggerPrice(price);
                      } else {
                        const field = type === 'entry' ? 'entry_price' : type;
                        setPositions(prev => prev.map(p => p.id === orderId ? { ...p, [field]: price } : p));
                        setPendingOrders(prev => prev.map(p => p.id === orderId ? { ...p, [field]: price, trigger_price: type === 'entry' ? price : p.trigger_price } : p));
                        
                        // Direct sync if this is the selected order to ensure sidebar inputs move in real-time
                        if (orderId === selectedOrderId) {
                          if (type === 'sl') setSl(price);
                          if (type === 'tp') setTp(price);
                          if (type === 'entry') setTriggerPrice(price);
                        }
                      }
                    }, [selectedOrderId, setPositions, setPendingOrders, setSl, setTp, setTriggerPrice])}
                    draftSL={sl}
                    draftTP={tp}
                    draftType={orderMode === 'pending' ? (pendingType.startsWith('buy') ? 'buy' : 'sell') : 'buy'}
                    draftAmount={volume}
                    draftEntryPrice={orderMode === 'pending' ? (typeof triggerPrice === 'number' ? triggerPrice : undefined) : undefined}
                  />
                </div>

                {/* Tables Area */}
                <div className="h-[30%] flex flex-col border-t border-white/10 bg-[#161a1e] overflow-hidden">
                  {/* Positions Table */}
                  <div className="h-full overflow-hidden flex flex-col">
                    <PositionsTable 
                      positions={positions} 
                      pendingOrders={pendingOrders}
                      closedTrades={closedTrades}
                      trades={trades}
                      selectedOrderId={selectedOrderId}
                      onSelectOrder={setSelectedOrderId}
                      assets={assets} 
                      balance={balance} 
                      tradingStatus={tradingStatus}
                      closePositionAction={closePositionAction} 
                      cancelPendingOrder={cancelPendingOrder}
                      refreshAll={refreshAll}
                    />
                  </div>
                </div>
              </div>


              {/* Desktop Sidebar */}
              <div className="hidden md:flex w-64 bg-[#161a1e] border-l border-white/10 flex-col shrink-0 overflow-hidden">
                <div className="p-4 flex-none">
                  <TradeControls 
                    volume={volume} 
                    setVolume={setVolume} 
                    sl={sl}
                    setSl={setSl}
                    tp={tp}
                    setTp={setTp}
                    orderMode={orderMode}
                    setOrderMode={setOrderMode}
                    pendingType={pendingType}
                    setPendingType={setPendingType}
                    triggerPrice={triggerPrice}
                    setTriggerPrice={setTriggerPrice}
                    commission={commission} 
                    handleTradeAction={handleTradeActionWrapper} 
                    symbol={symbol}
                    formattedBid={formatPrice(Number(bid), symbol, digits)}
                    formattedAsk={formatPrice(Number(ask), symbol, digits)}
                    selectedOrder={[...positions, ...pendingOrders].find(o => o.id === selectedOrderId)}
                  />
                </div>
                
                {/* Global Live Trades Feed - Positioned in Sidebar below controls */}
                <div className="flex-1 min-h-0 border-t border-white/10 p-3 bg-black/20">
                </div>
              </div>

          </div>

        </div>

       

        {/* Mobile Sticky Controls */}
        <div className="md:hidden bg-[#161a1e] border-t border-white/10 p-2 flex flex-col gap-2 shrink-0">
            <div className="flex bg-[#1e2329] p-1 rounded-lg">
              <button 
                onClick={() => setOrderMode('market')}
                className={`flex-1 py-1 text-[8px] font-bold uppercase rounded ${orderMode === 'market' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Market
              </button>
              <button 
                onClick={() => setOrderMode('pending')}
                className={`flex-1 py-1 text-[8px] font-bold uppercase rounded ${orderMode === 'pending' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Pending
              </button>
            </div>

            {orderMode === 'pending' && (
              <div className="flex gap-2">
                <select 
                  value={pendingType} 
                  onChange={(e) => setPendingType(e.target.value as any)}
                  className="flex-1 bg-[#1e2329] text-white p-1 rounded text-[10px] border border-white/5 outline-none"
                >
                  <option value="buy_limit">Buy Limit</option>
                  <option value="sell_limit">Sell Limit</option>
                  <option value="buy_stop">Buy Stop</option>
                  <option value="sell_stop">Sell Stop</option>
                </select>
                <input 
                  type="number" 
                  step="0.00001" 
                  value={triggerPrice} 
                  onChange={(e) => setTriggerPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                  className="flex-1 bg-[#1e2329] text-white p-1 rounded text-[10px] border border-white/5 outline-none" 
                  placeholder="Entry Price"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1">
                  <label className="text-[8px] text-slate-400 font-bold uppercase shrink-0">Lot</label>
                  <input type="number" step="0.01" value={isNaN(volume) ? '' : volume} onChange={(e) => { const val = parseFloat(e.target.value); setVolume(isNaN(val) ? 0 : val); }} className="bg-[#1e2329] text-white p-1 rounded text-xs w-full border border-white/5 outline-none" />
                </div>
                <div className="flex-1 flex items-center gap-1">
                  <label className="text-[8px] text-slate-400 font-bold uppercase shrink-0 text-red-400">SL</label>
                  <input 
                    type="number" 
                    step="0.00001" 
                    min="0"
                    value={sl} 
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      if (val === '' || val >= 0) setSl(val);
                    }} 
                    className="bg-[#1e2329] text-white p-1 rounded text-xs w-full border border-white/5 outline-none" 
                    placeholder="None" 
                  />
                </div>
                <div className="flex-1 flex items-center gap-1">
                  <label className="text-[8px] text-slate-400 font-bold uppercase shrink-0 text-emerald-400">TP</label>
                  <input 
                    type="number" 
                    step="0.00001" 
                    min="0"
                    value={tp} 
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      if (val === '' || val >= 0) setTp(val);
                    }} 
                    className="bg-[#1e2329] text-white p-1 rounded text-xs w-full border border-white/5 outline-none" 
                    placeholder="None" 
                  />
                </div>
            </div>

            <div className="flex justify-between text-[10px] px-2">
                <span className="text-slate-400">Commission:</span>
                <span className="text-white font-bold">${(commission || 0).toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 h-10">
                <button onClick={() => handleTradeActionWrapper('Buy')} className="bg-emerald-600 text-white rounded text-sm font-bold transition-colors uppercase">
                  {orderMode === 'market' ? 'Buy' : 'Place Buy'}
                </button>
                <button onClick={() => handleTradeActionWrapper('Sell')} className="bg-red-600 text-white rounded text-sm font-bold transition-colors uppercase">
                  {orderMode === 'market' ? 'Sell' : 'Place Sell'}
                </button>
            </div>
        </div>

      </div>

  );


};


export default TradingPlatform; 