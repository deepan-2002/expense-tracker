import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}

export function Header({ title = 'Spendly', subtitle, showLogo = true }: HeaderProps) {
  const theme = useAppTheme();
  const dynamicStyles = getStyles(theme);

  return (
    <View style={dynamicStyles.header}>
      {showLogo && (
        <Text style={dynamicStyles.logo}>💰</Text>
      )}
      <View style={dynamicStyles.titleContainer}>
        <Text style={dynamicStyles.title}>{title}</Text>
        {subtitle && (
          <Text style={dynamicStyles.subtitle}>{subtitle}</Text>
        )}
      </View>
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 16,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logo: {
    fontSize: 28,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});

