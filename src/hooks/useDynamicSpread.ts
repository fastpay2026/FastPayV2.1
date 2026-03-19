import { useState, useEffect, useRef } from 'react';

export const useDynamicSpread = (
  symbol: string,
  currentPrice: number,
  manualSpread: number,
  mode: 'manual' | 'auto'
) => {
  const [effectiveSpread, setEffectiveSpread] = useState(manualSpread);
  const [isVolatile, setIsVolatile] = useState(false);
  const priceHistory = useRef<{ price: number; time: number }[]>([]);
  const stabilityTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (mode === 'manual') {
      setEffectiveSpread(manualSpread);
      setIsVolatile(false);
      return;
    }

    // 1. تحديث تاريخ الأسعار
    const now = Date.now();
    priceHistory.current.push({ price: currentPrice, time: now });
    // الاحتفاظ بآخر دقيقة فقط
    priceHistory.current = priceHistory.current.filter(p => p.time > now - 60000);

    // 2. حساب المومنتوم (التغير خلال دقيقة)
    if (priceHistory.current.length > 2) {
      const oldPrice = priceHistory.current[0].price;
      const change = Math.abs((currentPrice - oldPrice) / oldPrice);

      if (change > 0.005) { // تحرك أكثر من 0.5%
        setEffectiveSpread(manualSpread * 1.5);
        setIsVolatile(true);
        
        // إعادة ضبط مؤقت الاستقرار
        if (stabilityTimer.current) clearTimeout(stabilityTimer.current);
      } else if (isVolatile) {
        // إذا كان السعر مستقراً، ابدأ مؤقت العودة للقيمة اليدوية
        if (!stabilityTimer.current) {
          stabilityTimer.current = setTimeout(() => {
            setEffectiveSpread(manualSpread);
            setIsVolatile(false);
            stabilityTimer.current = null;
          }, 30000); // 30 ثانية استقرار
        }
      } else {
        setEffectiveSpread(manualSpread);
      }
    }
  }, [currentPrice, mode, manualSpread]);

  return effectiveSpread;
};
