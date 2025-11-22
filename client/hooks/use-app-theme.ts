import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export function useAppTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colors: {
      // Background colors
      background: isDark ? '#0a0a0a' : '#ffffff',
      cardBackground: isDark ? '#1a1a1a' : '#ffffff',
      secondaryBackground: isDark ? '#151515' : '#f5f5f5',
      
      // Text colors
      text: isDark ? '#ffffff' : '#1a1a1a',
      textSecondary: isDark ? '#a0a0a0' : '#666666',
      textTertiary: isDark ? '#707070' : '#999999',
      
      // Border colors
      border: isDark ? '#2a2a2a' : '#e0e0e0',
      borderLight: isDark ? '#1a1a1a' : '#f0f0f0',
      
      // Primary colors
      primary: '#6366f1',
      primaryDark: '#4f46e5',
      
      // Status colors
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      
      // Input colors
      inputBackground: isDark ? '#1a1a1a' : '#f9f9f9',
      inputBorder: isDark ? '#2a2a2a' : '#ddd',
      
      // Shadow (for dark mode, use subtle glow instead)
      shadowColor: isDark ? '#000000' : '#000000',
    },
    styles: {
      shadow: isDark
        ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }
        : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          },
    },
  };
}

