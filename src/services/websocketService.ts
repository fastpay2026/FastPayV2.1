
export const connectWebSocket = (onMessage: (data: any) => void) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  let ws: WebSocket;
  let reconnectTimeout: NodeJS.Timeout;

  const connect = () => {
    ws = new WebSocket(`${protocol}//${window.location.host}/ws/prices`);
    
    ws.onopen = () => {
      console.log('[WebSocket] Connected to server');
    };
    
    ws.onmessage = (event) => {
      if (!event.data || event.data === 'undefined') return;
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('[WebSocket] Error parsing message:', e);
      }
    };
    
    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };
    
    ws.onclose = () => {
      console.log('[WebSocket] Closed, attempting to reconnect in 5s...');
      clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(connect, 5000);
    };
  };

  connect();
  
  return {
    close: () => {
      clearTimeout(reconnectTimeout);
      ws.close();
    }
  };
};
