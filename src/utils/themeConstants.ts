/**
 * Theme constants
 * Central location for theme-related configuration
 */

export const DEFAULT_THEME = 'dark' as const;

export const THEME_META_COLORS = {
  dark: '#0F0F0F',
  light: '#FFFFFF',
} as const;

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';
