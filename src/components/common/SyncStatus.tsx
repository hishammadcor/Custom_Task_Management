import type { SyncStatus } from '../../types';

const STATUS_CONFIG: Record<SyncStatus, { label: string; color: string; dot: string; pulse?: boolean }> = {
  disabled: { label: 'Local only', color: 'text-slate-400 dark:text-slate-500', dot: 'bg-slate-300 dark:bg-slate-600' },
  idle:     { label: 'Idle', color: 'text-slate-400', dot: 'bg-slate-300' },
  syncing:  { label: 'Syncing…', color: 'text-blue-500', dot: 'bg-blue-500', pulse: true },
  synced:   { label: 'Synced', color: 'text-emerald-500', dot: 'bg-emerald-500' },
  offline:  { label: 'Offline', color: 'text-amber-500', dot: 'bg-amber-500' },
  error:    { label: 'Sync error', color: 'text-red-500', dot: 'bg-red-500' },
};

interface SyncStatusBadgeProps {
  status: SyncStatus;
  onRetry?: () => void;
}

export function SyncStatusBadge({ status, onRetry }: SyncStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${config.color}`} role="status" aria-live="polite">
      <span
        className={`inline-block w-2 h-2 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      <span>{config.label}</span>
      {status === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="ml-1 underline hover:no-underline focus-visible:outline-none"
          aria-label="Retry sync"
        >
          Retry
        </button>
      )}
    </div>
  );
}
