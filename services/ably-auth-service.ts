import Ably from 'ably';
import { Request, Response } from 'express';

let ablyRest: Ably.Rest | null = null;

export const handleAblyAuth = async (req: Request, res: Response) => {
  console.log('[Ably Auth] Request received from:', req.ip);
  const key = process.env.ABLY_API_KEY || process.env.VITE_ABLY_API_KEY;

  if (!key) {
    console.error('[Ably Auth] No API Key found in environment variables!');
    return res.status(401).json({ error: 'Ably Auth Failed: No API Key' });
  }

  if (!ablyRest) {
    ablyRest = new Ably.Rest({ key });
  }

  try {
    const clientId = (req.query.clientId as string) || `fastpay-client-${Math.random().toString(36).substring(2, 15)}`;
    const tokenRequest = await ablyRest.auth.createTokenRequest({ clientId });
    console.log(`[Ably Auth] Token request created successfully for client: ${clientId}`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(tokenRequest));
  } catch (error) {
    console.error('[Ably Auth] Error creating token request:', error);
    res.status(401).json({ error: 'Ably Auth Failed' });
  }
};
