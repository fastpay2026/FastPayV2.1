import { IChartApi, ISeriesApi, LineSeries, HistogramSeries } from 'lightweight-charts';
import * as ti from 'technicalindicators';

export interface IndicatorConfig {
  type: 'EMA' | 'RSI' | 'MACD';
  params: any;
}

export class IndicatorsEngine {
  private chart: IChartApi;
  private indicatorSeries: Map<string, ISeriesApi<any>[]> = new Map();
  private isDestroyed: boolean = false;

  constructor(chart: IChartApi) {
    this.chart = chart;
  }

  clearAllIndicators() {
    if (this.isDestroyed || !this.chart) return;
    this.indicatorSeries.forEach((seriesArray) => {
      seriesArray.forEach((series) => {
        try {
          this.chart.removeSeries(series);
        } catch (e) {
          console.warn("[IndicatorsEngine] Error removing series:", e);
        }
      });
    });
    this.indicatorSeries.clear();
    console.log("[IndicatorsEngine] All indicators cleared.");
  }

  destroy() {
    this.clearAllIndicators();
    this.isDestroyed = true;
  }

  removeIndicator(type: string) {
    if (this.isDestroyed || !this.chart) return;
    const keysToRemove: string[] = [];
    this.indicatorSeries.forEach((seriesArray, key) => {
      if (key.startsWith(`${type}-`)) {
        seriesArray.forEach((series) => {
          try {
            this.chart.removeSeries(series);
          } catch (e) {
            console.warn(`[IndicatorsEngine] Error removing series for ${type}:`, e);
          }
        });
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => this.indicatorSeries.delete(key));
  }

  addIndicator(indicator: IndicatorConfig, data: any[]) {
    if (this.isDestroyed || !this.chart) {
      console.warn("[IndicatorsEngine] Chart instance not found or destroyed.");
      return null;
    }
    console.log("Adding Indicator:", indicator.type);
    
    // Ensure old series of the same type are removed before drawing new ones
    this.removeIndicator(indicator.type);

    try {
      // 1. Filter historical data
      const cleanData = data.filter(d => d && typeof d.close === 'number' && !isNaN(d.close) && d.time);
      if (cleanData.length < 50) return null;

      const id = `${indicator.type}-${Date.now()}`;
      const isOverlay = indicator.type === 'EMA';
      const closes = cleanData.map(d => d.close);

      // Handle MACD (Requires 3 series: MACD Line, Signal Line, Histogram)
      if (indicator.type === 'MACD') {
        const histSeries = this.chart.addSeries(HistogramSeries, {
          priceScaleId: 'MACD',
          color: '#26a69a',
        });
        const macdSeries = this.chart.addSeries(LineSeries, {
          color: '#2962FF', // Blue for MACD Line
          lineWidth: 2,
          priceScaleId: 'MACD',
        });
        const signalSeries = this.chart.addSeries(LineSeries, {
          color: '#FF6D00', // Orange for Signal Line
          lineWidth: 2,
          priceScaleId: 'MACD',
        });

        this.indicatorSeries.set(id, [histSeries, macdSeries, signalSeries]);

        // Configure Price Scale after series is added
        this.chart.priceScale('MACD').applyOptions({
          scaleMargins: {
            top: 0.85,
            bottom: 0,
          },
        });

        const macd = new ti.MACD({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
        const result = macd.getResult();

        const macdData: any[] = [];
        const signalData: any[] = [];
        const histData: any[] = [];

        result.forEach((val, i) => {
          const time = cleanData[i + 33]?.time;
          if (!time) return;
          
          if (typeof val.MACD === 'number' && !isNaN(val.MACD)) {
            macdData.push({ time, value: val.MACD });
          }
          if (typeof val.signal === 'number' && !isNaN(val.signal)) {
            signalData.push({ time, value: val.signal });
          }
          if (typeof val.histogram === 'number' && !isNaN(val.histogram)) {
            histData.push({ 
              time, 
              value: val.histogram, 
              color: val.histogram >= 0 ? '#26a69a' : '#ef5350' 
            });
          }
        });

        if (histData.length > 0) histSeries.setData(histData);
        if (macdData.length > 0) macdSeries.setData(macdData);
        if (signalData.length > 0) signalSeries.setData(signalData);

        this.chart.timeScale().fitContent();
        return id;
      }

      // Handle EMA and RSI (Single Line Series)
      const lineSeries = this.chart.addSeries(LineSeries, {
        color: indicator.type === 'EMA' ? '#2962FF' : '#FF6D00',
        lineWidth: 2,
        priceScaleId: isOverlay ? 'right' : indicator.type,
      });

      this.indicatorSeries.set(id, [lineSeries]);

      if (!isOverlay) {
        this.chart.priceScale(indicator.type).applyOptions({
          scaleMargins: {
            top: 0.65,
            bottom: 0.15,
          },
        });
      }

      let formattedData: any[] = [];
      try {
        if (indicator.type === 'EMA') {
          const ema = new ti.EMA({ period: 14, values: closes });
          const result = ema.getResult();
          formattedData = result.map((val, i) => ({ time: cleanData[i + 13].time, value: val }));
        } else if (indicator.type === 'RSI') {
          const rsi = new ti.RSI({ period: 14, values: closes });
          const result = rsi.getResult();
          formattedData = result.map((val, i) => ({ time: cleanData[i + 14].time, value: val }));
        }
      } catch (e) {
        console.warn(`[IndicatorsEngine] Calculation error for ${indicator.type}:`, e);
        return null;
      }

      // Strict Validation & Filter
      const finalData = formattedData.filter(item => {
        const price = item.value;
        const time = item.time;
        if (typeof price !== 'number' || isNaN(price) || !time) {
          return false;
        }
        return true;
      });

      // Drawing
      if (finalData.length > 0) {
        console.log(`[IndicatorsEngine] Drawing ${finalData.length} points for ${indicator.type}`);
        lineSeries.setData(finalData);
        this.chart.timeScale().fitContent(); // Force render
      } else {
        console.warn(`[IndicatorsEngine] No valid data points to draw for ${indicator.type}`);
      }

      return id;
    } catch (error) {
      console.error(`[IndicatorsEngine] Error adding indicator ${indicator.type}:`, error);
      return null;
    }
  }
}
