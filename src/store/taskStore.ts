import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Task, QuadrantId } from '../types';
import { getNextQuadrantIndex } from '../utils/taskNumbers';

const MAX_HISTORY = 20;

interface TaskState {
  tasks: Task[];
  nextSequentialNumber: number;
  selectedTaskId: string | null;
  searchQuery: string;
  /** Snapshots for undo (past[past.length-1] is most recent). */
  past: Task[][];
  /** Snapshots for redo. */
  future: Task[][];

  // ── Selectors ────────────────────────────────────────────────────────────
  getTasksByQuadrant(q: QuadrantId, showCompleted: boolean): Task[];
  getFilteredInboxTasks(showCompleted: boolean): Task[];
  getSearchResults(showCompleted: boolean): Task[];

  // ── Mutations ────────────────────────────────────────────────────────────
  addTask(title: string): void;
  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'sequentialNumber'>>): void;
  deleteTask(id: string): void;
  moveTask(id: string, toQuadrant: QuadrantId): void;
  reorderTasks(quadrant: QuadrantId, activeId: string, overId: string): void;
  completeTask(id: string): void;
  archiveTask(id: string): void;
  setSelectedTask(id: string | null): void;
  setSearchQuery(q: string): void;
  importTasks(tasks: Task[]): void;
  clearAll(): void;
  undo(): void;
  redo(): void;

  // ── Remote sync helpers ──────────────────────────────────────────────────
  /** Upserts a task received from Firestore (last-write-wins). Does NOT push undo snapshot. */
  upsertRemoteTask(task: Task): void;
  /** Removes a task that was deleted on another device. Does NOT push undo snapshot. */
  removeRemoteTask(id: string): void;
}

function snapshot(tasks: Task[]): Task[] {
  return tasks.map((t) => ({ ...t }));
}

