import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

type ThemeContextType = {
  colorScheme: 'light' | 'dark';
  theme: Record<keyof typeof Colors.light, string>;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
  theme: Colors.light,
  toggleTheme: () => {},
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useRNColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  
  // Hydrate on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (systemTheme === 'dark') setColorScheme('dark');
  }, [systemTheme]);

  const toggleTheme = () => {
    setColorScheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const theme = Colors[colorScheme];

  return (
    <ThemeContext.Provider value={{ colorScheme: mounted ? colorScheme : 'light', theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
