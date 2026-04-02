import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries, AreaSeries } from 'lightweight-charts';
import { fetchHistoricalData } from '../../../services/marketService';
import { calculateBidAsk, formatPrice, getPrecision } from '../../../utils/marketUtils';
import { IndicatorsEngine } from '../services/IndicatorsEngine';
import { ChartInteractionService, VisualOrder } from '../services/chartInteractionService';
import { usePriceStore } from '../store/usePriceStore';
import { useNotification } from '../../../../components/NotificationContext';


interface LightweightChartProps {
  symbol: string;
  price?: number; // initial price
  digits?: number;
  chartType?: 'candlestick' | 'line';
  setChartType: (type: 'candlestick' | 'line') => void;
  spread?: number;
  asset?: any;
  assetType?: string;
  seriesRef?: React.MutableRefObject<ISeriesApi<"Candlestick" | "Area"> | null>;
  positions?: any[];
  pendingOrders?: any[];
  selectedOrderId?: string | null;
  onUpdateOrders?: () => void;
  onPriceChange?: (orderId: string, type: 'sl' | 'tp' | 'entry', price: number) => void;
  onSelectOrder?: (orderId: string | null) => void;
  draftSL?: number | '';
  draftTP?: number | '';
  draftType?: 'buy' | 'sell';
  draftAmount?: number;
  draftEntryPrice?: number;
}

import { ErrorBoundary } from 'react-error-boundary';
import { OrderEditModal } from './OrderEditModal';

const LightweightChartContainer: React.FC<LightweightChartProps> = (props) => {
  return (
    <ErrorBoundary fallback={<div>Indicator Error - Please refresh.</div>}>
      <LightweightChart {...props} />
    </ErrorBoundary>
  );
};

