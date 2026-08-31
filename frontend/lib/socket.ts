function getWsBase(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect directly to Django on port 8000 using the same hostname,
    // because Next.js rewrites do not reliably proxy WebSockets.
    return `${protocol}//${window.location.hostname}:8000`;
  }
  return 'ws://127.0.0.1:8000';
}

const WS_BASE = getWsBase();

export type WSMessage = {
  type: string;
  [key: string]: unknown;
};

type MessageHandler = (msg: WSMessage) => void;

export class SignalingSocket {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private instanceId: string;

  constructor(instanceId: string) {
    this.instanceId = instanceId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${WS_BASE}/ws/meeting/${this.instanceId}/`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("[WS] Connected to signaling server");
        resolve();
      };

      this.ws.onerror = (err) => {
        console.error("[WS] Connection error:", err);
        reject(err);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          const handlers = this.handlers.get(msg.type) || [];
          handlers.forEach((h) => h(msg));
        } catch (e) {
          console.error("[WS] Parse error:", e);
        }
      };

      this.ws.onclose = (event) => {
        console.log("[WS] Disconnected:", event.code, event.reason);
      };
    });
  }

  on(type: string, handler: MessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  off(type: string, handler?: MessageHandler): void {
    if (!handler) {
      this.handlers.delete(type);
    } else {
      const handlers = this.handlers.get(type) || [];
      this.handlers.set(type, handlers.filter((h) => h !== handler));
    }
  }

  send(msg: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn("[WS] Cannot send — not connected");
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
