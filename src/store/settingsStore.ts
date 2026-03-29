import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Settings } from '../types';
import { DEFAULT_QUADRANT_COLORS } from '../utils/colors';

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  viewMode: 'comfortable',
  taskNumbering: 'sequential',
  fontSize: 'medium',
  highContrast: false,
  showCompleted: false,
  quadrantColors: { ...DEFAULT_QUADRANT_COLORS },
  syncEnabled: false,
  syncToken: uuidv4(),
  syncInterval: 15,
};

interface SettingsState {
  settings: Settings;
  updateSettings(partial: Partial<Settings>): void;
  generateNewSyncToken(): void;
  resetColors(): void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updateSettings(partial) {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }));
      },

      generateNewSyncToken() {
        set((state) => ({
          settings: { ...state.settings, syncToken: uuidv4() },
        }));
      },

      resetColors() {
        set((state) => ({
          settings: {
            ...state.settings,
            quadrantColors: { ...DEFAULT_QUADRANT_COLORS },
          },
        }));
      },
    }),
    { name: 'eim-settings' },
  ),
);
