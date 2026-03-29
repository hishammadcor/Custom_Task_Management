import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { useTaskStore } from '../../store/taskStore';

export interface AddTaskFormHandle {
  focus(): void;
}

export const AddTaskForm = forwardRef<AddTaskFormHandle>((_, ref) => {
  const [value, setValue] = useState('');
  const addTask = useTaskStore((s) => s.addTask);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current?.focus();
    },
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    addTask(trimmed);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 p-3 border-b border-slate-200 dark:border-slate-700"
      aria-label="Add new task"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add task to Inbox…"
        maxLength={200}
        className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600
                   bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
                   placeholder:text-slate-400 dark:placeholder:text-slate-500
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="New task title"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium
                   bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                   text-white disabled:opacity-40 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   transition-colors"
        aria-label="Add task"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
      </button>
    </form>
  );
});

AddTaskForm.displayName = 'AddTaskForm';
