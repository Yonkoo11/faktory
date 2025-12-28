// WebSocket server for streaming agent thoughts to frontend

import { WebSocketServer, WebSocket } from 'ws';
import { AgentThought, WebSocketMessage, AgentDecision } from './types.js';

// Heartbeat configuration
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
const CLIENT_TIMEOUT_MS = 60000; // 60 seconds without pong = dead

interface ClientInfo {
  ws: WebSocket;
  isAlive: boolean;
  lastPong: number;
}

export class AgentWebSocket {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientInfo> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private isRunning = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private port: number = 8080) {}

  start(): void {
    if (this.isRunning) return;

    this.wss = new WebSocketServer({ port: this.port });
    this.isRunning = true;

    console.log(`🔌 WebSocket server started on ws://localhost:${this.port}`);

    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      console.log(`📡 Client connected from ${clientIp}`);

      // Register client with heartbeat info
      const clientInfo: ClientInfo = {
        ws,
        isAlive: true,
        lastPong: Date.now(),
      };
      this.clients.set(ws, clientInfo);

      // Send initial status
      this.sendToClient(ws, {
        type: 'status',
        payload: { status: 'connected' },
      });

      // Send any queued messages
      this.messageQueue.forEach((msg) => this.sendToClient(ws, msg));

      // Handle pong responses
      ws.on('pong', () => {
        const info = this.clients.get(ws);
        if (info) {
          info.isAlive = true;
          info.lastPong = Date.now();
        }
      });

      ws.on('close', () => {
        console.log(`📡 Client disconnected from ${clientIp}`);
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Handle incoming messages (for future expansion)
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch {
          console.warn('Invalid message received:', data.toString());
        }
      });
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    // Start heartbeat interval
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      this.clients.forEach((info, ws) => {
        // Check if client hasn't responded in too long
        if (now - info.lastPong > CLIENT_TIMEOUT_MS) {
          console.log(`📡 Client timed out (no pong for ${CLIENT_TIMEOUT_MS}ms), disconnecting`);
          ws.terminate();
          this.clients.delete(ws);
          return;
        }

        // Check if last ping wasn't acknowledged
        if (!info.isAlive) {
          console.log('📡 Client missed heartbeat, disconnecting');
          ws.terminate();
          this.clients.delete(ws);
          return;
        }

        // Send ping
        info.isAlive = false;
        ws.ping();
      });
    }, HEARTBEAT_INTERVAL_MS);
  }

  stop(): void {
    if (!this.isRunning || !this.wss) return;

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.clients.forEach((info) => {
      info.ws.close();
    });
    this.clients.clear();

    this.wss.close();
    this.isRunning = false;

    console.log('🔌 WebSocket server stopped');
  }

  private handleClientMessage(ws: WebSocket, message: Record<string, unknown>): void {
    // Handle client requests (e.g., request analysis of specific invoice)
    if (message.type === 'requestAnalysis' && message.tokenId) {
      // Emit event for agent to handle
      this.onAnalysisRequest?.(message.tokenId as string);
    }

    // Handle demo scenario triggers
    if (message.type === 'triggerDemo' && message.scenario) {
      const scenario = message.scenario as 'market_crash' | 'market_rally' | 'reset';
      this.onDemoScenario?.(scenario);
    }
  }

  // Callback for analysis requests
  onAnalysisRequest?: (tokenId: string) => void;

  // Callback for demo scenarios
  onDemoScenario?: (scenario: 'market_crash' | 'market_rally' | 'reset') => void;

  broadcast(message: WebSocketMessage): void {
    const data = JSON.stringify(message);

    this.clients.forEach((info) => {
      if (info.ws.readyState === WebSocket.OPEN) {
        info.ws.send(data);
      }
    });

    // Keep last 50 messages in queue for new connections
    this.messageQueue.push(message);
    if (this.messageQueue.length > 50) {
      this.messageQueue.shift();
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcastThought(thought: AgentThought): void {
    this.broadcast({
      type: 'thought',
      payload: thought,
    });
  }

  broadcastDecision(decision: AgentDecision): void {
    this.broadcast({
      type: 'decision',
      payload: decision,
    });
  }

  broadcastExecution(tokenId: string, success: boolean, txHash?: string): void {
    this.broadcast({
      type: 'execution',
      payload: {
        type: 'execution',
        tokenId,
        message: success
          ? `Strategy change executed successfully${txHash ? ` (tx: ${txHash.slice(0, 10)}...)` : ''}`
          : 'Strategy change execution failed',
        timestamp: Date.now(),
        data: { success, txHash },
      },
    });
  }

  broadcastError(tokenId: string, error: string): void {
    this.broadcast({
      type: 'error',
      payload: {
        type: 'error',
        tokenId,
        message: error,
        timestamp: Date.now(),
      },
    });
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  // Get connection health info
  getConnectionHealth(): { total: number; alive: number; stale: number } {
    let alive = 0;
    let stale = 0;
    const now = Date.now();

    this.clients.forEach((info) => {
      if (info.isAlive && now - info.lastPong < CLIENT_TIMEOUT_MS) {
        alive++;
      } else {
        stale++;
      }
    });

    return { total: this.clients.size, alive, stale };
  }
}
