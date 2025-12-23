// Agent types and interfaces

export enum Strategy {
  Hold = 0,
  Conservative = 1,
  Aggressive = 2,
}

export interface Invoice {
  tokenId: string;
  dataCommitment: string;
  amountCommitment: string;
  dueDate: number;
  createdAt: number;
  issuer: string;
  status: InvoiceStatus;
  riskScore: number;
  paymentProbability: number;
}

export enum InvoiceStatus {
  Active = 0,
  InYield = 1,
  Paid = 2,
  Defaulted = 3,
  Cancelled = 4,
}

export interface Deposit {
  tokenId: string;
  owner: string;
  strategy: Strategy;
  depositTime: number;
  principal: bigint;
  accruedYield: bigint;
  lastYieldUpdate: number;
  active: boolean;
}

export interface AgentDecision {
  tokenId: string;
  recommendedStrategy: Strategy;
  reasoning: string;
  confidence: number;
  timestamp: number;
  executed: boolean;
}

export interface AgentThought {
  type: 'thinking' | 'analysis' | 'decision' | 'execution' | 'error';
  tokenId: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface AnalysisResult {
  tokenId: string;
  invoice: Invoice;
  deposit?: Deposit;
  riskScore: number;
  paymentProbability: number;
  daysUntilDue: number;
  currentStrategy: Strategy;
  recommendedStrategy: Strategy;
  confidence: number;
  reasoning: string;
  shouldAct: boolean;
}

export interface AgentConfig {
  minConfidence: number;
  analysisInterval: number; // ms between analysis cycles
  maxConcurrentAnalyses: number;
  autoExecute: boolean;
}

export interface WebSocketMessage {
  type: 'thought' | 'decision' | 'execution' | 'status' | 'error';
  payload: AgentThought | AgentDecision | { status: string };
}
