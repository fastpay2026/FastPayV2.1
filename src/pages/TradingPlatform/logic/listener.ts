// src/pages/TradingPlatform/logic/listener.ts
import { usePriceStore } from '../store/usePriceStore';

export const listener = (message: any) => {
  console.log('[Listener] Received message:', message);
  // استخراج البيانات من رسالة Ably
  const data = message.data || message;
  
  if (!data) {
    console.warn('[Listener] Received empty data');
    return;
  }
  
  // محاولة استخراج السعر والرمز
  const price = data.price || data.ask || data.bid;
  const dataSymbol = data.symbol;

  if (!dataSymbol || price === undefined || price === null) {
    console.warn('[Listener] Could not find symbol or price in data:', data);
    return;
  }

  console.log(`[Listener] Updating price for ${dataSymbol}: ${price}`);

  // تحديث المجرى المركزي للأسعار فقط
  usePriceStore.getState().setPrice(dataSymbol, Number(price));
};

