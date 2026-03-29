import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Task } from '../../types';

interface TaskPopoverProps {
  task: Task;
  anchorEl: HTMLElement | null;
}

export function TaskPopover({ task, anchorEl }: TaskPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position the popover above the anchor element
  const rect = anchorEl?.getBoundingClientRect();
  if (!rect) return null;

  const left = rect.left + rect.width / 2;
  const top = rect.top + window.scrollY - 8;

  return createPortal(
    <div
      ref={popoverRef}
      role="tooltip"
      className="fixed z-[9999] pointer-events-none"
      style={{ left, top, transform: 'translate(-50%, -100%)' }}
    >
      <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                      rounded-lg shadow-xl px-3 py-2 max-w-[220px] animate-scale-in">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">
          {task.title}
        </p>
        {task.description && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-3">
            {task.description}
          </p>
        )}
        {(task.dueDate || task.tags.length > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {task.dueDate && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                📅 {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700
                                         text-slate-500 dark:text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        )}
        {task.completed && (
          <p className="mt-1 text-xs text-emerald-500">✓ Completed</p>
        )}
        {/* Arrow pointing down */}
        <div className="popover-arrow" aria-hidden="true" />
      </div>
    </div>,
    document.body,
  );
}
