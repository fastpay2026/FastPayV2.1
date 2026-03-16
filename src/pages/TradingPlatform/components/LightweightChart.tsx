import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';

interface LightweightChartProps {
  symbol: string;
  livePrice: number;
}

const LightweightChart: React.FC<LightweightChartProps> = ({ symbol, livePrice }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [lastCandle, setLastCandle] = useState<any>(null);
  const lastCandleRef = useRef<any>(null);

  useEffect(() => {
    lastCandleRef.current = lastCandle;
  }, [lastCandle]);

  // Keep track of the latest livePrice without triggering re-renders in the initialization effect
  const livePriceRef = useRef(livePrice);
  useEffect(() => {
    livePriceRef.current = livePrice;
  }, [livePrice]);

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

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

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

        data.push({
          time: time as any,
          open,
          high,
          low,
          close,
        });

        currentPrice = close;
        time += 60; // 1 minute candles
      }
      
      // Ensure the last candle's close is close to the livePrice
      const last = data[data.length - 1];
      last.close = basePrice;
      if (basePrice > last.high) last.high = basePrice;
      if (basePrice < last.low) last.low = basePrice;

      return data;
    };

    let isMounted = true;

    // Wait for a valid price before generating data
    const initData = () => {
      if (!isMounted) return;
      const price = livePriceRef.current;
      if (price > 0) {
        const initialData = generateHistoricalData(price);
        candlestickSeries.setData(initialData);
        setLastCandle(initialData[initialData.length - 1]);
      } else {
        // Retry after a short delay if price is not yet available
        setTimeout(initData, 500);
      }
    };
    
    initData();

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      chart.applyOptions({ height: newRect.height, width: newRect.width });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol]); // Only re-create chart when symbol changes

  // Update the last candle when livePrice changes
  useEffect(() => {
    if (!seriesRef.current || !lastCandleRef.current || !livePrice) return;

    console.log(`[LightweightChart] livePrice updated: ${livePrice} for ${symbol}`);

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
        seriesRef.current.update(nextCandle);
        setLastCandle(nextCandle);
      } else {
        // Update current candle
        seriesRef.current.update(newCandle);
        setLastCandle(newCandle);
      }
    };

    updateCandle();
  }, [livePrice, symbol]);

  // Tick simulation for smoothness
  useEffect(() => {
    if (!seriesRef.current || !lastCandleRef.current || !livePrice) return;

    const interval = setInterval(() => {
      const currentLastCandle = lastCandleRef.current;
      if (!currentLastCandle) return;

      const tickVolatility = livePrice * 0.00005; // Very small tick
      const simulatedPrice = livePrice + (Math.random() - 0.5) * tickVolatility;
      
      const newCandle = { ...currentLastCandle };
      newCandle.close = simulatedPrice;
      if (simulatedPrice > newCandle.high) newCandle.high = simulatedPrice;
      if (simulatedPrice < newCandle.low) newCandle.low = simulatedPrice;

      seriesRef.current?.update(newCandle);
    }, 500); // Update every 500ms

    return () => clearInterval(interval);
  }, [livePrice]); // Only restart if livePrice changes (to reset the base price)

  return (
    <div className="w-full h-full bg-[#161a1e] rounded-lg overflow-hidden border border-white/10 relative">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">{symbol}</span>
          <span className={`font-mono text-lg ${lastCandle?.close >= lastCandle?.open ? 'text-emerald-400' : 'text-red-400'}`}>
            {livePrice?.toFixed(5) || '0.00000'}
          </span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export default LightweightChart;
