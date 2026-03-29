import Ably from 'ably';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.ABLY_API_KEY || process.env.VITE_ABLY_API_KEY;
const ably = new Ably.Realtime({ key: key as string });
const channel = ably.channels.get('market-data');

channel.subscribe('update', (message) => {
  console.log('Received update:', message.data);
});

setTimeout(() => {
  ably.close();
}, 10000);




















