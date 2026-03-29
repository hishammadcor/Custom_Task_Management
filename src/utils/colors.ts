import type { QuadrantId } from '../types';

export interface QuadrantConfig {
  name: string;
  subtitle: string;
  defaultColor: string;
  bgLight: string;
  bgDark: string;
  pillTextLight: string;
  pillTextDark: string;
  borderLight: string;
  borderDark: string;
  headerBgLight: string;
  headerBgDark: string;
}

export const QUADRANT_CONFIG: Record<Exclude<QuadrantId, 'inbox'>, QuadrantConfig> = {
  q1: {
    name: 'Do First',
    subtitle: 'Urgent & Important',
    defaultColor: '#DC2626',
    bgLight: '#FFF5F5',
    bgDark: '#2d0f0f',
    pillTextLight: '#ffffff',
    pillTextDark: '#ffffff',
    borderLight: '#FCA5A5',
    borderDark: '#7f1d1d',
    headerBgLight: '#FEE2E2',
    headerBgDark: '#450a0a',
  },
  q2: {
    name: 'Schedule',
    subtitle: 'Not Urgent & Important',
    defaultColor: '#059669',
    bgLight: '#F0FDF4',
    bgDark: '#0d2d1f',
    pillTextLight: '#ffffff',
    pillTextDark: '#ffffff',
    borderLight: '#86EFAC',
    borderDark: '#14532d',
    headerBgLight: '#DCFCE7',
    headerBgDark: '#052e16',
  },
  q3: {
    name: 'Delegate',
    subtitle: 'Urgent & Not Important',
    defaultColor: '#D97706',
    bgLight: '#FFFBEB',
    bgDark: '#2d1f0d',
    pillTextLight: '#ffffff',
    pillTextDark: '#ffffff',
    borderLight: '#FCD34D',
    borderDark: '#78350f',
    headerBgLight: '#FEF3C7',
    headerBgDark: '#451a03',
  },
  q4: {
    name: 'Eliminate',
    subtitle: 'Not Urgent & Not Important',
    defaultColor: '#475569',
    bgLight: '#F8FAFC',
    bgDark: '#1a2332',
    pillTextLight: '#ffffff',
    pillTextDark: '#ffffff',
    borderLight: '#CBD5E1',
    borderDark: '#1e293b',
    headerBgLight: '#F1F5F9',
    headerBgDark: '#0f172a',
  },
};

export const DEFAULT_QUADRANT_COLORS = {
  q1: '#DC2626',
  q2: '#059669',
  q3: '#D97706',
  q4: '#475569',
};

/** Returns a CSS rgba string with the given hex color at the specified alpha. */
export function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
}

/** Determines if white or black text has better contrast on the given background color. */
export function getContrastColor(hexColor: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
  if (!result) return '#ffffff';
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  // Perceived luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
