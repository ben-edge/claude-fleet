import { useState, useEffect } from 'react';
import { Dashboard } from './components';
import { mockInstances } from './mockData';
import type { ClaudeInstance } from './types';

function App() {
  const [instances, setInstances] = useState<ClaudeInstance[]>(mockInstances);

  // Simulate real-time updates
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

export default App;
