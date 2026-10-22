import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../../constants/theme';
import { Badge } from './Badge';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  streakDays?: number;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function Header({
  title,
  subtitle = 'Bruno AI Coach',
  streakDays,
  showBack = false,
  onBack,
  rightAction,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.mascotIconWrapper}>
            <Image
              source={require('@/assets/images/bruno-coach-avatar.png')}
              style={styles.mascotSmall}
            />
          </View>
        )}

        <View style={styles.titleColumn}>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {typeof streakDays === 'number' && streakDays > 0 ? (
          <Badge
            label={`${streakDays}d Streak`}
            variant="orange"
            icon={<Text style={styles.fireEmoji}>🔥</Text>}
          />
        ) : null}
        {rightAction}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  mascotIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    backgroundColor: Colors.coachOrangeSubtle,
    borderWidth: 1.5,
    borderColor: Colors.coachOrange,
  },
  mascotSmall: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.canvasBase,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  titleColumn: {
    flex: 1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.coachOrange,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fireEmoji: {
    fontSize: 12,
  },
});
