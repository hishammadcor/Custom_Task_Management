import { useEffect, useCallback } from 'react';

type ModifierKeys = {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
};

interface Shortcut {
  key: string;
  modifiers?: ModifierKeys;
  description: string;
  handler: () => void;
}

/**
 * Registers global keyboard shortcuts. Returns an unregister function.
 * Shortcuts are NOT triggered when focus is inside an input/textarea/select.
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const { key, modifiers = {}, handler } = shortcut;
        const ctrlMatch = modifiers.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = modifiers.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = modifiers.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          // Allow Ctrl shortcuts (undo/redo) even in inputs
          const isCtrlShortcut = modifiers.ctrl;
          if (isEditing && !isCtrlShortcut) continue;
          e.preventDefault();
          handler();
          return;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const SHORTCUT_DESCRIPTIONS: Array<{ key: string; description: string }> = [
  { key: 'N', description: 'Add new task' },
  { key: 'S', description: 'Focus search bar' },
  { key: '1', description: 'Jump to Q1 (Do First)' },
  { key: '2', description: 'Jump to Q2 (Schedule)' },
  { key: '3', description: 'Jump to Q3 (Delegate)' },
  { key: '4', description: 'Jump to Q4 (Eliminate)' },
  { key: 'Esc', description: 'Close panel / popover' },
  { key: 'Ctrl+Z', description: 'Undo last action' },
  { key: 'Ctrl+Y', description: 'Redo last action' },
  { key: '?', description: 'Show keyboard shortcuts' },
];
