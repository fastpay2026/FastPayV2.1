import { create } from 'zustand';

interface PriceStore {
  prices: Record<string, number>;
  lastUpdated: Record<string, number>;
  setPrice: (symbol: string, price: number) => void;
}

export const usePriceStore = create<PriceStore>((set) => ({
  prices: {},
  lastUpdated: {},
  setPrice: (symbol, price) =>
    set((state) => ({
      prices: { ...state.prices, [symbol]: price },
      lastUpdated: { ...state.lastUpdated, [symbol]: Date.now() },
    })),
}));
