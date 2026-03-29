
import Ably from 'ably';

const getClientId = () => {
  let clientId = sessionStorage.getItem('ably_client_id');
  if (!clientId) {
    clientId = `fastpay-client-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('ably_client_id', clientId);
  }
  return clientId;
};

const ablyOptions = {
  clientId: getClientId(),
  authCallback: async (tokenParams: any, callback: any) => {
    try {
      console.log('[Ably Auth] Requesting token from server...');
      const clientId = getClientId();
      const authUrl = `${window.location.origin}/api/ably/auth?clientId=${encodeURIComponent(clientId)}`;
      console.log('[Ably Auth] Fetching from:', authUrl);
      
      let attempts = 0;
      const maxAttempts = 3;
      let response;
      
      while (attempts < maxAttempts) {
        try {
          response = await fetch(authUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
          if (response.ok) break;
        } catch (e) {
          console.warn(`[Ably Auth] Attempt ${attempts + 1} failed:`, e);
        }
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      if (!response || !response.ok) {
        const errorText = response ? await response.text() : 'Network error';
        console.error('[Ably Auth] Server returned error:', errorText);
        callback(new Error(errorText || 'Auth Failed'), null);
        return;
      }

      const tokenRequest = await response.json();
      console.log('[Ably Auth] Token request received successfully');
      callback(null, tokenRequest);
    } catch (err) {
      console.error('[Ably Auth] Fetch error:', err);
      callback(err, null);
    }
  }
};

console.log('[Ably] Initializing Ably client with authCallback');
const ably = new Ably.Realtime(ablyOptions);

ably.connection.on('connected', () => {
  console.log('[Ably] Connected successfully');
});

ably.connection.on('connecting', () => {
  console.log('[Ably] Connecting...');
});

ably.connection.on('disconnected', () => {
  console.log('[Ably] Disconnected');
});

ably.connection.on('failed', (err) => {
  console.error('[Ably] Connection failed:', err);
});

export const ablyService = {
  getChannel: (channelName: string) => ably.channels.get(channelName),
  ably: ably
};
