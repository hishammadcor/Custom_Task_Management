import { useRef, useImperativeHandle, forwardRef } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { QUADRANT_CONFIG } from '../../utils/colors';
import type { QuadrantId } from '../../types';

export interface SearchBarHandle {
  focus(): void;
}

interface SearchBarProps {
  onOpenDetail: (id: string) => void;
}

export const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(
  ({ onOpenDetail }, ref) => {
    const searchQuery = useTaskStore((s) => s.searchQuery);
    const setSearchQuery = useTaskStore((s) => s.setSearchQuery);
    const getSearchResults = useTaskStore((s) => s.getSearchResults);
    const { settings } = useSettingsStore();
    const results = getSearchResults(settings.showCompleted);

    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus() {
        inputRef.current?.focus();
      },
    }));

    const quadrantLabel = (q: QuadrantId) =>
      q === 'inbox' ? 'Inbox' : QUADRANT_CONFIG[q as Exclude<QuadrantId, 'inbox'>].name;

    const quadrantColor = (q: QuadrantId) =>
      q === 'inbox' ? '#6B7280' : settings.quadrantColors[q as Exclude<QuadrantId, 'inbox'>];

    return (
      <div className="relative">
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800
                        rounded-xl border border-slate-200 dark:border-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
               className="w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden="true">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks…"
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 dark:text-slate-200
                       placeholder:text-slate-400 focus:outline-none"
            aria-label="Search tasks"
            aria-autocomplete="list"
            aria-controls={searchQuery ? 'search-results' : undefined}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>

        {/* Results dropdown */}
        {searchQuery && (
          <div
            id="search-results"
            role="listbox"
            aria-label="Search results"
            className="absolute top-full left-0 right-0 mt-1 z-30
                       bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                       rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto animate-slide-in-up"
          >
            {results.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No tasks found</p>
            ) : (
              results.map((task) => (
                <button
                  key={task.id}
                  role="option"
                  aria-selected="false"
                  onClick={() => {
                    onOpenDetail(task.id);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                             hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b
                             border-slate-100 dark:border-slate-800 last:border-none"
                >
                  <span
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: quadrantColor(task.quadrant) }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm text-slate-800 dark:text-slate-200 truncate ${task.completed ? 'line-through opacity-60' : ''}`}>
                      {task.title}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">
                    {quadrantLabel(task.quadrant)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  },
);

SearchBar.displayName = 'SearchBar';
