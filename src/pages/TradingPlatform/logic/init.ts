// src/pages/TradingPlatform/logic/init.ts
export const initApp = async (
  fetchWalletFn: () => Promise<void>,
  fetchInitialPositionsFn: () => Promise<void>,
  fetchAssetsFn: () => Promise<void>,
  fetchInitialTradesFn: () => Promise<void>,
  fetchSpreadsFn: () => Promise<void>
) => {
  await Promise.all([fetchWalletFn(), fetchInitialPositionsFn(), fetchAssetsFn(), fetchInitialTradesFn(), fetchSpreadsFn()]);
};
