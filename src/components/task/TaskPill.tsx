import { useState, useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, QuadrantId } from '../../types';
import { getDisplayNumber } from '../../utils/taskNumbers';
import { getContrastColor } from '../../utils/colors';
import { useSettingsStore } from '../../store/settingsStore';
import { TaskPopover } from './TaskPopover';

interface TaskPillProps {
  task: Task;
  quadrantId: Exclude<QuadrantId, 'inbox'>;
  tasksInQuadrant: Task[];
  onOpenDetail: (id: string) => void;
  viewMode: 'compact' | 'comfortable' | 'spacious';
}

const PILL_SIZE = {
  compact:     'w-8 h-8 text-xs',
  comfortable: 'w-10 h-10 text-sm',
  spacious:    'w-12 h-12 text-base',
};

export function TaskPill({ task, quadrantId, tasksInQuadrant, onOpenDetail, viewMode }: TaskPillProps) {
  const [showPopover, setShowPopover] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { settings } = useSettingsStore();
  const color = settings.quadrantColors[quadrantId];
  const textColor = getContrastColor(color);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      data: { type: 'task', taskId: task.id, sourceQuadrant: quadrantId },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: color,
    color: textColor,
  };

  const displayNumber = getDisplayNumber(task, tasksInQuadrant, settings.taskNumbering);

  const handleMouseEnter = useCallback(() => {
    hoverTimeout.current = setTimeout(() => setShowPopover(true), 300);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setShowPopover(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowPopover(false);
      onOpenDetail(task.id);
    },
    [task.id, onOpenDetail],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpenDetail(task.id);
      }
    },
    [task.id, onOpenDetail],
  );

  return (
    <>
      <button
        ref={(el) => {
          setNodeRef(el);
          (pillRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
        }}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowPopover(true)}
        onBlur={() => setShowPopover(false)}
        data-dragging={isDragging}
        className={`
          task-pill rounded-full flex items-center justify-center font-semibold
          ${PILL_SIZE[viewMode]}
          ${isDragging ? 'opacity-30 scale-90' : ''}
          ${task.completed ? 'opacity-50 line-through' : ''}
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
        `}
        aria-label={`Task ${displayNumber}: ${task.title}${task.completed ? ' (completed)' : ''}`}
        aria-describedby={showPopover ? `popover-${task.id}` : undefined}
      >
        {task.completed ? '✓' : displayNumber}
      </button>

      {showPopover && !isDragging && (
        <TaskPopover task={task} anchorEl={pillRef.current} />
      )}
    </>
  );
}

/** Overlay clone shown while dragging (not interactive). */
export function TaskPillOverlay({
  task,
  quadrantId,
  tasksInQuadrant,
}: {
  task: Task;
  quadrantId: Exclude<QuadrantId, 'inbox'>;
  tasksInQuadrant: Task[];
}) {
  const { settings } = useSettingsStore();
  const color = settings.quadrantColors[quadrantId];
  const textColor = getContrastColor(color);
  const displayNumber = getDisplayNumber(task, tasksInQuadrant, settings.taskNumbering);

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shadow-2xl rotate-6 scale-110"
      style={{ backgroundColor: color, color: textColor }}
    >
      {displayNumber}
    </div>
  );
}
