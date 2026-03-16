async function check() {
  const twelveDataKey = process.env.TWELVE_DATA_API_KEY;
  const symbolString = 'EUR/USD,GBP/USD,USD/JPY,XAU/USD,XAG/USD,DJI,IXIC,WTIC';
  const response = await fetch(`https://api.twelvedata.com/quote?symbol=${symbolString}&apikey=${twelveDataKey}`);
  const data = await response.json();
  console.log(data);
}
check();
