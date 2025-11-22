import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  actualTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'appTheme';
const THEME_MODE_STORAGE_KEY = 'appThemeMode'; // Stores preference: 'light', 'dark', or 'system'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Load theme from storage on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Update actual theme when system color scheme changes (only if in system mode)
  useEffect(() => {
    if (themeMode === 'system') {
      const systemTheme = systemColorScheme ?? 'light';
      setActualTheme(systemTheme);
      // Save the resolved theme to storage
      AsyncStorage.setItem(THEME_STORAGE_KEY, systemTheme).catch(console.error);
    }
  }, [themeMode, systemColorScheme]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (themeMode === 'system') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        const systemTheme = colorScheme ?? 'light';
        setActualTheme(systemTheme);
        // Save the updated resolved theme to storage
        AsyncStorage.setItem(THEME_STORAGE_KEY, systemTheme).catch(console.error);
      });

      return () => subscription.remove();
    }
  }, [themeMode]);

  const loadTheme = async () => {
    try {
      // Load the resolved theme (light/dark only) - this is what we actually use
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      // Load the preference mode (light/dark/system) - for UI display
      const storedMode = await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY);
      
      if (storedTheme === 'light' || storedTheme === 'dark') {
        // We have a stored theme, use it
        setActualTheme(storedTheme);
        
        // Check the mode preference
        if (storedMode === 'system') {
          // User prefers system, but we have a stored theme
          // Check if system theme matches stored theme
          const systemTheme = systemColorScheme ?? 'light';
          if (systemTheme !== storedTheme) {
            // System theme changed, update to system theme
            setActualTheme(systemTheme);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, systemTheme);
          }
          setThemeModeState('system');
        } else if (storedMode === 'light' || storedMode === 'dark') {
          // Direct preference matches stored theme
          setThemeModeState(storedMode);
        } else {
          // Legacy: has stored theme but no mode preference
          // Treat stored theme as direct preference
          setThemeModeState(storedTheme);
          await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, storedTheme);
        }
      } else {
        // No stored theme, detect system preference and save it
        const systemTheme = systemColorScheme ?? 'light';
        setActualTheme(systemTheme);
        setThemeModeState('system');
        // Save the detected system theme (always "light" or "dark")
        await AsyncStorage.setItem(THEME_STORAGE_KEY, systemTheme);
        if (!storedMode) {
          await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, 'system');
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      // Fallback to system theme
      const systemTheme = systemColorScheme ?? 'light';
      setActualTheme(systemTheme);
      setThemeModeState('system');
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      let themeToSave: 'light' | 'dark';
      
      if (mode === 'system') {
        // When system is selected, detect and save the actual system theme immediately
        const systemTheme = systemColorScheme ?? 'light';
        themeToSave = systemTheme;
        setActualTheme(systemTheme);
        setThemeModeState('system');
        // Save both: preference mode and resolved theme
        await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, 'system');
        await AsyncStorage.setItem(THEME_STORAGE_KEY, themeToSave);
      } else {
        // Direct light/dark selection
        themeToSave = mode;
        setActualTheme(mode);
        setThemeModeState(mode);
        // Save both: preference mode and resolved theme
        await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, themeToSave);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const value: ThemeContextType = {
    themeMode,
    actualTheme,
    setThemeMode,
    isDark: actualTheme === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
