import { useState, useEffect } from 'react';
import { Dashboard } from './components';
import { mockInstances } from './mockData';
import { useClaudeInstances } from './hooks/useClaudeInstances';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import type { ClaudeInstance } from './types';

// Check if we're running in Tauri
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

function TauriApp() {
  const { showNotification } = useNotifications();
  const { instances, loading, error, refresh } = useClaudeInstances(3000, showNotification);

  if (loading && instances.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-ember)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Discovering Claude instances...</p>
        </div>
      </div>
    );
  }

  if (error && instances.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to connect to Claude Code</p>
          <p className="text-[var(--text-muted)] text-sm mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-[var(--accent-ember)] text-white rounded-lg hover:bg-[var(--accent-ember-dim)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard instances={instances} />;
}

function BrowserApp() {
  const [instances, setInstances] = useState<ClaudeInstance[]>(mockInstances);

  // Simulate real-time updates for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setInstances((prev) =>
        prev.map((instance) => {
          if (instance.status === 'working' || instance.status === 'online') {
            return {
              ...instance,
              metrics: {
                ...instance.metrics,
                contextUsage: Math.min(
                  100,
                  instance.metrics.contextUsage + Math.random() * 0.5
                ),
                cost: instance.metrics.cost + Math.random() * 0.001,
                tokensIn: instance.metrics.tokensIn + Math.floor(Math.random() * 50),
                tokensOut: instance.metrics.tokensOut + Math.floor(Math.random() * 20),
              },
              lastActivityAt: new Date(),
            };
          }
          return instance;
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return <Dashboard instances={instances} />;
}

function App() {
  const [inTauri, setInTauri] = useState<boolean | null>(null);

  useEffect(() => {
    // Small delay to ensure Tauri internals are loaded
    const timer = setTimeout(() => {
      setInTauri(isTauri());
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (inTauri === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-ember)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <NotificationProvider>
      {inTauri ? <TauriApp /> : <BrowserApp />}
    </NotificationProvider>
  );
}

export default App;
