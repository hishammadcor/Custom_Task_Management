import type { Task } from '../types';

interface ExportData {
  version: number;
  exportedAt: string;
  tasks: Task[];
}

export function exportToJSON(tasks: Task[]): void {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
  };
  const json = JSON.stringify(data, null, 2);
  triggerDownload(json, `eisenhower-tasks-${formatDateForFilename()}.json`, 'application/json');
}

export function exportToCSV(tasks: Task[]): void {
  const headers = [
    'ID', 'Title', 'Description', 'Quadrant', 'Sequential #',
    'Completed', 'Tags', 'Due Date', 'Time Estimate (min)', 'Time Spent (min)', 'Created At',
  ];

  const escape = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`;

  const rows = tasks.map((t) => [
    escape(t.id),
    escape(t.title),
    escape(t.description),
    escape(t.quadrant),
    t.sequentialNumber,
    t.completed,
    escape(t.tags.join(';')),
    escape(t.dueDate ?? ''),
    t.timeEstimate ?? '',
    t.timeSpent ?? '',
    escape(t.createdAt),
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  triggerDownload(csv, `eisenhower-tasks-${formatDateForFilename()}.csv`, 'text/csv;charset=utf-8;');
}

export function importFromJSON(file: File): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target!.result as string);
        // Accept either { tasks: [...] } or bare array
        const tasks: Task[] = Array.isArray(raw) ? raw : raw.tasks;
        if (!Array.isArray(tasks)) {
          reject(new Error('No tasks array found in file'));
          return;
        }
        // Basic shape validation
        const valid = tasks.every(
          (t) => typeof t.id === 'string' && typeof t.title === 'string',
        );
        if (!valid) {
          reject(new Error('Tasks file contains invalid task objects'));
          return;
        }
        resolve(tasks);
      } catch {
        reject(new Error('Could not parse JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Small delay before revoking so the browser can start the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDateForFilename(): string {
  return new Date().toISOString().slice(0, 10);
}
