import { useState, useRef, useCallback } from 'react';
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  closestCorners,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  type UniqueIdentifier,
  type CollisionDetection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { useKeyboardShortcuts, SHORTCUT_DESCRIPTIONS } from '../../hooks/useKeyboard';
import { useSync } from '../../hooks/useSync';
import { AppDragOverlay } from '../dnd/DragOverlay';
import { InboxPanel } from '../inbox/InboxPanel';
import { MatrixBoard } from '../matrix/MatrixBoard';
import { SettingsPanel } from '../settings/SettingsPanel';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { SearchBar, type SearchBarHandle } from '../search/SearchBar';
import { TaskDetailPanel } from '../task/TaskDetailPanel';
import { SyncStatusBadge } from '../common/SyncStatus';
import type { AddTaskFormHandle } from '../inbox/AddTaskForm';
import type { QuadrantId } from '../../types';

const CONTAINER_IDS: QuadrantId[] = ['inbox', 'q1', 'q2', 'q3', 'q4'];

type ActivePanel = 'settings' | 'analytics' | 'shortcuts' | null;
type MobileTab = 'inbox' | 'matrix' | 'settings';

// Custom collision detection that prefers droppable containers
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    // Filter to only container droppable areas first
    const containerCollisions = pointerCollisions.filter((c) =>
      CONTAINER_IDS.includes(c.id as QuadrantId),
    );
    if (containerCollisions.length > 0) return containerCollisions;
    return pointerCollisions;
  }
  return rectIntersection(args);
};

