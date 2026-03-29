import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '../../store/taskStore';
import type { Task } from '../../types';

interface InboxTaskCardProps {
  task: Task;
  onOpenDetail: (id: string) => void;
}

export function InboxTaskCard({ task, onOpenDetail }: InboxTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: 'task', taskId: task.id, sourceQuadrant: 'inbox' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpenDetail(task.id)}
      data-dragging={isDragging}
      className={`
        group flex items-start gap-2 px-3 py-2.5 rounded-lg
        bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
        shadow-sm hover:shadow-md
        cursor-grab active:cursor-grabbing
        transition-all
        ${isDragging ? 'opacity-40 scale-95' : 'hover:-translate-y-0.5'}
        ${task.completed ? 'opacity-60' : ''}
      `}
      aria-label={`Task: ${task.title}${task.completed ? ' (completed)' : ''}`}
    >
      {/* Drag handle indicator */}
      <span
        className="mt-0.5 flex-shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-slate-400"
        aria-hidden="true"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <circle cx="5" cy="4" r="1.5" />
          <circle cx="11" cy="4" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="11" cy="12" r="1.5" />
        </svg>
      </span>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm text-slate-800 dark:text-slate-100 leading-snug truncate
            ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}
        >
          {task.title}
        </p>
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700
                           text-slate-500 dark:text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {task.dueDate && (
        <span className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  );
}

/** Lightweight drag overlay clone — not interactive. */
export function InboxTaskCardOverlay({ task }: { task: Task }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg
                 bg-white dark:bg-slate-800 border border-blue-400
                 shadow-xl rotate-2 opacity-95 max-w-xs"
    >
      <p className="text-sm text-slate-800 dark:text-slate-100 truncate">{task.title}</p>
    </div>
  );
}
