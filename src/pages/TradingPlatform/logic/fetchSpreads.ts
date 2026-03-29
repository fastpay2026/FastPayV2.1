// src/pages/TradingPlatform/logic/fetchSpreads.ts
export const fetchSpreads = async (setSpreads: any) => {
  // Assuming spreadService is available or needs to be imported
  // Adjust import path as necessary
  const { getSpreads } = await import('../../../services/spreadService');
  const data = await getSpreads();
  setSpreads(data);
};
