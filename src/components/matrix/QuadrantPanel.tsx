import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSettingsStore } from '../../store/settingsStore';
import { useTaskStore } from '../../store/taskStore';
import { QUADRANT_CONFIG } from '../../utils/colors';
import { TaskPill } from '../task/TaskPill';
import type { QuadrantId } from '../../types';

interface QuadrantPanelProps {
  quadrantId: Exclude<QuadrantId, 'inbox'>;
  onOpenDetail: (id: string) => void;
}

export function QuadrantPanel({ quadrantId, onOpenDetail }: QuadrantPanelProps) {
  const { settings } = useSettingsStore();
  const allTasks = useTaskStore((s) => s.tasks);
  const tasks = useMemo(
    () =>
      allTasks
        .filter(
          (t) =>
            t.quadrant === quadrantId &&
            !t.archived &&
            (settings.showCompleted || !t.completed),
        )
        .sort((a, b) => a.quadrantIndex - b.quadrantIndex),
    [allTasks, quadrantId, settings.showCompleted],
  );
  const config = QUADRANT_CONFIG[quadrantId];
  const color = settings.quadrantColors[quadrantId];

  const { setNodeRef, isOver } = useDroppable({ id: quadrantId });

  const pillGap = settings.viewMode === 'compact' ? 'gap-1.5' : settings.viewMode === 'comfortable' ? 'gap-2' : 'gap-3';
  const headerPad = settings.viewMode === 'compact' ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div
      className={`flex flex-col h-full rounded-xl border overflow-hidden
        transition-all duration-150
        ${isOver
          ? 'ring-2 ring-inset shadow-lg'
          : 'border-slate-200 dark:border-slate-700 shadow-sm'
        }`}
      style={{
        borderColor: isOver ? color : undefined,
        boxShadow: isOver ? `inset 0 0 0 2px ${color}40, 0 4px 24px ${color}20` : undefined,
      }}
      id={`quadrant-${quadrantId}`}
    >
      {/* Header */}
      <div
        className={`flex-shrink-0 flex items-center justify-between ${headerPad} border-b`}
        style={{
          backgroundColor: color + '18',
          borderColor: color + '30',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="flex-shrink-0 w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
              {config.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight">
              {config.subtitle}
            </p>
          </div>
        </div>

        <span
          className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full text-white ml-2"
          style={{ backgroundColor: color }}
          aria-label={`${tasks.length} tasks`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop zone with pills */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 min-h-[80px] transition-colors duration-150
          ${isOver ? 'bg-opacity-50' : 'bg-white dark:bg-slate-900'}`}
        style={{
          backgroundColor: isOver ? color + '08' : undefined,
        }}
        role="region"
        aria-label={`${config.name} tasks`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={rectSortingStrategy}>
          <div className={`flex flex-wrap ${pillGap} content-start`}>
            {tasks.map((task) => (
              <TaskPill
                key={task.id}
                task={task}
                quadrantId={quadrantId}
                tasksInQuadrant={tasks}
                onOpenDetail={onOpenDetail}
                viewMode={settings.viewMode}
              />
            ))}

            {tasks.length === 0 && (
              <p className="text-xs text-slate-300 dark:text-slate-700 italic py-2">
                Drop tasks here
              </p>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
