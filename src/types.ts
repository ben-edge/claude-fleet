export type InstanceStatus = 'online' | 'idle' | 'working' | 'waiting_input' | 'disconnected' | 'offline';

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'system' | 'error';
  content: string;
  timestamp: Date;
}

export interface SessionMetrics {
  contextUsage: number;
  cost: number;
  linesAdded: number;
  linesRemoved: number;
  tokensIn: number;
  tokensOut: number;
}

export interface ClaudeInstance {
  id: string;
  sessionId?: string;
  name: string;
  model: string;
  status: InstanceStatus;
  project: string;
  branch: string;
  workingDirectory: string;
  currentTask?: string;
  metrics: SessionMetrics;
  terminalHistory: TerminalLine[];
  startedAt: Date;
  lastActivityAt: Date;
}
