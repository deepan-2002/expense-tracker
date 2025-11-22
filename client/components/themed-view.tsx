import { View, type ViewProps } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const theme = useAppTheme();
  
  // Use provided colors or default to theme background
  const backgroundColor = lightColor || darkColor
    ? (theme.isDark ? (darkColor || theme.colors.background) : (lightColor || theme.colors.background))
    : theme.colors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
