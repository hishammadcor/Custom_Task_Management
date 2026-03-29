import { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { usePrefersColorSchemeDark } from '../../hooks/useMediaQuery';

const FONT_SCALE: Record<string, number> = {
  small: 0.875,
  medium: 1,
  large: 1.125,
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettingsStore();
  const systemDark = usePrefersColorSchemeDark();

  // Apply dark/light class on <html>
  useEffect(() => {
    const isDark =
      settings.theme === 'dark' || (settings.theme === 'system' && systemDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, [settings.theme, systemDark]);

  // Apply CSS variables for quadrant colors
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-q1', settings.quadrantColors.q1);
    root.style.setProperty('--color-q2', settings.quadrantColors.q2);
    root.style.setProperty('--color-q3', settings.quadrantColors.q3);
    root.style.setProperty('--color-q4', settings.quadrantColors.q4);
  }, [settings.quadrantColors]);

  // Apply font scale
  useEffect(() => {
    const scale = FONT_SCALE[settings.fontSize] ?? 1;
    document.documentElement.style.setProperty('--font-scale', String(scale));
  }, [settings.fontSize]);

  // Apply high contrast
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
  }, [settings.highContrast]);

  return <>{children}</>;
}
