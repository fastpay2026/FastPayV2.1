import { ISeriesApi, IPriceLine } from 'lightweight-charts';
import { supabase } from '../../../../supabaseClient';
import { getContractSize } from '../../../utils/marketUtils';

export interface VisualOrder {
  id: string;
  asset_symbol: string; // Use asset_symbol from trade_orders
  symbol: string; // Fallback
  type: 'buy' | 'sell';
  status: 'open' | 'pending';
  entry_price: number;
  trigger_price?: number;
  sl: number | null;
  tp: number | null;
  amount: number;
}

interface OrderLines {
  entry: IPriceLine;
  sl: IPriceLine | null;
  tp: IPriceLine | null;
}

export class ChartInteractionService {
  private series: ISeriesApi<"Candlestick" | "Area">;
  private orders: VisualOrder[] = [];
  private orderLines: Map<string, OrderLines> = new Map();
  private draggingLine: { orderId: string; type: 'sl' | 'tp' | 'entry'; line: IPriceLine; originalPrice: number } | null = null;
  private onUpdate: () => void;
  private onPriceChange?: (orderId: string, type: 'sl' | 'tp' | 'entry', price: number) => void;
  private onSelect?: (orderId: string | null) => void;
  private onError?: (message: string) => void;
  private digits: number;
  private isDestroyed: boolean = false;
  private selectedOrderId: string | null = null;

  private currentPrice: number | null = null;
  private draftLines: { sl: IPriceLine | null; tp: IPriceLine | null } = { sl: null, tp: null };
  private draftOrder: VisualOrder | null = null;

  constructor(
    series: ISeriesApi<"Candlestick" | "Area">, 
    onUpdate: () => void, 
    digits: number = 5, 
    onError?: (message: string) => void,
    onPriceChange?: (orderId: string, type: 'sl' | 'tp' | 'entry', price: number) => void,
    onSelect?: (orderId: string | null) => void
  ) {
    this.series = series;
    this.onUpdate = onUpdate;
    this.digits = digits;
    this.onError = onError;
    this.onPriceChange = onPriceChange;
    this.onSelect = onSelect;
  }

  public updateCallbacks(
    onUpdate: () => void, 
    onError?: (message: string) => void, 
    onPriceChange?: (orderId: string, type: 'sl' | 'tp' | 'entry', price: number) => void, 
    digits?: number,
    onSelect?: (orderId: string | null) => void
  ) {
    this.onUpdate = onUpdate;
    this.onError = onError;
    this.onPriceChange = onPriceChange;
    this.onSelect = onSelect;
    if (digits !== undefined) this.digits = digits;
  }

  public updateCurrentPrice(price: number) {
    this.currentPrice = price;
    if (this.isDestroyed) return;
    
    // Update all line titles with the new current price
    for (const [orderId, lines] of this.orderLines.entries()) {
      const order = this.orders.find(o => o.id === orderId);
      if (order && order.status === 'open') {
        this.updateLineTitles(order, lines);
      }
    }
  }

  private updateLineTitles(order: VisualOrder, lines: OrderLines) {
    if (this.isDestroyed) return;
    
    try {
      // Since we are using div handles, we don't need to update PriceLine titles
      // This keeps the PriceLine objects invisible and prevents conflicts
    } catch (e) {
      console.warn('[ChartInteractionService] Error updating line titles:', e);
    }
  }

  private calculatePL(order: VisualOrder, targetPrice: number): { text: string; value: number } {
    const entryPrice = order.status === 'pending' ? (order.trigger_price || order.entry_price) : order.entry_price;
    const contractSize = getContractSize(order.asset_symbol || order.symbol);
    const diff = order.type === 'buy' ? (targetPrice - entryPrice) : (entryPrice - targetPrice);
    const pl = diff * order.amount * contractSize;
    return {
      text: `${pl >= 0 ? '+' : ''}${pl.toFixed(2)}$`,
      value: pl
    };
  }

