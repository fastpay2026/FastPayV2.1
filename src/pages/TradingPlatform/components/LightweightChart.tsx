import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries, AreaSeries } from 'lightweight-charts';

interface LightweightChartProps {
  symbol: string;
  livePrice: number;
  digits?: number;
  chartType?: 'candlestick' | 'line';
}

const LightweightChart: React.FC<LightweightChartProps> = ({ symbol, livePrice, digits = 2, chartType = 'candlestick' }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick" | "Area"> | null>(null);
  const [lastCandle, setLastCandle] = useState<any>(null);
  const lastCandleRef = useRef<any>(null);
  const [timeframe, setTimeframe] = useState('1m');
  const [showRSI, setShowRSI] = useState(false);
  const [showMA, setShowMA] = useState(false);

  useEffect(() => {
    lastCandleRef.current = lastCandle;
  }, [lastCandle]);

  // Keep track of the latest livePrice without triggering re-renders in the initialization effect
  const livePriceRef = useRef(livePrice);
  useEffect(() => {
    livePriceRef.current = livePrice;
  }, [livePrice]);

  useEffect(() => {
    console.log('[LightweightChart] livePrice:', livePrice, 'symbol:', symbol, 'chartType:', chartType);
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
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
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
      });
    } else {
      series = chart.addSeries(AreaSeries, {
        lineColor: '#2962FF',
        topColor: '#2962FF',
        bottomColor: 'rgba(41, 98, 255, 0.28)',
      });
    }

    chartRef.current = chart;
    seriesRef.current = series;

    // Generate some fake historical data leading up to the current livePrice
    const generateHistoricalData = (basePrice: number) => {
      const data = [];
      let time = Math.floor(Date.now() / 1000) - 100 * 60; // 100 minutes ago
      let currentPrice = basePrice * 0.99; // Start slightly lower

      for (let i = 0; i < 100; i++) {
        const volatility = basePrice * 0.001;
        const open = currentPrice;
        const close = open + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;

        if (chartType === 'candlestick') {
          data.push({ time: time as any, open, high, low, close });
        } else {
          data.push({ time: time as any, value: close });
        }

        currentPrice = close;
        time += 60; // 1 minute candles
      }
      
      // Ensure the last candle's close is close to the livePrice
      if (chartType === 'candlestick') {
        const last = data[data.length - 1];
        last.close = basePrice;
        if (basePrice > last.high) last.high = basePrice;
        if (basePrice < last.low) last.low = basePrice;
      } else {
        data.push({ time: time as any, value: basePrice });
      }

      return data;
    };

    let isMounted = true;

    // Wait for a valid price before generating data
    const initData = () => {
      if (!isMounted) return;
      const price = livePriceRef.current;
      if (price > 0) {
        const initialData = generateHistoricalData(price);
        series.setData(initialData);
        if (chartType === 'candlestick') {
          setLastCandle(initialData[initialData.length - 1]);
        }
      } else {
        // Retry after a short delay if price is not yet available
        setTimeout(initData, 500);
      }
    };
    
    initData();

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      requestAnimationFrame(() => {
        chart.applyOptions({ height: newRect.height, width: newRect.width });
      });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol, chartType, timeframe]); // Re-create chart when symbol, chartType, or timeframe changes

  // Update the last candle when livePrice changes
  useEffect(() => {
    if (!seriesRef.current || !livePrice) return;

    if (chartType === 'candlestick') {
      if (!lastCandleRef.current) return;
      const updateCandle = () => {
        const currentLastCandle = lastCandleRef.current;
        const newCandle = { ...currentLastCandle };
        newCandle.close = livePrice;
        if (livePrice > newCandle.high) newCandle.high = livePrice;
        if (livePrice < newCandle.low) newCandle.low = livePrice;
        
        // If we crossed into a new minute, create a new candle
        const currentTime = Math.floor(Date.now() / 1000);
        const candleTime = Number(newCandle.time);
        
        if (currentTime - candleTime >= 60) {
          // New candle
          const nextCandle = {
            time: (Math.floor(currentTime / 60) * 60) as any,
            open: livePrice,
            high: livePrice,
            low: livePrice,
            close: livePrice,
          };
          (seriesRef.current as ISeriesApi<"Candlestick">).update(nextCandle);
          setLastCandle(nextCandle);
        } else {
          // Update current candle
          (seriesRef.current as ISeriesApi<"Candlestick">).update(newCandle);
          setLastCandle(newCandle);
        }
      };
      updateCandle();
    } else {
      (seriesRef.current as ISeriesApi<"Area">).update({
        time: Math.floor(Date.now() / 1000) as any,
        value: livePrice,
      });
    }
  }, [livePrice, symbol, chartType]);

  // Tick simulation for smoothness
  useEffect(() => {
    if (!seriesRef.current || !livePrice) return;

    const interval = setInterval(() => {
      const tickVolatility = livePrice * 0.00002; // Smaller tick for smoother movement
      const simulatedPrice = livePrice + (Math.random() - 0.5) * tickVolatility;
      
      if (chartType === 'candlestick') {
        const currentLastCandle = lastCandleRef.current;
        if (!currentLastCandle) return;
        const newCandle = { ...currentLastCandle };
        newCandle.close = simulatedPrice;
        if (simulatedPrice > newCandle.high) newCandle.high = simulatedPrice;
        if (simulatedPrice < newCandle.low) newCandle.low = simulatedPrice;
        (seriesRef.current as ISeriesApi<"Candlestick">).update(newCandle);
      } else {
        (seriesRef.current as ISeriesApi<"Area">).update({
          time: Math.floor(Date.now() / 1000) as any,
          value: simulatedPrice,
        });
      }
    }, 100); // Update every 100ms for smoother pulsing

    return () => clearInterval(interval);
  }, [livePrice, chartType]); // Only restart if livePrice changes (to reset the base price)

  return (
    <div className="w-full h-full bg-[#161a1e] rounded-lg overflow-hidden border border-white/10 relative">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">{symbol}</span>
          <span className={`font-mono text-lg ${chartType === 'candlestick' ? (lastCandle?.close >= lastCandle?.open ? 'text-emerald-400' : 'text-red-400') : 'text-sky-400'}`}>
            {livePrice?.toFixed(digits) || '0.00'}
          </span>
        </div>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-[#2a2e39] text-white text-xs rounded px-2 py-1 border-none focus:outline-none"
        >
          <option value="1m">1m</option>
          <option value="5m">5m</option>
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="4h">4h</option>
          <option value="1d">1d</option>
        </select>
        <div className="flex items-center gap-2 text-xs text-white">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showRSI} onChange={() => setShowRSI(!showRSI)} /> RSI
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showMA} onChange={() => setShowMA(!showMA)} /> MA
          </label>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export default LightweightChart;
