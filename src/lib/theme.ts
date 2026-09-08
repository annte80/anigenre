import { useState, useEffect, useCallback } from 'react';

export type ThemeId = 'classic' | 'ocean' | 'crimson' | 'neon';

export interface ThemeDef {
  label: string;
  swatchClass: string;
  bgGradientClass: string;
  accentTextClass: string;
  hoverTextClass: string;
  softBgClass: string;
  iconBgClass: string;
  ringClass: string;
  borderClass: string;
  solidClass: string;
  solidTextClass: string;
  shadowClass: string;
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  classic: {
    label: 'Classic',
    swatchClass: 'bg-amber-400',
    bgGradientClass: 'bg-gradient-hero',
    accentTextClass: 'text-amber-400',
    hoverTextClass: 'hover:text-amber-400',
    softBgClass: 'bg-amber-500/10',
    iconBgClass: 'bg-amber-500/15',
    ringClass: 'focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
    borderClass: 'border-amber-500/40',
    solidClass: 'bg-amber-500 hover:bg-amber-400',
    solidTextClass: 'text-slate-950',
    shadowClass: 'shadow-amber-500/30',
  },
  ocean: {
    label: 'Ocean',
    swatchClass: 'bg-cyan-400',
    bgGradientClass: 'bg-gradient-hero-ocean',
    accentTextClass: 'text-cyan-400',
    hoverTextClass: 'hover:text-cyan-400',
    softBgClass: 'bg-cyan-500/10',
    iconBgClass: 'bg-cyan-500/15',
    ringClass: 'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20',
    borderClass: 'border-cyan-500/40',
    solidClass: 'bg-cyan-500 hover:bg-cyan-400',
    solidTextClass: 'text-slate-950',
    shadowClass: 'shadow-cyan-500/30',
  },
  crimson: {
    label: 'Crimson',
    swatchClass: 'bg-red-400',
    bgGradientClass: 'bg-gradient-hero-crimson',
    accentTextClass: 'text-red-400',
    hoverTextClass: 'hover:text-red-400',
    softBgClass: 'bg-red-500/10',
    iconBgClass: 'bg-red-500/15',
    ringClass: 'focus:border-red-500 focus:ring-2 focus:ring-red-500/20',
    borderClass: 'border-red-500/40',
    solidClass: 'bg-red-500 hover:bg-red-400',
    solidTextClass: 'text-white',
    shadowClass: 'shadow-red-500/30',
  },
  neon: {
    label: 'Neon',
    swatchClass: 'bg-fuchsia-400',
    bgGradientClass: 'bg-gradient-hero-neon',
    accentTextClass: 'text-fuchsia-400',
    hoverTextClass: 'hover:text-fuchsia-400',
    softBgClass: 'bg-fuchsia-500/10',
    iconBgClass: 'bg-fuchsia-500/15',
    ringClass: 'focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20',
    borderClass: 'border-fuchsia-500/40',
    solidClass: 'bg-fuchsia-500 hover:bg-fuchsia-400',
    solidTextClass: 'text-white',
    shadowClass: 'shadow-fuchsia-500/30',
  },
};

export const THEME_STORAGE_KEY = 'anivara_theme';
const THEME_EVENT = 'anivara-theme-change';

function readStoredTheme(): ThemeId {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved && saved in THEMES) {
    return saved as ThemeId;
  }
  return 'classic';
}

export function useTheme() {
  const [themeId, setThemeIdState] = useState<ThemeId>(readStoredTheme);

  useEffect(() => {
    const handleChange = () => {
      setThemeIdState(readStoredTheme());
    };

    window.addEventListener(THEME_EVENT, handleChange);
    window.addEventListener('storage', handleChange);

    return () => {
      window.removeEventListener(THEME_EVENT, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    localStorage.setItem(THEME_STORAGE_KEY, id);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return { themeId, setThemeId, theme: THEMES[themeId] };
}
