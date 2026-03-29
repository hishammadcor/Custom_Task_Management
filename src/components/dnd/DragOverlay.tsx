import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { InboxTaskCardOverlay } from '../inbox/InboxTaskCard';
import { TaskPillOverlay } from '../task/TaskPill';
import type { QuadrantId } from '../../types';

interface AppDragOverlayProps {
  activeId: string | null;
}

export function AppDragOverlay({ activeId }: AppDragOverlayProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const { settings } = useSettingsStore();

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndDragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
      {activeTask ? (
        activeTask.quadrant === 'inbox' ? (
          <InboxTaskCardOverlay task={activeTask} />
        ) : (
          <TaskPillOverlay
            task={activeTask}
            quadrantId={activeTask.quadrant as Exclude<QuadrantId, 'inbox'>}
            tasksInQuadrant={tasks.filter((t) => t.quadrant === activeTask.quadrant && !t.archived)}
          />
        )
      ) : null}
    </DndDragOverlay>
  );
}
