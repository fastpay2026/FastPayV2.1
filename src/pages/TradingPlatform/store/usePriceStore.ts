import { create } from 'zustand';

interface PriceStore {
  prices: Record<string, number>;
  setPrice: (symbol: string, price: number) => void;
}

export const usePriceStore = create<PriceStore>((set) => ({
  prices: {},
  setPrice: (symbol, price) =>
    set((state) => ({
      prices: { ...state.prices, [symbol]: price },
    })),
}));
