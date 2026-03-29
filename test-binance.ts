import fetch from 'node-fetch';

async function test() {
    const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=2`;
    console.log(url);
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);
}
test();
