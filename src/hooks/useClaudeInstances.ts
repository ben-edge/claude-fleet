import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ClaudeInstance, TerminalLine } from '../types';

interface BackendInstance {
  id: string;
  session_id: string | null;
  name: string;
  model: string;
  status: string;
  project: string;
  branch: string;
  working_directory: string;
  current_task: string | null;
  metrics: {
    context_usage: number;
    cost: number;
    lines_added: number;
    lines_removed: number;
    tokens_in: number;
    tokens_out: number;
  };
  terminal_history: Array<{
    id: string;
    line_type: string;
    content: string;
    timestamp: string;
  }>;
  started_at: string;
  last_activity_at: string;
  pid: number | null;
}

function mapBackendInstance(backend: BackendInstance): ClaudeInstance {
  return {
    id: backend.id,
    sessionId: backend.session_id || undefined,
    name: backend.name,
    model: backend.model || 'Claude',
    status: backend.status as ClaudeInstance['status'],
    project: backend.project,
    branch: backend.branch,
    workingDirectory: backend.working_directory,
    currentTask: backend.current_task || undefined,
    metrics: {
      contextUsage: backend.metrics.context_usage,
      cost: backend.metrics.cost,
      linesAdded: backend.metrics.lines_added,
      linesRemoved: backend.metrics.lines_removed,
      tokensIn: backend.metrics.tokens_in,
      tokensOut: backend.metrics.tokens_out,
    },
    terminalHistory: backend.terminal_history.map((line) => ({
      id: line.id,
      type: line.line_type as TerminalLine['type'],
      content: line.content,
      timestamp: new Date(line.timestamp),
    })),
    startedAt: new Date(backend.started_at),
    lastActivityAt: new Date(backend.last_activity_at),
  };
}

export function useClaudeInstances(pollInterval = 5000, onNotification?: (title: string, body: string) => void) {
  const [instances, setInstances] = useState<ClaudeInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousStatusesRef = useRef<Record<string, string>>({});

  const checkStatusChanges = useCallback((newInstances: ClaudeInstance[]) => {
    const prevStatuses = previousStatusesRef.current;

    newInstances.forEach((instance) => {
      const prevStatus = prevStatuses[instance.id];

      // Notify when agent finishes working (was working, now idle or waiting_input)
      if (prevStatus === 'working' && (instance.status === 'idle' || instance.status === 'waiting_input')) {
        const action = instance.status === 'waiting_input' ? 'needs your input' : 'finished working';
        onNotification?.(
          `${instance.project}`,
          `Agent ${action}: ${instance.name}`
        );
      }
    });

    // Update previous statuses
    const newStatuses: Record<string, string> = {};
    newInstances.forEach((instance) => {
      newStatuses[instance.id] = instance.status;
    });
    previousStatusesRef.current = newStatuses;
  }, [onNotification]);

  const fetchInstances = useCallback(async () => {
    try {
      const data = await invoke<BackendInstance[]>('get_claude_instances');
      const mapped = data.map(mapBackendInstance);
      // Sort by ID to maintain stable order across re-fetches
      mapped.sort((a, b) => a.id.localeCompare(b.id));

      // Check for status changes and notify
      checkStatusChanges(mapped);

      setInstances(mapped);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch instances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch instances');
    } finally {
      setLoading(false);
    }
  }, [checkStatusChanges]);

  const refresh = useCallback(async () => {
    try {
      const data = await invoke<BackendInstance[]>('refresh_instances');
      const mapped = data.map(mapBackendInstance);
      mapped.sort((a, b) => a.id.localeCompare(b.id));
      checkStatusChanges(mapped);
      setInstances(mapped);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh instances:', err);
    }
  }, [checkStatusChanges]);

  useEffect(() => {
    fetchInstances();

    const interval = setInterval(fetchInstances, pollInterval);
    return () => clearInterval(interval);
  }, [fetchInstances, pollInterval]);

  return { instances, loading, error, refresh };
}

export function useInstanceHistory(sessionPath: string | null, limit = 100) {
  const [history, setHistory] = useState<TerminalLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionPath) {
      setHistory([]);
      return;
    }

    setLoading(true);
    invoke<Array<{ id: string; line_type: string; content: string; timestamp: string }>>(
      'get_instance_history',
      { sessionPath, limit }
    )
      .then((data) => {
        setHistory(
          data.map((line) => ({
            id: line.id,
            type: line.line_type as TerminalLine['type'],
            content: line.content,
            timestamp: new Date(line.timestamp),
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionPath, limit]);

  return { history, loading };
}
