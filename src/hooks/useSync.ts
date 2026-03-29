import { useEffect, useRef, useState, useCallback } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import { isFirebaseConfigured } from '../services/firebase';
import { subscribeToTasks, pushTaskBatch, removeTask } from '../services/syncService';
import { useIsOnline } from './useOffline';
import type { SyncStatus } from '../types';

export function useSync(): {
  syncStatus: SyncStatus;
  forcSync: () => void;
} {
  const { settings } = useSettingsStore();
  const { tasks, upsertRemoteTask, removeRemoteTask } = useTaskStore();
  const isOnline = useIsOnline();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disabled');

  /**
   * Timestamp of the last remote update we received.
   * Used to avoid re-pushing tasks that arrived from Firestore.
   */
  const lastRemoteUpdateAt = useRef<string | null>(null);
  const pendingSync = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ── Subscribe to remote changes ──────────────────────────────────────────
  useEffect(() => {
    if (!settings.syncEnabled || !isFirebaseConfigured()) {
      setSyncStatus('disabled');
      return;
    }
    if (!isOnline) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');

    const unsubscribe = subscribeToTasks(settings.syncToken, {
      onAdded: (task) => {
        lastRemoteUpdateAt.current = new Date().toISOString();
        upsertRemoteTask(task);
        if (isMounted.current) setSyncStatus('synced');
      },
      onModified: (task) => {
        lastRemoteUpdateAt.current = new Date().toISOString();
        upsertRemoteTask(task);
        if (isMounted.current) setSyncStatus('synced');
      },
      onRemoved: (id) => {
        lastRemoteUpdateAt.current = new Date().toISOString();
        removeRemoteTask(id);
        if (isMounted.current) setSyncStatus('synced');
      },
      onError: (error) => {
        console.error('[Sync] Firestore error:', error);
        if (isMounted.current) setSyncStatus('error');
      },
    });

    return unsubscribe;
  }, [settings.syncEnabled, settings.syncToken, isOnline, upsertRemoteTask, removeRemoteTask]);

  // ── Push local changes to Firestore (debounced) ──────────────────────────
  useEffect(() => {
    if (!settings.syncEnabled || !isFirebaseConfigured() || !isOnline) return;

    if (pendingSync.current) clearTimeout(pendingSync.current);

    pendingSync.current = setTimeout(async () => {
      if (!isMounted.current) return;

      // Only sync tasks that were updated after the last remote update
      const tasksToSync = lastRemoteUpdateAt.current
        ? tasks.filter((t) => t.updatedAt > lastRemoteUpdateAt.current!)
        : tasks;

      if (tasksToSync.length === 0) return;

      try {
        setSyncStatus('syncing');
        await pushTaskBatch(settings.syncToken, tasksToSync);
        if (isMounted.current) setSyncStatus('synced');
      } catch (err) {
        console.error('[Sync] Push error:', err);
        if (isMounted.current) setSyncStatus('error');
      }
    }, settings.syncInterval * 1000);

    return () => {
      if (pendingSync.current) clearTimeout(pendingSync.current);
    };
  }, [tasks, settings.syncEnabled, settings.syncToken, settings.syncInterval, isOnline]);

  // ── Offline state ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!settings.syncEnabled || !isFirebaseConfigured()) return;
    if (!isOnline) {
      setSyncStatus('offline');
    } else if (syncStatus === 'offline') {
      setSyncStatus('synced');
    }
  }, [isOnline, settings.syncEnabled]);

  const forcSync = useCallback(async () => {
    if (!settings.syncEnabled || !isFirebaseConfigured() || !isOnline) return;
    try {
      setSyncStatus('syncing');
      await pushTaskBatch(settings.syncToken, tasks);
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, [settings.syncEnabled, settings.syncToken, tasks, isOnline]);

  return { syncStatus, forcSync };
}

/**
 * Wraps deleteTask to also delete from Firestore when sync is enabled.
 */
export function useSyncedDeleteTask() {
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const { settings } = useSettingsStore();
  const isOnline = useIsOnline();

  return useCallback(
    async (id: string) => {
      deleteTask(id);
      if (settings.syncEnabled && isFirebaseConfigured() && isOnline) {
        try {
          await removeTask(settings.syncToken, id);
        } catch (err) {
          console.error('[Sync] Delete error:', err);
        }
      }
    },
    [deleteTask, settings.syncEnabled, settings.syncToken, isOnline],
  );
}
