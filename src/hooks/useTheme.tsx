import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { loadSettings, saveSettings } from '../utils/cookieSettings';
import { THEME_META_COLORS, type Theme, type ResolvedTheme } from '../utils/themeConstants';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const applyTheme = (resolved: ResolvedTheme) => {
  document.documentElement.setAttribute('data-theme', resolved);
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', THEME_META_COLORS[resolved]);
  }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const settings = loadSettings();
    return settings.theme || 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const settings = loadSettings();
    const savedTheme = settings.theme || 'dark';
    return savedTheme === 'system' ? getSystemTheme() : savedTheme;
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Save to settings
    const settings = loadSettings();
    const newSettings = { ...settings, theme: newTheme };
    saveSettings(newSettings);
    
    // Also save to localStorage for fast access by inline script
    localStorage.setItem('fire-theme-preference', newTheme);
    
    // Resolve and apply
    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Apply theme on mount and sync localStorage
  useEffect(() => {
    // Disable transitions temporarily on mount
    document.documentElement.classList.add('no-transitions');
    
    applyTheme(resolvedTheme);
    // Sync theme to localStorage on mount
    localStorage.setItem('fire-theme-preference', theme);
    
    // Re-enable transitions after a brief delay
    setTimeout(() => {
      document.documentElement.classList.remove('no-transitions');
    }, 100);
  }, []);

  // Watch system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        applyTheme(newResolved);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
