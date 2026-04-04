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

  // التعامل مع التحديثات المجمعة (Batch) أو الفردية
  const updates = Array.isArray(data) ? data : [data];

  updates.forEach(update => {
    // محاولة استخراج السعر والرمز
    let price = update.price || update.ask || update.bid;
    const dataSymbol = update.symbol;

    if (!dataSymbol || price === undefined || price === null) {
      console.warn('[Listener] Could not find symbol or price in data:', update);
      return;
    }

    console.log(`[Listener] Updating price for ${dataSymbol}: ${price}`);

    // تحديث المجرى المركزي للأسعار فقط
    usePriceStore.getState().setPrice(dataSymbol, Number(price));
  });
};

