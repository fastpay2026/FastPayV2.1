export const generateDummyKlines = (count = 100, basePrice = 100) => {
  const dummyKlines = [];
  let lastPrice = basePrice;
  const now = Date.now();
  const volatility = basePrice * 0.001;
  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * 60000;
    const open = lastPrice;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5);
    dummyKlines.push([time, open, high, low, close, 0]);
    lastPrice = close;
  }
  return dummyKlines;
};
