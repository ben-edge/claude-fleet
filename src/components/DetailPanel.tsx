import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  X,
  Terminal,
  DollarSign,
  Gauge,
  FileCode,
  Coins,
  Settings
} from 'lucide-react';
import type { ClaudeInstance } from '../types';
import { StatusBadge } from './StatusBadge';

interface DetailPanelProps {
  instance: ClaudeInstance | null;
  onClose: () => void;
  onRestart: (id: string) => void;
}

export function DetailPanel({ instance, onClose, onRestart }: DetailPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [instance?.terminalHistory]);

  return (
    <AnimatePresence>
      {instance && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-full max-w-xl bg-[var(--bg-deep)] border-l border-[var(--border-subtle)] flex flex-col z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-ember-glow)] flex items-center justify-center">
                <Terminal className="w-5 h-5 text-[var(--accent-ember)]" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">{instance.name}</h2>
                <div className="flex items-center gap-2">
                  <StatusBadge status={instance.status} />
                  {instance.currentTask && (
                    <span className="text-xs text-[var(--text-muted)]">• {instance.currentTask}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRestart(instance.id)}
                className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Restart Session"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Restart button */}
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <button
              onClick={() => onRestart(instance.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-ember)] hover:bg-[var(--accent-ember-glow)] text-[var(--text-secondary)] hover:text-[var(--accent-ember)] transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-medium">Restart Session</span>
            </button>
          </div>

          {/* Terminal */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border-subtle)]">
              <Terminal className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">Terminal</span>
            </div>

            <div
              ref={terminalRef}
              className="flex-1 overflow-auto p-4 font-mono text-sm bg-[var(--bg-void)]"
            >
              {instance.terminalHistory.length === 0 ? (
                <div className="text-[var(--text-muted)] italic">No terminal history</div>
              ) : (
                instance.terminalHistory.map((line) => (
                  <div
                    key={line.id}
                    className={`
                      leading-relaxed
                      ${line.type === 'input' ? 'text-[var(--accent-ember)]' : ''}
                      ${line.type === 'output' ? 'text-[var(--text-secondary)]' : ''}
                      ${line.type === 'system' ? 'text-[var(--text-muted)] text-xs' : ''}
                      ${line.type === 'error' ? 'text-red-400' : ''}
                    `}
                  >
                    {line.content || '\u00A0'}
                  </div>
                ))
              )}

              {/* Blinking cursor */}
              {(instance.status === 'idle' || instance.status === 'waiting_input') && (
                <div className="flex items-center mt-1">
                  <span className="text-[var(--accent-ember)]">❯</span>
                  <span className="w-2 h-4 bg-[var(--accent-ember)] ml-1 animate-terminal-blink" />
                </div>
              )}
            </div>
          </div>

          {/* Session Metrics */}
          <div className="border-t border-[var(--border-subtle)] p-4 bg-[var(--bg-surface)]">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Session Metrics
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Context */}
              <div className="bg-[var(--bg-deep)] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-xs text-[var(--text-muted)]">Context</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[var(--bg-void)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[var(--accent-ember-dim)] to-[var(--accent-ember)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${instance.metrics.contextUsage}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-[var(--text-primary)]">
                    {instance.metrics.contextUsage}%
                  </span>
                </div>
              </div>

              {/* Cost */}
              <div className="bg-[var(--bg-deep)] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-xs text-[var(--text-muted)]">Cost</span>
                </div>
                <span className="text-lg font-mono font-semibold text-[var(--accent-ember)]">
                  ${instance.metrics.cost.toFixed(4)}
                </span>
              </div>

              {/* Lines Changed */}
              <div className="bg-[var(--bg-deep)] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-xs text-[var(--text-muted)]">Lines Changed</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-green-400">+{instance.metrics.linesAdded}</span>
                  <span className="text-red-400">-{instance.metrics.linesRemoved}</span>
                </div>
              </div>

              {/* Tokens */}
              <div className="bg-[var(--bg-deep)] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-xs text-[var(--text-muted)]">Tokens</span>
                </div>
                <span className="text-sm font-mono text-[var(--text-primary)]">
                  {(instance.metrics.tokensIn / 1000).toFixed(1)}k → {(instance.metrics.tokensOut / 1000).toFixed(1)}k
                </span>
              </div>
            </div>

            {/* Configure Statusline */}
            <button className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-deep)] transition-colors">
              <Settings className="w-3 h-3" />
              <span>Reconfigure Statusline</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
