import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

const TIINGO_API_KEY = process.env.TIINGO_API_KEY || process.env.VITE_TIINGO_API_KEY;

async function test() {
    const url = `https://api.tiingo.com/tiingo/crypto/prices?tickers=solusd&resampleFreq=1hour&startDate=2024-03-20&token=${TIINGO_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);
}
test();
