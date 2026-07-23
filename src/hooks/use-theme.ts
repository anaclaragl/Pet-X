import { useAppTheme } from './ThemeContext';

export function useTheme() {
  const { theme } = useAppTheme();
  return theme;
}
