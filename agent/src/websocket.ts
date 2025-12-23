// WebSocket server for streaming agent thoughts to frontend

import { WebSocketServer, WebSocket } from 'ws';
import { AgentThought, WebSocketMessage, AgentDecision } from './types.js';

export class AgentWebSocket {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private messageQueue: WebSocketMessage[] = [];
  private isRunning = false;

  constructor(private port: number = 8080) {}

  start(): void {
    if (this.isRunning) return;

    this.wss = new WebSocketServer({ port: this.port });
    this.isRunning = true;

    console.log(`🔌 WebSocket server started on ws://localhost:${this.port}`);

    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      console.log(`📡 Client connected from ${clientIp}`);

      this.clients.add(ws);

      // Send initial status
      this.sendToClient(ws, {
        type: 'status',
        payload: { status: 'connected' },
      });

      // Send any queued messages
      this.messageQueue.forEach((msg) => this.sendToClient(ws, msg));

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
  }

  stop(): void {
    if (!this.isRunning || !this.wss) return;

    this.clients.forEach((client) => {
      client.close();
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
  }

  // Callback for analysis requests
  onAnalysisRequest?: (tokenId: string) => void;

  broadcast(message: WebSocketMessage): void {
    const data = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
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
}
