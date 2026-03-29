import { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useSyncedDeleteTask } from '../../hooks/useSync';
import { QUADRANT_CONFIG } from '../../utils/colors';
import type { Task, QuadrantId } from '../../types';

const QUADRANT_OPTIONS: Array<{ id: QuadrantId; label: string }> = [
  { id: 'inbox', label: '📥 Inbox' },
  { id: 'q1', label: '🔴 Do First' },
  { id: 'q2', label: '🟢 Schedule' },
  { id: 'q3', label: '🟡 Delegate' },
  { id: 'q4', label: '🔵 Eliminate' },
];

interface TaskDetailPanelProps {
  taskId: string;
  onClose: () => void;
}

export function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const { updateTask, completeTask, archiveTask, moveTask } = useTaskStore();
  const { settings } = useSettingsStore();
  const deleteTask = useSyncedDeleteTask();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editEstimate, setEditEstimate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDesc(task.description);
      setEditTags(task.tags.join(', '));
      setEditDue(task.dueDate ?? '');
      setEditEstimate(task.timeEstimate ? String(task.timeEstimate) : '');
    }
  }, [task]);

  // Focus trap + Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!task) return null;

  const quadrantConfig = task.quadrant !== 'inbox' ? QUADRANT_CONFIG[task.quadrant as Exclude<QuadrantId, 'inbox'>] : null;
  const quadrantColor = task.quadrant !== 'inbox' ? settings.quadrantColors[task.quadrant as Exclude<QuadrantId, 'inbox'>] : '#6B7280';

  const handleSave = () => {
    updateTask(task.id, {
      title: editTitle.trim() || task.title,
      description: editDesc.trim(),
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      dueDate: editDue || undefined,
      timeEstimate: editEstimate ? parseInt(editEstimate) : undefined,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Task details: ${task.title}`}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] flex flex-col
                   bg-white dark:bg-slate-900 shadow-2xl animate-slide-in-right
                   focus:outline-none overflow-hidden"
      >
        {/* Top color bar */}
        <div className="h-1.5 flex-shrink-0" style={{ backgroundColor: quadrantColor }} />

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3
                        border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            {quadrantConfig && (
              <span className="text-xs font-medium px-2 py-1 rounded-md text-white"
                    style={{ backgroundColor: quadrantColor }}>
                {quadrantConfig.name}
              </span>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              #{task.sequentialNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          {isEditing ? (
            <input
              ref={titleRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-lg font-semibold px-2 py-1 rounded border border-blue-400
                         bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
              maxLength={200}
              aria-label="Task title"
              autoFocus
            />
          ) : (
            <h2
              className={`text-lg font-semibold text-slate-900 dark:text-slate-100
                ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}
            >
              {task.title}
            </h2>
          )}

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => completeTask(task.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${task.completed
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              {task.completed ? 'Completed' : 'Mark done'}
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                         bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                         hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
              </svg>
              {isEditing ? 'Cancel edit' : 'Edit'}
            </button>
          </div>

          {/* Move to quadrant */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Move to
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUADRANT_OPTIONS.map((q) => (
                <button
                  key={q.id}
                  onClick={() => moveTask(task.id, q.id)}
                  disabled={task.quadrant === q.id}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors
                    ${task.quadrant === q.id
                      ? 'bg-blue-600 text-white font-medium cursor-default'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Notes
            </label>
            {isEditing ? (
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                placeholder="Add notes…"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                           bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200
                           placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Task notes"
              />
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap min-h-[2rem]">
                {task.description || <span className="text-slate-400 italic">No notes</span>}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Tags
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="work, health, finance…"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                           bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200
                           placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Tags (comma separated)"
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {task.tags.length > 0 ? task.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800
                                             text-slate-600 dark:text-slate-400">
                    {tag}
                  </span>
                )) : <span className="text-sm text-slate-400 italic">No tags</span>}
              </div>
            )}
          </div>

          {/* Due date + Time estimate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Due date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editDue}
                  onChange={(e) => setEditDue(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600
                             bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Due date"
                />
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })
                    : <span className="text-slate-400 italic">None</span>}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Estimate (min)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={editEstimate}
                  onChange={(e) => setEditEstimate(e.target.value)}
                  min="0"
                  max="9999"
                  placeholder="30"
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600
                             bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Time estimate in minutes"
                />
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {task.timeEstimate ? `${task.timeEstimate} min` : <span className="text-slate-400 italic">None</span>}
                </p>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-600 space-y-1">
            <p>Created {new Date(task.createdAt).toLocaleString()}</p>
            <p>Updated {new Date(task.updatedAt).toLocaleString()}</p>
            {task.completedAt && <p>Completed {new Date(task.completedAt).toLocaleString()}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between gap-2 px-4 py-3
                        border-t border-slate-200 dark:border-slate-700
                        bg-slate-50 dark:bg-slate-900">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400
                           hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white
                           hover:bg-blue-700 transition-colors"
              >
                Save changes
              </button>
            </>
          ) : (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Delete?</span>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                               text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                    Delete
                  </button>
                  <button
                    onClick={() => { archiveTask(task.id); onClose(); }}
                    className="px-3 py-2 rounded-lg text-sm font-medium
                               text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Archive
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
