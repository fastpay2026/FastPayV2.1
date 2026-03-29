import WebSocket from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const TIINGO_API_KEY = process.env.TIINGO_API_KEY || process.env.VITE_TIINGO_API_KEY;

const ws = new WebSocket('wss://api.tiingo.com/fx');
ws.on('open', () => {
    console.log('Connected to Tiingo FX WS');
    ws.send(JSON.stringify({
        eventName: 'subscribe',
        authorization: TIINGO_API_KEY,
        eventData: { thresholdLevel: 5, tickers: ['eurusd'] }
    }));
});
ws.on('message', (data) => {
    console.log(data.toString());
});
ws.on('error', (err) => console.error(err));
ws.on('close', () => console.log('Closed'));

setTimeout(() => { ws.close(); process.exit(0); }, 5000);
