import { motion } from 'motion/react';
import { Plus, Sparkles, Settings, Bell } from 'lucide-react';

interface HeaderProps {
  agentCount: number;
  activeCount: number;
  onNewAgent: () => void;
}

export function Header({ agentCount, activeCount, onNewAgent }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-void)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-ember)] to-[var(--accent-ember-dim)] flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-[var(--accent-ember)] blur-lg opacity-20" />
            </motion.div>

            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                Claude Fleet
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Manage your Claude Code instances
              </p>
            </div>
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center gap-4">
            {/* Agent count badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">{activeCount}</span>
                {' '}active
              </span>
              <span className="text-[var(--border-strong)]">|</span>
              <span className="text-sm text-[var(--text-muted)]">
                {agentCount} agents
              </span>
            </div>

            {/* Notification bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
            >
              <Bell className="w-5 h-5 text-[var(--text-muted)]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--accent-ember)] rounded-full" />
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
            >
              <Settings className="w-5 h-5 text-[var(--text-muted)]" />
            </motion.button>

            {/* New Agent button */}
            <motion.button
              onClick={onNewAgent}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-ember)] hover:bg-[var(--accent-ember-dim)] text-white font-medium text-sm transition-colors shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Agent</span>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}
