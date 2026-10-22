import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';
import { Badge } from './Badge';

export interface BrunoMascotCardProps {
  greeting?: string;
  speechText: string;
  cnsPercent?: number;
  subTip?: string;
}

export function BrunoMascotCard({
  greeting = 'Rise & Grind!',
  speechText,
  cnsPercent = 95,
  subTip = 'Micro-load auto-applied based on recovery',
}: BrunoMascotCardProps) {
  return (
    <View style={styles.container}>
      {/* Top Status Row */}
      <View style={styles.topRow}>
        <View>
          <View style={styles.statusRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.syncText}>COACH SYNC • LIVE</Text>
          </View>
          <Text style={styles.greetingText}>{greeting}</Text>
        </View>

        <Badge
          label={`CNS ${cnsPercent}%`}
          variant="green"
          style={styles.cnsBadge}
        />
      </View>

      {/* Mascot Visual + Speech Container */}
      <View style={styles.contentRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={require('@/assets/images/bruno-coach-avatar.png')}
            style={styles.avatarImage}
            resizeMode="cover"
          />
          <View style={styles.coachTag}>
            <Text style={styles.coachTagText}>COACH</Text>
          </View>
        </View>

        {/* Speech Bubble */}
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>
            {speechText}
          </Text>
          {subTip ? (
            <View style={styles.subTipContainer}>
              <Text style={styles.subTipText}>⚙️ {subTip}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.canvasBase,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.coachOrange,
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  cnsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  avatarWrapper: {
    width: 84,
    height: 94,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.coachOrangeSubtle,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  coachTag: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coachTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  speechBubble: {
    flex: 1,
    backgroundColor: Colors.canvasBase,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.card,
  },
  speechText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.charcoalDark,
    fontWeight: '500',
  },
  subTipContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  subTipText: {
    fontSize: 11,
    color: Colors.technicalBlue,
    fontWeight: '600',
  },
});
