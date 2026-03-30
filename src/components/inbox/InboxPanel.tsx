import { useRef, useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { AddTaskForm, type AddTaskFormHandle } from './AddTaskForm';
import { InboxTaskCard } from './InboxTaskCard';

interface InboxPanelProps {
  onOpenDetail: (id: string) => void;
  addFormRef?: React.RefObject<AddTaskFormHandle>;
}

export function InboxPanel({ onOpenDetail, addFormRef }: InboxPanelProps) {
  const { settings } = useSettingsStore();
  const allTasks = useTaskStore((s) => s.tasks);
  const searchQuery = useTaskStore((s) => s.searchQuery);
  const tasks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allTasks
      .filter(
        (t) =>
          t.quadrant === 'inbox' &&
          !t.archived &&
          (settings.showCompleted || !t.completed) &&
          (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
      )
      .sort((a, b) => a.quadrantIndex - b.quadrantIndex);
  }, [allTasks, searchQuery, settings.showCompleted]);

  const { setNodeRef, isOver } = useDroppable({ id: 'inbox' });

  const internalRef = useRef<AddTaskFormHandle>(null);
  const formRef = addFormRef ?? internalRef;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3
                      border-b border-slate-200 dark:border-slate-700
                      bg-white dark:bg-slate-850">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">📥</span>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Inbox
          </h2>
          {tasks.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full
                             bg-slate-200 dark:bg-slate-700
                             text-slate-600 dark:text-slate-400">
              {tasks.length}
            </span>
          )}
        </div>
      </div>

      {/* Add task form */}
      <div className="flex-shrink-0">
        <AddTaskForm ref={formRef} />
      </div>

      {/* Task list */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-3 space-y-2 min-h-[100px]
          ${isOver ? 'bg-blue-50 dark:bg-blue-950/20 ring-2 ring-inset ring-blue-300 dark:ring-blue-700 rounded-lg' : ''}`}
        role="list"
        aria-label="Inbox tasks"
        id="inbox-droppable"
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-3xl mb-2" aria-hidden="true">✨</span>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Inbox is empty
              </p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                Add tasks above, then drag them to a quadrant
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <InboxTaskCard key={task.id} task={task} onOpenDetail={onOpenDetail} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
