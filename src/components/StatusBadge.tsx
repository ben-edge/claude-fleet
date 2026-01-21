import type { InstanceStatus } from '../types';

interface StatusBadgeProps {
  status: InstanceStatus;
  showLabel?: boolean;
}

const statusConfig: Record<InstanceStatus, { color: string; bg: string; label: string; pulse?: boolean }> = {
  online: { color: 'bg-green-500', bg: 'bg-green-500/10', label: 'Online' },
  idle: { color: 'bg-yellow-500', bg: 'bg-yellow-500/10', label: 'Idle', pulse: true },
  working: { color: 'bg-orange-500', bg: 'bg-orange-500/10', label: 'Working', pulse: true },
  waiting_input: { color: 'bg-amber-400', bg: 'bg-amber-400/10', label: 'Needs Input', pulse: true },
  disconnected: { color: 'bg-gray-500', bg: 'bg-gray-500/10', label: 'Disconnected' },
  offline: { color: 'bg-red-500', bg: 'bg-red-500/10', label: 'Offline' },
};

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center">
        <span className={`w-2 h-2 rounded-full ${config.color}`} />
        {config.pulse && (
          <span className={`absolute w-2 h-2 rounded-full ${config.color} animate-ping opacity-75`} />
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-[var(--text-muted)] capitalize">{config.label}</span>
      )}
    </div>
  );
}

export function StatusTag({ status }: { status: InstanceStatus }) {
  const config = statusConfig[status];

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium
      ${config.bg} border border-current/10
      ${status === 'offline' ? 'text-red-400' : ''}
      ${status === 'disconnected' ? 'text-gray-400' : ''}
      ${status === 'idle' ? 'text-yellow-400' : ''}
      ${status === 'working' ? 'text-orange-400' : ''}
      ${status === 'waiting_input' ? 'text-amber-400' : ''}
      ${status === 'online' ? 'text-green-400' : ''}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      {config.label}
    </span>
  );
}
