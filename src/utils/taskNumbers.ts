import type { Task, QuadrantId } from '../types';

/**
 * Returns the display string for a task pill.
 * - sequential: task.sequentialNumber (e.g. "5")
 * - by-quadrant: positional within quadrant with prefix (e.g. "Q1-3")
 */
export function getDisplayNumber(
  task: Task,
  tasksInQuadrant: Task[],
  numbering: 'sequential' | 'by-quadrant'
): string {
  if (numbering === 'sequential') {
    return String(task.sequentialNumber);
  }
  const sorted = [...tasksInQuadrant].sort((a, b) => a.quadrantIndex - b.quadrantIndex);
  const index = sorted.findIndex((t) => t.id === task.id);
  const prefix = task.quadrant.toUpperCase(); // 'Q1', 'Q2', etc.
  return `${prefix}-${index + 1}`;
}

/** Returns all non-archived tasks in a quadrant, sorted by quadrantIndex. */
export function getQuadrantTasks(tasks: Task[], quadrant: QuadrantId, showCompleted: boolean): Task[] {
  return tasks
    .filter((t) => t.quadrant === quadrant && !t.archived && (showCompleted || !t.completed))
    .sort((a, b) => a.quadrantIndex - b.quadrantIndex);
}

/** Returns the next quadrantIndex to assign when adding a task to a quadrant. */
export function getNextQuadrantIndex(tasks: Task[], quadrant: QuadrantId): number {
  const existing = tasks.filter((t) => t.quadrant === quadrant && !t.archived);
  return existing.length > 0 ? Math.max(...existing.map((t) => t.quadrantIndex)) + 1 : 0;
}