const LightweightChart: React.FC<LightweightChartProps> = ({ 
  symbol, digits = 2, chartType = 'candlestick', setChartType, 
  spread = 0, asset, assetType, seriesRef: externalSeriesRef,
  positions = [], pendingOrders = [], selectedOrderId, onUpdateOrders, onPriceChange, onSelectOrder,
  draftSL, draftTP, draftType, draftAmount, draftEntryPrice
}) => {
  const price = usePriceStore((state) => state.prices[symbol] || Number(asset?.price || 0));
  const { bid, ask } = calculateBidAsk(Number(price), spread, symbol, assetType, digits);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick" | "Area"> | null>(null);
  const bidLineRef = useRef<any>(null);
  const slLineRef = useRef<any>(null);
  const tpLineRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const draggedLineRef = useRef<{ orderId: string; type: 'sl' | 'tp' | 'entry'; line: any } | null>(null);
  const { showNotification } = useNotification();
  const lastCandleRef = useRef<any>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const [timeframe, setTimeframe] = useState('1m');
  const [showIndicators, setShowIndicators] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const activeIndicatorsRef = useRef<string[]>([]);
  const [activeIndicatorsUI, setActiveIndicatorsUI] = useState<string[]>([]);
  const indicatorsEngineRef = useRef<any>(null);
  const interactionServiceRef = useRef<ChartInteractionService | null>(null);
  const historicalDataRef = useRef<any[]>([]);

  const toggleIndicator = (type: string) => {
    const isActive = activeIndicatorsRef.current.includes(type);
    if (isActive) {
      activeIndicatorsRef.current = activeIndicatorsRef.current.filter(t => t !== type);
      setActiveIndicatorsUI([...activeIndicatorsRef.current]);
      indicatorsEngineRef.current?.clearAllIndicators();
      activeIndicatorsRef.current.forEach(t => {
        indicatorsEngineRef.current?.addIndicator({ type: t as any, params: {} }, historicalDataRef.current);
      });
    } else {
      activeIndicatorsRef.current.push(type);
      setActiveIndicatorsUI([...activeIndicatorsRef.current]);
      indicatorsEngineRef.current?.addIndicator({ type: type as any, params: {} }, historicalDataRef.current);
    }
  };

  // Sync positions and pending orders with the interaction service
  useEffect(() => {
    if (seriesRef.current && onUpdateOrders && isChartReady) {
      const errorHandler = (msg: string) => showNotification(msg, 'error');
      
      interactionServiceRef.current = new ChartInteractionService(
        seriesRef.current,
        onUpdateOrders,
        digits,
        errorHandler,
        onPriceChange,
        onSelectOrder
      );
      
      const visualOrders: VisualOrder[] = [
        ...positions.map(p => ({ ...p, status: 'open' })),
        ...pendingOrders.map(p => ({ ...p, status: 'pending' }))
      ];
      
      interactionServiceRef.current.updateOrders(visualOrders, symbol, selectedOrderId || undefined);
    }
    
    return () => {
      if (interactionServiceRef.current) {
        interactionServiceRef.current.destroy();
        interactionServiceRef.current = null;
      }
    };
  }, [symbol, isChartReady]);

  // تحديث الصفقات فقط عند تغيرها
  useEffect(() => {
    if (interactionServiceRef.current && isChartReady) {
      const visualOrders: VisualOrder[] = [
        ...positions.map(p => ({ ...p, status: 'open' })),
        ...pendingOrders.map(p => ({ ...p, status: 'pending' }))
      ];
      interactionServiceRef.current.updateOrders(visualOrders, symbol, selectedOrderId || undefined);
    }
  }, [positions, pendingOrders, selectedOrderId]);

  // Sync draft lines
  useEffect(() => {
    if (interactionServiceRef.current && isChartReady) {
      if (!selectedOrderId) {
        const sl = draftSL === '' ? null : draftSL;
        const tp = draftTP === '' ? null : draftTP;
        interactionServiceRef.current.updateDraftLines(
          sl, 
          tp, 
          draftType || 'buy', 
          draftAmount || 0, 
          draftEntryPrice || price, 
          symbol
        );
      } else {
        interactionServiceRef.current.clearDraftLines();
      }
    }
  }, [draftSL, draftTP, draftType, draftAmount, draftEntryPrice, symbol, isChartReady, price, selectedOrderId]);

  const [handles, setHandles] = useState<{orderId: string, type: 'sl' | 'tp' | 'entry', y: number}[]>([]);

  useEffect(() => {
    if (!seriesRef.current || !isChartReady || isDraggingRef.current) {
        if (!isDraggingRef.current) setHandles([]);
        return;
    }

    const updateHandles = () => {
      const newHandles = [];
      
      if (selectedOrderId) {
        const allOrders = [...positions, ...pendingOrders];
        const order = allOrders.find(o => o.id === selectedOrderId);
        
        if (order) {
          if (order.sl != null) {
              const y = seriesRef.current!.priceToCoordinate(Number(order.sl));
              if (y !== null) newHandles.push({ orderId: order.id, type: 'sl', y });
          }
          if (order.tp != null) {
              const y = seriesRef.current!.priceToCoordinate(Number(order.tp));
              if (y !== null) newHandles.push({ orderId: order.id, type: 'tp', y });
          }
          if (order.status === 'pending' && order.entry_price != null) {
              const y = seriesRef.current!.priceToCoordinate(Number(order.entry_price));
              if (y !== null) newHandles.push({ orderId: order.id, type: 'entry', y });
          }
        }
      } else {
        // Draft lines
        if (draftSL != null && draftSL !== '') {
          const y = seriesRef.current!.priceToCoordinate(Number(draftSL));
          if (y !== null) newHandles.push({ orderId: 'draft', type: 'sl', y });
        }
        if (draftTP != null && draftTP !== '') {
          const y = seriesRef.current!.priceToCoordinate(Number(draftTP));
          if (y !== null) newHandles.push({ orderId: 'draft', type: 'tp', y });
        }
      }

      setHandles(newHandles);
    };

    updateHandles();
  }, [positions, pendingOrders, selectedOrderId, isChartReady, draftSL, draftTP]);

  // Handle Drag & Drop events
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !isChartReady) return;

    // تعطيل حركة الشارت الافتراضية أثناء السحب
    chart.applyOptions({ handleScroll: true, handleScale: true });

    return () => {
      // Cleanup
    };
  }, [symbol, isChartReady]);

  // Update Bid price line
  useEffect(() => {
    if (!seriesRef.current || !price || !chartRef.current) return;

    try {
      if ((seriesRef.current as any)._internal_series === null) return;

      // Use the calculated bid price for the red line
      const bidPrice = Number(bid);
      const precision = getPrecision(symbol, digits);

      if (!bidLineRef.current) {
        bidLineRef.current = seriesRef.current.createPriceLine({
          price: bidPrice,
          color: '#ef5350',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Bid',
          axisLabelFormatter: (p: number) => p.toFixed(precision),
        });
      } else {
        bidLineRef.current.applyOptions({ 
          price: bidPrice,
          axisLabelFormatter: (p: number) => p.toFixed(precision)
        });
      }
    } catch (e) {
      console.warn('[LightweightChart] Error updating price line:', e);
    }
  }, [bid, symbol, digits]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#161a1e' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      crosshair: { mode: 0 },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
        autoScale: true,
      },
      localization: {
        priceFormatter: (price: number) => formatPrice(price, symbol, digits),
      },
    });

    let series: ISeriesApi<"Candlestick" | "Area">;
    if (chartType === 'candlestick') {
      series = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        lastValueVisible: false,
        priceFormat: {
          type: 'price',
          precision: digits,
          minMove: 1 / Math.pow(10, digits),
        },
      });
    } else {
      series = chart.addSeries(AreaSeries, {
        lineColor: '#2962FF',
        topColor: '#2962FF',
        bottomColor: 'rgba(41, 98, 255, 0.28)',
        lastValueVisible: false,
      });
    }

    chartRef.current = chart;
    indicatorsEngineRef.current = new IndicatorsEngine(chart);
    seriesRef.current = series;
    if (externalSeriesRef) {
      externalSeriesRef.current = series;
    }

    const errorHandler = (msg: string) => showNotification(msg, 'error');
    interactionServiceRef.current = new ChartInteractionService(
      series, 
      onUpdateOrders || (() => {}), 
      digits, 
      errorHandler, 
      onPriceChange, 
      onSelectOrder
    );

    setIsChartReady(true);

    let isMounted = true;
    const initData = async () => {
      const symbolToFetch = symbol === 'BTC' ? 'BTCUSD' : symbol;
      const rawData = await fetchHistoricalData(symbolToFetch, timeframe);
      
      if (!isMounted || !seriesRef.current) return;
      
      const initialData = rawData
      .filter((k: any) => Array.isArray(k) && k.length >= 5)
      .map((k: any) => {
        const rawTime = Number(k[0]);
        const time = (rawTime > 1000000000000 ? Math.floor(rawTime / 1000) : rawTime) as any;
        return chartType === 'candlestick' 
          ? { time, open: Number(k[1]), high: Number(k[2]), low: Number(k[3]), close: Number(k[4]) }
          : { time, value: Number(k[4]) };
      })
      .filter((d: any) => !isNaN(d.time))
      .sort((a: any, b: any) => a.time - b.time)
      .filter((v: any, i: number, a: any[]) => i === 0 || v.time > a[i - 1].time);

      if (initialData.length > 0) {
        historicalDataRef.current = initialData;
        series.setData(initialData);
        lastUpdateTimeRef.current = initialData[initialData.length - 1].time;
        
        if (chartType === 'candlestick') {
          lastCandleRef.current = initialData[initialData.length - 1];
        }

        if (indicatorsEngineRef.current && activeIndicatorsRef.current.length > 0) {
          console.log(`[LightweightChart] Re-drawing active indicators for ${symbolToFetch}:`, activeIndicatorsRef.current);
          activeIndicatorsRef.current.forEach(type => {
            indicatorsEngineRef.current.addIndicator({ type: type as any, params: {} }, initialData);
          });
        }
      }
    };
    
    initData();

    const resizeObserver = new ResizeObserver(entries => {
      if (!isMounted || entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      requestAnimationFrame(() => {
        if (isMounted && chartRef.current) {
          try {
            chartRef.current.applyOptions({ height: newRect.height, width: newRect.width });
          } catch (e) {
            console.warn('Failed to resize chart', e);
          }
        }
      });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      if (interactionServiceRef.current) {
        interactionServiceRef.current.destroy();
        interactionServiceRef.current = null;
      }
      if (indicatorsEngineRef.current) {
        indicatorsEngineRef.current.destroy();
        indicatorsEngineRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        bidLineRef.current = null;
      }
      setIsChartReady(false);
    };
  }, [symbol, chartType, timeframe, digits]);

  useEffect(() => {
    if (!seriesRef.current || !price || !chartRef.current) return;
    
    try {
      const numPrice = Number(price);
      if (interactionServiceRef.current) interactionServiceRef.current.updateCurrentPrice(numPrice);

      if (chartType === 'candlestick') {
        if (!lastCandleRef.current) return;
        
        const now = Math.floor(Date.now() / 1000);
        let candleDurationSeconds = 60; // Default 1m
        if (timeframe === '5m') candleDurationSeconds = 300;
        else if (timeframe === '15m') candleDurationSeconds = 900;
        else if (timeframe === '1H') candleDurationSeconds = 3600;
        else if (timeframe === '4H') candleDurationSeconds = 14400;
        else if (timeframe === '1D') candleDurationSeconds = 86400;
        
        const currentCandleTime = Math.floor(now / candleDurationSeconds) * candleDurationSeconds;
        
        let updatedCandle;
        if (currentCandleTime > lastCandleRef.current.time) {
          // Create new candle
          updatedCandle = {
            time: currentCandleTime as any,
            open: numPrice,
            high: numPrice,
            low: numPrice,
            close: numPrice,
          };
        } else {
          // Update existing candle
          updatedCandle = {
            ...lastCandleRef.current,
            high: Math.max(lastCandleRef.current.high, numPrice),
            low: Math.min(lastCandleRef.current.low, numPrice),
            close: numPrice,
          };
        }
        
        (seriesRef.current as ISeriesApi<"Candlestick">).update(updatedCandle);
        lastCandleRef.current = updatedCandle;
      } else if (chartType === 'line') {
        (seriesRef.current as ISeriesApi<"Area">).update({
          time: Math.floor(Date.now() / 1000) as any,
          value: numPrice,
        });
      }
    } catch (e) {
      console.warn('Error updating candle', e);
    }
  }, [price, symbol, chartType, timeframe]);

  return (
    <div 
      className="w-full h-full bg-[#161a1e] rounded-lg overflow-visible border border-white/10 relative"
      onMouseDown={() => console.log("PARENT CLICKED")}
    >
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">{symbol}</span>
          {selectedOrderId && (
            <button 
              onClick={() => {
                const order = [...positions, ...pendingOrders].find(o => o.id === selectedOrderId);
                if (order) setEditingOrder(order);
              }}
              className="bg-sky-600 text-white text-[10px] rounded px-2 py-1 font-bold"
            >
              EDIT
            </button>
          )}
        </div>
        
        <div className="flex bg-[#1e2329] rounded border border-white/5 w-fit">
          <button onClick={() => setChartType('candlestick')} className={`px-3 py-1 text-[10px] uppercase font-bold ${chartType === 'candlestick' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>Candles</button>
          <button onClick={() => setChartType('line')} className={`px-3 py-1 text-[10px] uppercase font-bold ${chartType === 'line' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>Line</button>
        </div>
        <div className="flex gap-1">
          {['1m', '5m', '15m', '1h', '1d'].map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} className={`px-2 py-1 text-[10px] rounded ${timeframe === tf ? 'bg-sky-600' : 'bg-[#2a2e39]'}`}>{tf}</button>
          ))}
        </div>
        <div className="relative">
          <button onClick={() => setShowIndicators(!showIndicators)} className="bg-[#2a2e39] text-white text-xs rounded px-2 py-1">Indicators</button>
          {showIndicators && (
            <div className="absolute top-full left-0 bg-[#2a2e39] p-2 rounded mt-1 z-20 flex flex-col gap-1">
              <button className={`text-xs hover:text-sky-400 ${activeIndicatorsUI.includes('EMA') ? 'text-sky-400 font-bold' : 'text-white'}`} onClick={() => toggleIndicator('EMA')}>
                EMA
              </button>
              <button className={`text-xs hover:text-sky-400 ${activeIndicatorsUI.includes('RSI') ? 'text-sky-400 font-bold' : 'text-white'}`} onClick={() => toggleIndicator('RSI')}>
                RSI
              </button>
              <button className={`text-xs hover:text-sky-400 ${activeIndicatorsUI.includes('MACD') ? 'text-sky-400 font-bold' : 'text-white'}`} onClick={() => toggleIndicator('MACD')}>
                MACD
              </button>
            </div>
          )}
        </div>
      </div>
      {/* الطبقة التفاعلية للسحب */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        {handles.map((handle, index) => {
          const colors = {
            sl: 'border-red-500 text-red-500',
            tp: 'border-emerald-500 text-emerald-500',
            entry: 'border-sky-500 text-sky-500'
          };
          const colorClass = colors[handle.type] || 'border-gray-500 text-gray-500';
          
          return (
            <div
              key={`${handle.orderId}-${handle.type}-${index}`}
              className={`absolute w-full h-8 -mt-4 cursor-ns-resize pointer-events-auto flex items-center justify-end`}
              style={{ top: `${handle.y}px` }}
              onMouseDown={(e) => {
                console.log("[DEBUG] Handle MouseDown", handle);
                e.stopPropagation();
                e.preventDefault();
                
                // إيقاف حركة الشارت
                chartRef.current?.applyOptions({ handleScroll: false, handleScale: false });
                
                // إخبار الخدمة ببدء السحب
                isDraggingRef.current = true;
                interactionServiceRef.current?.startDrag(handle.orderId, handle.type);
                
                const startY = e.clientY;
                const startYCoordinate = handle.y;

                const onMouseMove = (moveEvent: MouseEvent) => {
                  const deltaY = moveEvent.clientY - startY;
                  const newY = startYCoordinate + deltaY;
                  const newPrice = seriesRef.current!.coordinateToPrice(newY);
                  
                  if (newPrice !== null) {
                    // تحديث الخط في الخدمة
                    interactionServiceRef.current?.handleMouseMove(newPrice);
                    
                    // تحديث موقع المقبض محلياً في المكون ليتحرك بصرياً
                    setHandles(prev => prev.map(h => 
                      (h.orderId === handle.orderId && h.type === handle.type) 
                        ? { ...h, y: newY } 
                        : h
                    ));
                  }
                };

                const onMouseUp = async () => {
                  window.removeEventListener('mousemove', onMouseMove);
                  window.removeEventListener('mouseup', onMouseUp);
                  
                  // إعادة تفعيل حركة الشارت
                  chartRef.current?.applyOptions({ handleScroll: true, handleScale: true });
                  
                  // إنهاء السحب وتحديث الخلفية
                  await interactionServiceRef.current?.handleMouseUp();
                  
                  // تأخير بسيط للسماح للـ useEffect بتحديث البيانات من قاعدة البيانات
                  setTimeout(() => {
                    isDraggingRef.current = false;
                  }, 100);
                  
                  onUpdateOrders?.();
                };

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
              }}
            >
              <div className={`w-full h-0 border-t-2 border-dashed ${colorClass.split(' ')[0]}`}></div>
              <span className={`text-[10px] font-bold bg-black/80 px-2 py-0.5 rounded-l-md ml-2 uppercase tracking-wider ${colorClass.split(' ')[1]}`}>
                {handle.type}
              </span>
            </div>
          );
        })}
      </div>

      {editingOrder && (
        <OrderEditModal 
          order={editingOrder} 
          onClose={() => setEditingOrder(null)} 
          onUpdate={() => onUpdateOrders?.()} 
        />
      )}
      <div 
        ref={chartContainerRef} 
        className="w-full h-full relative z-10" 
        style={{ pointerEvents: 'auto', cursor: 'crosshair', position: 'relative' }}
      />
    </div>
  );
};

export default LightweightChartContainer;