export function AppLayout() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('inbox');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { moveTask, reorderTasks, tasks } = useTaskStore();
  const { settings } = useSettingsStore();
  const { syncStatus, forcSync } = useSync();
  const isDesktop = useIsDesktop();

  const addFormRef = useRef<AddTaskFormHandle>(null);
  const searchRef = useRef<SearchBarHandle>(null);

  // Track the original container during drag to detect cross-container moves
  const dragStartContainer = useRef<QuadrantId | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findContainer = useCallback(
    (id: UniqueIdentifier): QuadrantId | null => {
      if (CONTAINER_IDS.includes(id as QuadrantId)) return id as QuadrantId;
      const task = tasks.find((t) => t.id === id);
      return task?.quadrant ?? null;
    },
    [tasks],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      setActiveId(id);
      dragStartContainer.current = findContainer(id);
    },
    [findContainer],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(over.id);

      if (!activeContainer || !overContainer || activeContainer === overContainer) return;

      // Live preview: move to new container
      moveTask(active.id as string, overContainer);
    },
    [findContainer, moveTask],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      dragStartContainer.current = null;

      if (!over) return;

      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(over.id);

      if (!activeContainer || !overContainer) return;

      // Same container: reorder
      if (activeContainer === overContainer && active.id !== over.id) {
        reorderTasks(activeContainer, active.id as string, over.id as string);
      }
    },
    [findContainer, reorderTasks],
  );

  const handleOpenDetail = useCallback((id: string) => {
    setSelectedTaskId(id);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      description: 'Add new task',
      handler: () => {
        if (!isDesktop) setMobileTab('inbox');
        addFormRef.current?.focus();
      },
    },
    {
      key: 's',
      description: 'Focus search',
      handler: () => {
        searchRef.current?.focus();
      },
    },
    {
      key: '1',
      description: 'Jump to Q1',
      handler: () => {
        document.getElementById('quadrant-q1')?.scrollIntoView({ behavior: 'smooth' });
        if (!isDesktop) setMobileTab('matrix');
      },
    },
    {
      key: '2',
      description: 'Jump to Q2',
      handler: () => {
        document.getElementById('quadrant-q2')?.scrollIntoView({ behavior: 'smooth' });
        if (!isDesktop) setMobileTab('matrix');
      },
    },
    {
      key: '3',
      description: 'Jump to Q3',
      handler: () => {
        document.getElementById('quadrant-q3')?.scrollIntoView({ behavior: 'smooth' });
        if (!isDesktop) setMobileTab('matrix');
      },
    },
    {
      key: '4',
      description: 'Jump to Q4',
      handler: () => {
        document.getElementById('quadrant-q4')?.scrollIntoView({ behavior: 'smooth' });
        if (!isDesktop) setMobileTab('matrix');
      },
    },
    { key: '?', description: 'Show shortcuts', handler: () => setShowShortcuts((v) => !v) },
    {
      key: 'z',
      modifiers: { ctrl: true },
      description: 'Undo',
      handler: () => useTaskStore.getState().undo(),
    },
    {
      key: 'y',
      modifiers: { ctrl: true },
      description: 'Redo',
      handler: () => useTaskStore.getState().redo(),
    },
    {
      key: 'z',
      modifiers: { ctrl: true, shift: true },
      description: 'Redo',
      handler: () => useTaskStore.getState().redo(),
    },
  ]);

  const topBar = (
    <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3
                       bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700
                       shadow-sm z-10">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg grid grid-cols-2 grid-rows-2 gap-0.5 p-1.5 bg-slate-100 dark:bg-slate-800" aria-hidden="true">
          <div className="rounded-sm" style={{ backgroundColor: settings.quadrantColors.q1 }} />
          <div className="rounded-sm" style={{ backgroundColor: settings.quadrantColors.q2 }} />
          <div className="rounded-sm" style={{ backgroundColor: settings.quadrantColors.q3 }} />
          <div className="rounded-sm" style={{ backgroundColor: settings.quadrantColors.q4 }} />
        </div>
        <span className="font-bold text-slate-900 dark:text-slate-100 hidden sm:block text-sm">
          Eisenhower
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 min-w-0 max-w-sm">
        <SearchBar ref={searchRef} onOpenDetail={handleOpenDetail} />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <SyncStatusBadge status={syncStatus} onRetry={forcSync} />

        <button
          onClick={() => setActivePanel(activePanel === 'analytics' ? null : 'analytics')}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Analytics"
          title="Analytics"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 003 0v-13A1.5 1.5 0 0015.5 2zM9.5 6A1.5 1.5 0 008 7.5v9a1.5 1.5 0 003 0v-9A1.5 1.5 0 009.5 6zM3.5 10A1.5 1.5 0 002 11.5v5a1.5 1.5 0 003 0v-5A1.5 1.5 0 003.5 10z" />
          </svg>
        </button>

        <button
          onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Settings"
          title="Settings (or press ?)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </header>
  );

  const dndContextWrapper = (children: React.ReactNode) => (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children}
      <AppDragOverlay activeId={activeId} />
    </DndContext>
  );

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 overflow-hidden">
      {topBar}

      {/* Main content */}
      {isDesktop ? (
        // ── Desktop sidebar layout ──────────────────────────────────────
        <main className="flex-1 flex min-h-0 overflow-hidden">
          {dndContextWrapper(
            <>
              {/* Inbox sidebar */}
              <aside className="w-[30%] min-w-[240px] max-w-[360px] flex-shrink-0
                                border-r border-slate-200 dark:border-slate-800 overflow-hidden">
                <InboxPanel onOpenDetail={handleOpenDetail} addFormRef={addFormRef} />
              </aside>

              {/* Matrix */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <MatrixBoard onOpenDetail={handleOpenDetail} />
              </div>
            </>,
          )}
        </main>
      ) : (
        // ── Mobile tab layout ───────────────────────────────────────────
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {dndContextWrapper(
            <div className="flex-1 min-h-0 overflow-hidden">
              {mobileTab === 'inbox' && (
                <InboxPanel onOpenDetail={handleOpenDetail} addFormRef={addFormRef} />
              )}
              {mobileTab === 'matrix' && (
                <MatrixBoard onOpenDetail={handleOpenDetail} />
              )}
              {mobileTab === 'settings' && (
                <div className="h-full overflow-y-auto bg-white dark:bg-slate-900 p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Open settings via the ⚙️ button in the top bar.
                  </p>
                </div>
              )}
            </div>,
          )}

          {/* Bottom tab bar */}
          <nav className="flex-shrink-0 flex border-t border-slate-200 dark:border-slate-700
                          bg-white dark:bg-slate-900 safe-area-bottom"
               role="tablist" aria-label="Navigation">
            {([
              { id: 'inbox' as MobileTab, label: 'Inbox', icon: '📥' },
              { id: 'matrix' as MobileTab, label: 'Matrix', icon: '🎯' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={mobileTab === tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium
                  transition-colors
                  ${mobileTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <span className="text-xl" aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </main>
      )}

      {/* Overlays */}
      {selectedTaskId && (
        <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}
      {activePanel === 'settings' && (
        <SettingsPanel onClose={() => setActivePanel(null)} />
      )}
      {activePanel === 'analytics' && (
        <AnalyticsDashboard onClose={() => setActivePanel(null)} />
      )}

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
               onClick={() => setShowShortcuts(false)} />
          <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts"
               className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm
                            border border-slate-200 dark:border-slate-700 p-5 animate-scale-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                ⌨️ Keyboard Shortcuts
              </h2>
              <div className="space-y-2">
                {SHORTCUT_DESCRIPTIONS.map((s) => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{s.description}</span>
                    <kbd className="px-2 py-0.5 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800
                                   text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowShortcuts(false)}
                      className="mt-4 w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-800
                                 text-slate-700 dark:text-slate-300 text-sm font-medium
                                 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
