export type QuadrantId = 'inbox' | 'q1' | 'q2' | 'q3' | 'q4';

export interface Task {
  id: string;
  title: string;
  description: string;
  quadrant: QuadrantId;
  /** Globally unique sequential number assigned at creation. Never changes. */
  sequentialNumber: number;
  /** Sort order within the quadrant (0-based). Updates on reorder/move. */
  quadrantIndex: number;
  completed: boolean;
  completedAt?: string;
  /** Archived tasks are hidden by default but preserved in data. */
  archived: boolean;
  tags: string[];
  dueDate?: string;
  /** Estimated time in minutes. */
  timeEstimate?: number;
  /** Actual time spent in minutes. */
  timeSpent?: number;
  createdAt: string;
  /** ISO datetime used for last-write-wins conflict resolution during sync. */
  updatedAt: string;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  viewMode: 'compact' | 'comfortable' | 'spacious';
  taskNumbering: 'sequential' | 'by-quadrant';
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  showCompleted: boolean;
  quadrantColors: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
  };
  /** Whether cloud sync is enabled via Firebase Firestore. */
  syncEnabled: boolean;
  /** UUID used as the Firestore "room" key for cross-browser sync. */
  syncToken: string;
  /** Debounce interval in seconds for pushing local changes to Firestore. */
  syncInterval: 5 | 15 | 60 | 300;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline' | 'disabled';

export interface DragData {
  type: 'task';
  taskId: string;
  sourceQuadrant: QuadrantId;
}
