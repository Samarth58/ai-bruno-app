import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'flat' | 'subtle';
}

export function Card({ children, style, variant = 'elevated' }: CardProps) {
  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    variant === 'elevated' && styles.elevated,
    variant === 'flat' && styles.flat,
    variant === 'subtle' && styles.subtle,
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.canvasBase,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  elevated: {
    ...Shadows.card,
  },
  flat: {
    borderColor: Colors.border,
  },
  subtle: {
    backgroundColor: Colors.surfaceContainerLow,
    borderColor: Colors.surfaceContainer,
  },
});
