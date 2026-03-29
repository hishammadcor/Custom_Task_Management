import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { Task } from '../types';

function tasksCollection(syncToken: string) {
  return collection(getFirebaseDb(), 'rooms', syncToken, 'tasks');
}

function taskDoc(syncToken: string, taskId: string) {
  return doc(getFirebaseDb(), 'rooms', syncToken, 'tasks', taskId);
}

export interface SyncCallbacks {
  onAdded: (task: Task) => void;
  onModified: (task: Task) => void;
  onRemoved: (taskId: string) => void;
  onError: (error: Error) => void;
}

/**
 * Subscribes to real-time task changes for a sync token room.
 * Returns an unsubscribe function.
 */
export function subscribeToTasks(syncToken: string, callbacks: SyncCallbacks): Unsubscribe {
  const col = tasksCollection(syncToken);
  return onSnapshot(
    col,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const task = change.doc.data() as Task;
        if (change.type === 'added') callbacks.onAdded(task);
        else if (change.type === 'modified') callbacks.onModified(task);
        else if (change.type === 'removed') callbacks.onRemoved(change.doc.id);
      });
    },
    (error) => callbacks.onError(error as Error),
  );
}

export async function pushTask(syncToken: string, task: Task): Promise<void> {
  await setDoc(taskDoc(syncToken, task.id), task);
}

export async function pushTaskBatch(syncToken: string, tasks: Task[]): Promise<void> {
  await Promise.all(tasks.map((t) => pushTask(syncToken, t)));
}

export async function removeTask(syncToken: string, taskId: string): Promise<void> {
  await deleteDoc(taskDoc(syncToken, taskId));
}
