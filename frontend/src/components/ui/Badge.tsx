import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../../constants/theme';

export interface BadgeProps {
  label: string;
  variant?: 'green' | 'orange' | 'blue' | 'neutral' | 'error';
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export function Badge({ label, variant = 'green', style, icon }: BadgeProps) {
  let bg: string = Colors.primarySubtle;
  let textColor: string = Colors.primary;

  if (variant === 'orange') {
    bg = Colors.coachOrangeSubtle;
    textColor = Colors.coachOrange;
  } else if (variant === 'blue') {
    bg = Colors.technicalBlueSubtle;
    textColor = Colors.technicalBlue;
  } else if (variant === 'neutral') {
    bg = Colors.canvasSecondary;
    textColor = Colors.slateBody;
  } else if (variant === 'error') {
    bg = Colors.errorSubtle;
    textColor = Colors.error;
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      {icon}
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