  public updateSeries(series: ISeriesApi<"Candlestick" | "Area">) {
    console.log(`[ChartInteractionService] Updating series to: ${series}`);
    this.series = series;
  }

  public clearDraftLines() {
    if (this.isDestroyed) return;
    try {
      if (this.draftLines.sl) this.series.removePriceLine(this.draftLines.sl);
      if (this.draftLines.tp) this.series.removePriceLine(this.draftLines.tp);
    } catch (e) {
      console.warn('Failed to remove draft lines', e);
    }
    this.draftLines = { sl: null, tp: null };
    this.draftOrder = null;
  }

  public updateOrders(newOrders: VisualOrder[], symbol: string, selectedOrderId?: string | null) {
    console.log(`[ChartInteractionService] updateOrders for ${symbol}. ${newOrders.length} orders. Selected: ${selectedOrderId}`);
    if (this.isDestroyed) return;
    this.selectedOrderId = selectedOrderId || null;
    
    // Clean up draft lines if we have real orders
    this.clearDraftLines();
    
    // Normalize symbol comparison to be very flexible
    const filteredOrders = newOrders.filter(o => {
      const orderSymbol = (o.asset_symbol || o.symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const targetSymbol = (symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      if (orderSymbol === targetSymbol || orderSymbol.includes(targetSymbol) || targetSymbol.includes(orderSymbol)) return true;
      
      const orderBase = orderSymbol.substring(0, 3);
      const targetBase = targetSymbol.substring(0, 3);
      return orderBase === targetBase && orderBase.length >= 3;
    });
    
    // Remove lines for orders that no longer exist OR are not selected
    for (const [orderId, lines] of this.orderLines.entries()) {
      if (!filteredOrders.find(o => o.id === orderId) || (this.selectedOrderId && orderId !== this.selectedOrderId)) {
        this.removeLines(lines);
        this.orderLines.delete(orderId);
      }
    }

    // Update or create lines ONLY for the selected order
    if (this.selectedOrderId) {
      const selectedOrder = filteredOrders.find(o => o.id === this.selectedOrderId);
      if (selectedOrder) {
        if (!this.orderLines.has(selectedOrder.id)) {
          this.orderLines.set(selectedOrder.id, this.createLines(selectedOrder));
        } else {
          this.updateExistingLines(selectedOrder, this.orderLines.get(selectedOrder.id)!);
        }
      }
    }

    this.orders = filteredOrders;
  }

  public updateDraftLines(sl: number | null, tp: number | null, type: 'buy' | 'sell', amount: number, entryPrice: number, symbol: string) {
    if (this.isDestroyed) return;

    // Only draw draft lines if we are actually creating a new order
    if (sl === null && tp === null) {
      this.clearDraftLines();
      return;
    }

    this.draftOrder = {
      id: 'draft',
      asset_symbol: symbol,
      symbol: symbol,
      type,
      status: 'pending',
      entry_price: entryPrice,
      sl,
      tp,
      amount
    };

    try {
      // SL Line
      if (sl) {
        const pl = this.calculatePL(this.draftOrder, sl);
        if (this.draftLines.sl) {
          this.draftLines.sl.applyOptions({ 
            price: sl, 
            title: `DRAFT SL: ${pl.text} (${sl.toFixed(this.digits)})`,
          });
        } else {
          this.draftLines.sl = this.series.createPriceLine({
            price: sl,
            color: '#ef5350',
            lineWidth: 2,
            lineStyle: 1, // Dotted
            axisLabelVisible: true,
            title: `DRAFT SL: ${pl.text} (${sl.toFixed(this.digits)})`,
          });
        }
      } else if (this.draftLines.sl) {
        try {
          this.series.removePriceLine(this.draftLines.sl);
        } catch (e) {
          console.warn('Failed to remove draft SL line', e);
        }
        this.draftLines.sl = null;
      }

      // TP Line
      if (tp) {
        const pl = this.calculatePL(this.draftOrder, tp);
        if (this.draftLines.tp) {
          this.draftLines.tp.applyOptions({ 
            price: tp, 
            title: `DRAFT TP: ${pl.text} (${tp.toFixed(this.digits)})`,
          });
        } else {
          this.draftLines.tp = this.series.createPriceLine({
            price: tp,
            color: '#26a69a',
            lineWidth: 2,
            lineStyle: 1, // Dotted
            axisLabelVisible: true,
            title: `DRAFT TP: ${pl.text} (${tp.toFixed(this.digits)})`,
          });
        }
      } else if (this.draftLines.tp) {
        try {
          this.series.removePriceLine(this.draftLines.tp);
        } catch (e) {
          console.warn('Failed to remove draft TP line', e);
        }
        this.draftLines.tp = null;
      }
    } catch (e) {
      console.warn('[ChartInteractionService] Error updating draft lines:', e);
    }
  }

  private createLines(order: VisualOrder): OrderLines {
    console.log(`[ChartInteractionService] Creating lines for order ${order.id} using series: ${this.series}`);
    if (this.isDestroyed) throw new Error('Service is destroyed');
    
    try {
      const entryPrice = order.status === 'pending' ? (order.trigger_price || order.entry_price) : order.entry_price;
      const isSelected = order.id === this.selectedOrderId;
      const lineWidth = isSelected ? 3 : 1;
      const lineStyle = isSelected ? 0 : 2; // Solid if selected, dashed otherwise (for SL/TP)
      
      const entryLine = this.series.createPriceLine({
        price: entryPrice,
        color: 'transparent',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: false,
        title: '',
      });
      console.log(`[ChartInteractionService] Created entry line for ${order.id}: ${entryLine}`);

      const slLine = order.sl ? this.series.createPriceLine({
        price: order.sl,
        color: 'transparent',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: false,
        title: '',
      }) : null;

      const tpLine = order.tp ? this.series.createPriceLine({
        price: order.tp,
        color: 'transparent',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: false,
        title: '',
      }) : null;

      const lines = { entry: entryLine, sl: slLine, tp: tpLine };
      this.updateLineTitles(order, lines);
      return lines;
    } catch (e) {
      console.error('[ChartInteractionService] Error creating lines:', e);
      // Return a dummy object to avoid crashes, though this shouldn't happen if not destroyed
      throw e; 
    }
  }

  private updateExistingLines(order: VisualOrder, lines: OrderLines) {
    if (this.isDestroyed) return;
    
    try {
      // Only update if not dragging this specific order
      if (!this.draggingLine || this.draggingLine.orderId !== order.id) {
        const entryPrice = order.status === 'pending' ? (order.trigger_price || order.entry_price) : order.entry_price;
        
      // Update entry price
        lines.entry.applyOptions({ price: entryPrice });
        
        // Handle SL line
        if (order.sl) {
          if (lines.sl) {
            lines.sl.applyOptions({ price: order.sl });
          } else {
            lines.sl = this.series.createPriceLine({
              price: order.sl,
              color: 'transparent',
              lineWidth: 1,
              lineStyle: 0,
              axisLabelVisible: false,
              title: '',
            });
          }
        } else if (lines.sl) {
          try {
            this.series.removePriceLine(lines.sl);
          } catch (e) {
            console.warn('Failed to remove SL line', e);
          }
          lines.sl = null;
        }

        // Handle TP line
        if (order.tp) {
          if (lines.tp) {
            lines.tp.applyOptions({ price: order.tp });
          } else {
            lines.tp = this.series.createPriceLine({
              price: order.tp,
              color: 'transparent',
              lineWidth: 1,
              lineStyle: 0,
              axisLabelVisible: false,
              title: '',
            });
          }
        } else if (lines.tp) {
          try {
            this.series.removePriceLine(lines.tp);
          } catch (e) {
            console.warn('Failed to remove TP line', e);
          }
          lines.tp = null;
        }

        this.updateLineTitles(order, lines);
      }
    } catch (e) {
      console.warn('[ChartInteractionService] Error updating existing lines:', e);
    }
  }

  private removeLines(lines: OrderLines) {
    if (this.isDestroyed) return;
    try {
      this.series.removePriceLine(lines.entry);
      if (lines.sl) this.series.removePriceLine(lines.sl);
      if (lines.tp) this.series.removePriceLine(lines.tp);
    } catch (e) {
      console.warn('Failed to remove price line, series might be disposed', e);
    }
  }

  public startDrag(orderId: string, type: 'sl' | 'tp' | 'entry') {
    console.log(`[ChartInteractionService] startDrag called for orderId: ${orderId}, type: ${type}`);
    if (this.isDestroyed) {
        console.log(`[ChartInteractionService] startDrag failed: Service is destroyed`);
        return;
    }
    
    let line: IPriceLine | null = null;
    if (orderId === 'draft') {
        if (type === 'sl') line = this.draftLines.sl;
        if (type === 'tp') line = this.draftLines.tp;
    } else {
        const lines = this.orderLines.get(orderId);
        console.log(`[ChartInteractionService] Lines for order ${orderId}: ${!!lines}`);
        if (lines) {
            if (type === 'sl') line = lines.sl;
            if (type === 'tp') line = lines.tp;
            if (type === 'entry') line = lines.entry;
        }
    }

    if (line) {
        console.log(`[ChartInteractionService] SUCCESSFULLY GRABBED ${type} for order ${orderId}`);
        this.draggingLine = { 
            orderId, 
            type, 
            line,
            originalPrice: line.options().price
        };
        // Highlight the line being dragged
        this.draggingLine.line.applyOptions({ lineWidth: 3, lineStyle: 0 });
        
        // Auto-select the order being dragged
        if (this.onSelect && orderId !== 'draft') {
            this.onSelect(orderId);
        }
    } else {
        console.warn(`[ChartInteractionService] FAILED TO GRAB ${type} for order ${orderId}. Line is null.`);
    }
  }

  public handleMouseDown(price: number, pixelTolerance: number = 0.0005) {
    if (this.isDestroyed) return false;
    
    console.log(`[ChartInteractionService] handleMouseDown at price ${price}, tolerance ${pixelTolerance}`);
    console.log(`[ChartInteractionService] orderLines size: ${this.orderLines.size}`);
    
    // Find the closest line to the click
    let closest: { orderId: string; type: 'sl' | 'tp' | 'entry'; line: IPriceLine; diff: number; isSelected: boolean } | null = null;

    // Check draft lines first (they are usually on top)
    if (this.draftLines.sl) {
      const linePrice = this.draftLines.sl.options().price;
      const diff = Math.abs(linePrice - price);
      console.log(`[ChartInteractionService] Checking draft SL at ${linePrice}, diff: ${diff}`);
      if (diff <= pixelTolerance * 3) { // Increased tolerance for easier grabbing
        closest = { orderId: 'draft', type: 'sl', line: this.draftLines.sl, diff, isSelected: true };
      }
    }
    if (this.draftLines.tp && (!closest || Math.abs(this.draftLines.tp.options().price - price) < closest.diff)) {
      const linePrice = this.draftLines.tp.options().price;
      const diff = Math.abs(linePrice - price);
      console.log(`[ChartInteractionService] Checking draft TP at ${linePrice}, diff: ${diff}`);
      if (diff <= pixelTolerance * 3) {
        closest = { orderId: 'draft', type: 'tp', line: this.draftLines.tp, diff, isSelected: true };
      }
    }

    if (!closest) {
      for (const [orderId, lines] of this.orderLines.entries()) {
        const order = this.orders.find(o => o.id === orderId);
        const isSelected = orderId === this.selectedOrderId;
        // Boost tolerance for selected order to make it easier to grab
        const effectiveTolerance = isSelected ? pixelTolerance * 3 : pixelTolerance * 2;

        const checkLine = (line: IPriceLine | null, type: 'sl' | 'tp' | 'entry') => {
          if (!line) return;
          const linePrice = line.options().price;
          const diff = Math.abs(linePrice - price);
          console.log(`[ChartInteractionService] Checking ${type} for ${orderId} at ${linePrice}, diff: ${diff}, tolerance: ${effectiveTolerance}`);
          if (diff <= effectiveTolerance) {
            const closestIsSelected = closest?.isSelected || false;
            // Prioritize selected order, then prioritize closer distance
            if (!closest || (isSelected && !closestIsSelected) || (isSelected === closestIsSelected && diff < closest.diff)) {
              closest = { orderId, type, line, diff, isSelected };
            }
          }
        };

        checkLine(lines.sl, 'sl');
        checkLine(lines.tp, 'tp');
        
        // Allow dragging entry only for pending orders
        if (order && order.status === 'pending') {
          checkLine(lines.entry, 'entry');
        }
      }
    }

    if (closest) {
      console.log(`[ChartInteractionService] SUCCESSFULLY GRABBED ${closest.type} for order ${closest.orderId}`);
      this.draggingLine = { 
        orderId: closest.orderId, 
        type: closest.type, 
        line: closest.line,
        originalPrice: closest.line.options().price
      };
      // Highlight the line being dragged
      this.draggingLine.line.applyOptions({ lineWidth: 3, lineStyle: 0 });
      
      // Auto-select the order being dragged
      if (this.onSelect && closest.orderId !== 'draft') {
        this.onSelect(closest.orderId);
      }
      
      return true;
    }
    
    console.log(`[ChartInteractionService] No line found within tolerance`);
    return false;
  }

  public isOverLine(price: number, pixelTolerance: number = 0.0005): boolean {
    if (this.isDestroyed) return false;
    
    // Check draft lines
    if (this.draftLines.sl && Math.abs(this.draftLines.sl.options().price - price) <= pixelTolerance) return true;
    if (this.draftLines.tp && Math.abs(this.draftLines.tp.options().price - price) <= pixelTolerance) return true;

    for (const [orderId, lines] of this.orderLines.entries()) {
      const order = this.orders.find(o => o.id === orderId);
      if (lines.sl && Math.abs(lines.sl.options().price - price) <= pixelTolerance) return true;
      if (lines.tp && Math.abs(lines.tp.options().price - price) <= pixelTolerance) return true;
      if (order && order.status === 'pending' && lines.entry && Math.abs(lines.entry.options().price - price) <= pixelTolerance) return true;
    }
    return false;
  }

  public handleMouseMove(price: number) {
    if (this.isDestroyed) return false;
    if (this.draggingLine) {
        console.log(`[ChartInteractionService] handleMouseMove: draggingLine exists for order ${this.draggingLine.orderId}`);
        const order = this.draggingLine.orderId === 'draft' ? this.draftOrder : this.orders.find(o => o.id === this.draggingLine!.orderId);
        if (order) {
            const pl = this.calculatePL(order, price);
            const typeLabel = this.draggingLine.type.toUpperCase();
            
            // Snap to tick
            const tickSize = 1 / Math.pow(10, this.digits);
            const snappedPrice = Math.round(price / tickSize) * tickSize;
            const priceStr = snappedPrice.toFixed(this.digits);
            const prefix = this.draggingLine.orderId === 'draft' ? 'DRAFT ' : '';
            
            // Update the line visually in real-time with highlight
            (this.draggingLine.line as any).applyOptions({ 
            price: snappedPrice, 
            title: `${prefix}${typeLabel}: ${pl.text} @ ${priceStr}`,
            lineWidth: 4, // Thicker
            lineStyle: 0, // Solid
            color: '#FFFFFF', // Highlight
            });

            // Notify parent about price change for real-time state sync (sidebar, table, etc.)
            if (this.onPriceChange) {
            this.onPriceChange(this.draggingLine.orderId, this.draggingLine.type, snappedPrice);
            }
        }
        return true;
    }
    // console.log(`[ChartInteractionService] handleMouseMove: no draggingLine`);
    return false;
  }

  public async handleMouseUp() {
    if (this.isDestroyed) return false;
    if (this.draggingLine) {
      const { orderId, type, line, originalPrice } = this.draggingLine;
      const newPrice = line.options().price;
      
      // Reset line style
      if (orderId === 'draft') {
        line.applyOptions({ lineWidth: 2, lineStyle: 1 });
      } else {
        const isSelected = orderId === this.selectedOrderId;
        line.applyOptions({ lineWidth: isSelected ? 3 : 1, lineStyle: isSelected ? 0 : 2 });
      }

      // If price hasn't changed much, don't update
      if (Math.abs(newPrice - originalPrice) < 0.000001) {
        this.draggingLine = null;
        return true;
      }

      if (orderId === 'draft') {
        // Draft updates are handled in real-time via onPriceChange, so just clear dragging state
        this.draggingLine = null;
        return true;
      }

      // Validation before updating DB
      const order = this.orders.find(o => o.id === orderId);
      if (order && this.currentPrice !== null) {
        if (type === 'sl') {
          if (order.type === 'buy' && newPrice >= this.currentPrice) {
            this.onError?.('Stop Loss for Buy must be below current price');
            line.applyOptions({ price: originalPrice });
            this.draggingLine = null;
            return false;
          }
          if (order.type === 'sell' && newPrice <= this.currentPrice) {
            this.onError?.('Stop Loss for Sell must be above current price');
            line.applyOptions({ price: originalPrice });
            this.draggingLine = null;
            return false;
          }
        }
        if (type === 'tp') {
          if (order.type === 'buy' && newPrice <= this.currentPrice) {
            this.onError?.('Take Profit for Buy must be above current price');
            line.applyOptions({ price: originalPrice });
            this.draggingLine = null;
            return false;
          }
          if (order.type === 'sell' && newPrice >= this.currentPrice) {
            this.onError?.('Take Profit for Sell must be below current price');
            line.applyOptions({ price: originalPrice });
            this.draggingLine = null;
            return false;
          }
        }
      }

      try {
        const updateData: any = {};
        if (type === 'entry') {
          updateData.entry_price = newPrice;
          updateData.trigger_price = newPrice;
        } else {
          updateData[type] = newPrice;
        }
        
        console.log(`[VisualTrading] Updating ${type} for order ${orderId} to ${newPrice}`);
        
        const { error } = await supabase
          .from('trade_orders')
          .update(updateData)
          .eq('id', orderId);

        if (this.isDestroyed) return false;

        if (error) throw error;
        
        console.log(`[ChartInteractionService] Successfully updated ${type} for order ${orderId} in backend`);
        
        // Trigger UI refresh
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          if (type === 'entry') {
            order.entry_price = newPrice;
            order.trigger_price = newPrice;
          } else {
            order[type as 'sl' | 'tp'] = newPrice;
          }
        }
        this.onUpdate();
      } catch (err) {
        if (this.isDestroyed) return false;
        console.error('Failed to update order via drag:', err);
        // Revert line to original price
        line.applyOptions({ price: originalPrice });
        if (this.onError) {
          this.onError(`Failed to update ${type.toUpperCase()}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      if (this.isDestroyed) return false;
      this.draggingLine = null;
      return true;
    }
    return false;
  }

  public destroy() {
    if (this.isDestroyed) return;
    for (const lines of this.orderLines.values()) {
      this.removeLines(lines);
    }
    this.orderLines.clear();
    
    // Remove draft lines
    try {
      if (this.draftLines.sl) this.series.removePriceLine(this.draftLines.sl);
      if (this.draftLines.tp) this.series.removePriceLine(this.draftLines.tp);
    } catch (e) {
      console.warn('Failed to remove draft lines during destroy', e);
    }
    this.draftLines = { sl: null, tp: null };

    this.isDestroyed = true;
  }
}