function now(): string {
  return new Date().toISOString();
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      nextSequentialNumber: 1,
      selectedTaskId: null,
      searchQuery: '',
      past: [],
      future: [],

      // ── Selectors ────────────────────────────────────────────────────────
      getTasksByQuadrant(q, showCompleted) {
        const { tasks } = get();
        return tasks
          .filter(
            (t) =>
              t.quadrant === q &&
              !t.archived &&
              (showCompleted || !t.completed),
          )
          .sort((a, b) => a.quadrantIndex - b.quadrantIndex);
      },

      getFilteredInboxTasks(showCompleted) {
        const { tasks, searchQuery } = get();
        const q = searchQuery.toLowerCase();
        return tasks
          .filter(
            (t) =>
              t.quadrant === 'inbox' &&
              !t.archived &&
              (showCompleted || !t.completed) &&
              (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
          )
          .sort((a, b) => a.quadrantIndex - b.quadrantIndex);
      },

      getSearchResults(showCompleted) {
        const { tasks, searchQuery } = get();
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return tasks
          .filter(
            (t) =>
              !t.archived &&
              (showCompleted || !t.completed) &&
              (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q))),
          )
          .sort((a, b) => a.sequentialNumber - b.sequentialNumber);
      },

      // ── Mutations ────────────────────────────────────────────────────────
      addTask(title) {
        const { tasks, nextSequentialNumber, past } = get();
        const newTask: Task = {
          id: uuidv4(),
          title: title.trim(),
          description: '',
          quadrant: 'inbox',
          sequentialNumber: nextSequentialNumber,
          quadrantIndex: getNextQuadrantIndex(tasks, 'inbox'),
          completed: false,
          archived: false,
          tags: [],
          createdAt: now(),
          updatedAt: now(),
        };
        set({
          tasks: [...tasks, newTask],
          nextSequentialNumber: nextSequentialNumber + 1,
          past: [...past.slice(-MAX_HISTORY + 1), snapshot(tasks)],
          future: [],
        });
      },

      updateTask(id, updates) {
        const { tasks, past } = get();
        set({
          tasks: tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: now() } : t,
          ),
          past: [...past.slice(-MAX_HISTORY + 1), snapshot(tasks)],
          future: [],
        });
      },

      deleteTask(id) {
        const { tasks, past, selectedTaskId } = get();
        set({
          tasks: tasks.filter((t) => t.id !== id),
          selectedTaskId: selectedTaskId === id ? null : selectedTaskId,
          past: [...past.slice(-MAX_HISTORY + 1), snapshot(tasks)],
          future: [],
        });
      },

      moveTask(id, toQuadrant) {
        const { tasks, past } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task || task.quadrant === toQuadrant) return;

        const newIndex = getNextQuadrantIndex(tasks, toQuadrant);
        set({
          tasks: tasks.map((t) =>
            t.id === id
              ? { ...t, quadrant: toQuadrant, quadrantIndex: newIndex, updatedAt: now() }
              : t,
          ),
          past: [...past.slice(-MAX_HISTORY + 1), snapshot(tasks)],
          future: [],
        });
      },

      reorderTasks(quadrant, activeId, overId) {
        const { tasks, past } = get();
        const quadrantTasks = tasks
          .filter((t) => t.quadrant === quadrant && !t.archived)
          .sort((a, b) => a.quadrantIndex - b.quadrantIndex);

        const activeIdx = quadrantTasks.findIndex((t) => t.id === activeId);
        const overIdx = quadrantTasks.findIndex((t) => t.id === overId);
        if (activeIdx === -1 || overIdx === -1 || activeIdx === overIdx) return;

        // Reorder the quadrant array
        const reordered = [...quadrantTasks];
        const [moved] = reordered.splice(activeIdx, 1);
        reordered.splice(overIdx, 0, moved);

        // Assign new indices
        const idToNewIndex = new Map(reordered.map((t, i) => [t.id, i]));

        set({
          tasks: tasks.map((t) =>
            idToNewIndex.has(t.id)
              ? { ...t, quadrantIndex: idToNewIndex.get(t.id)!, updatedAt: now() }
              : t,
          ),
          past: [...past.slice(-MAX_HISTORY + 1), snapshot(tasks)],
          future: [],
        });
      },

      completeTask(id) {
        const { tasks, past } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task) return;
        set({
          tasks: tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? now() : undefined,
                  updatedAt: now(),
                }
              : t,
          ),
          past: [...past.slice(-MAX_HISTORY + 1), snapshot(tasks)],
          future: [],
        });
      },

      archiveTask(id) {
        const { tasks, past, selectedTaskId } = get();
        set({
          tasks: tasks.map((t) =>
            t.id === id ? { ...t, archived: true, updatedAt: now() } : t,
          ),
          selectedTaskId: selectedTaskId === id ? null : selectedTaskId,
          past: [...past.slice(-MAX_HISTORY + 1), snapshot(tasks)],
          future: [],
        });
      },

      setSelectedTask(id) {
        set({ selectedTaskId: id });
      },

      setSearchQuery(q) {
        set({ searchQuery: q });
      },

      importTasks(tasks) {
        const { past, tasks: current } = get();
        const highestSeq = tasks.reduce((m, t) => Math.max(m, t.sequentialNumber ?? 0), 0);
        set({
          tasks,
          nextSequentialNumber: highestSeq + 1,
          past: [...past.slice(-MAX_HISTORY + 1), snapshot(current)],
          future: [],
        });
      },

      clearAll() {
        const { past, tasks } = get();
        set({
          tasks: [],
          nextSequentialNumber: 1,
          selectedTaskId: null,
          past: [...past.slice(-MAX_HISTORY + 1), snapshot(tasks)],
          future: [],
        });
      },

      undo() {
        const { past, tasks, future } = get();
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        set({
          tasks: previous,
          past: past.slice(0, -1),
          future: [snapshot(tasks), ...future.slice(0, MAX_HISTORY - 1)],
          selectedTaskId: null,
        });
      },

      redo() {
        const { past, tasks, future } = get();
        if (future.length === 0) return;
        const next = future[0];
        set({
          tasks: next,
          past: [...past.slice(-MAX_HISTORY + 1), snapshot(tasks)],
          future: future.slice(1),
          selectedTaskId: null,
        });
      },

      // ── Remote sync helpers ──────────────────────────────────────────────
      upsertRemoteTask(remoteTask) {
        const { tasks } = get();
        const local = tasks.find((t) => t.id === remoteTask.id);
        if (local && local.updatedAt >= remoteTask.updatedAt) return; // local is newer
        set({
          tasks: local
            ? tasks.map((t) => (t.id === remoteTask.id ? remoteTask : t))
            : [...tasks, remoteTask],
        });
      },

      removeRemoteTask(id) {
        const { tasks, selectedTaskId } = get();
        set({
          tasks: tasks.filter((t) => t.id !== id),
          selectedTaskId: selectedTaskId === id ? null : selectedTaskId,
        });
      },
    }),
    {
      name: 'eim-tasks',
      // Only persist data — not UI state or undo history
      partialize: (state) => ({
        tasks: state.tasks,
        nextSequentialNumber: state.nextSequentialNumber,
      }),
    },
  ),
);
