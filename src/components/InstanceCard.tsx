import { motion } from 'motion/react';
import { GitBranch, Folder, Sparkles } from 'lucide-react';
import type { ClaudeInstance } from '../types';
import { StatusBadge, StatusTag } from './StatusBadge';

interface InstanceCardProps {
  instance: ClaudeInstance;
  isSelected: boolean;
  onSelect: () => void;
}

export function InstanceCard({ instance, isSelected, onSelect }: InstanceCardProps) {
  const isInactive = instance.status === 'disconnected' || instance.status === 'offline';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        relative cursor-pointer rounded-xl p-4
        border transition-all duration-200
        ${isSelected
          ? 'border-[var(--accent-ember)] bg-[var(--accent-ember-glow)] shadow-lg shadow-orange-500/10'
          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-default)] hover:bg-[var(--bg-elevated)]'
        }
        ${isInactive ? 'opacity-60' : ''}
      `}
    >
      {/* Accent line at top */}
      <div className={`
        absolute top-0 left-4 right-4 h-[2px] rounded-full
        ${isSelected ? 'bg-[var(--accent-ember)]' : 'bg-transparent'}
        transition-colors duration-200
      `} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${isSelected ? 'bg-[var(--accent-ember)]' : 'bg-[var(--bg-elevated)]'}
            transition-colors duration-200
          `}>
            <Sparkles className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[var(--accent-ember)]'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-sm leading-tight">
              {instance.name}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">claude</p>
          </div>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 mb-3">
        <StatusBadge status={instance.status} />
        <StatusTag status={instance.status} />
      </div>

      {/* Project info */}
      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1">
          <Folder className="w-3 h-3" />
          <span>{instance.project}</span>
        </div>
        <div className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          <span>{instance.branch}</span>
        </div>
      </div>

      {/* Metrics - only show if active */}
      {!isInactive && (
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">{instance.model}</span>
            <span className="text-[var(--accent-ember)] font-mono font-medium">
              ${instance.metrics.cost.toFixed(4)}
            </span>
          </div>

          {/* Context bar */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[var(--text-muted)] text-xs">ctx</span>
            <div className="flex-1 h-1.5 bg-[var(--bg-deep)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--accent-ember-dim)] to-[var(--accent-ember)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${instance.metrics.contextUsage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[var(--text-muted)] text-xs font-mono w-8 text-right">
              {instance.metrics.contextUsage}%
            </span>
          </div>

          {/* Line changes */}
          <div className="mt-2 flex items-center gap-2 text-xs font-mono">
            <span className="text-green-400">+{instance.metrics.linesAdded}</span>
            <span className="text-red-400">-{instance.metrics.linesRemoved}</span>
            <span className="text-[var(--text-muted)] ml-auto">
              {(instance.metrics.tokensIn / 1000).toFixed(1)}k tok
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
