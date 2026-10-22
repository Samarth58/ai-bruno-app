import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../../constants/theme';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  showMascot?: boolean;
}

export function EmptyState({
  title,
  description,
  actionTitle,
  onAction,
  showMascot = true,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {showMascot ? (
        <View style={styles.imageWrapper}>
          <Image
            source={require('@/assets/images/bruno-mascot.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      ) : null}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.canvasBase,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.md,
  },
  imageWrapper: {
    width: 140,
    height: 180,
    marginBottom: Spacing.base,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.charcoalDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: Colors.slateBody,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: Spacing.base,
  },
  button: {
    marginTop: Spacing.xs,
  },
});
