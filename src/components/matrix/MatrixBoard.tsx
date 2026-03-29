import { QuadrantPanel } from './QuadrantPanel';
import type { QuadrantId } from '../../types';

const QUADRANTS: Array<Exclude<QuadrantId, 'inbox'>> = ['q1', 'q2', 'q3', 'q4'];

interface MatrixBoardProps {
  onOpenDetail: (id: string) => void;
}

export function MatrixBoard({ onOpenDetail }: MatrixBoardProps) {
  return (
    <section
      className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 p-3 gap-3"
      aria-label="Eisenhower Matrix"
    >
      {/* Axis labels */}
      <div className="flex-shrink-0 flex justify-between items-center px-1">
        <div className="flex flex-col items-center text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-600">
            ← Less Important
          </span>
        </div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-600">
          Importance →
        </div>
      </div>

      {/* 2×2 Grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
        {QUADRANTS.map((qId) => (
          <QuadrantPanel key={qId} quadrantId={qId} onOpenDetail={onOpenDetail} />
        ))}
      </div>

      {/* Urgency axis label */}
      <div className="flex-shrink-0 flex justify-between items-center px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-600">
          Less Urgent ↑
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-600">
          ↓ More Urgent
        </span>
      </div>
    </section>
  );
}
