import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

export const setupExpress = () => {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        "https://trade.fastpay-network.com",
        "https://fastpay-network.com",
        "http://localhost:3000",
        "http://localhost:5173"
      ];
      
      // Allow any origin that ends with .run.app (for AI Studio previews)
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.run.app')) {
        callback(null, true);
      } else {
        // For development, allow all if not in production
        if (process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  }));
  app.use(express.json());

  return { app, httpServer, io };
};
