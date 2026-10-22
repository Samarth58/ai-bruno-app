import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { BrunoMascotCard } from '../../components/ui/BrunoMascotCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Header } from '../../components/ui/Header';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { CoachBriefing, WorkoutProgram } from '../../types/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [briefing, setBriefing] = useState<CoachBriefing | null>(null);
  const [activeProgram, setActiveProgram] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [briefingData, programsData] = await Promise.allSettled([
        api.coach.getBriefing(),
        api.programs.list(true),
      ]);

      if (briefingData.status === 'fulfilled') {
        setBriefing(briefingData.value);
      }
      if (programsData.status === 'fulfilled' && programsData.value.length > 0) {
        setActiveProgram(programsData.value[0]);
      } else {
        setActiveProgram(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Lifter';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={`Hey, ${displayName}!`}
        subtitle="Bruno AI Gym Buddy"
        streakDays={briefing?.activeStreakWeeks ? briefing.activeStreakWeeks : 1}
        rightAction={
          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.profileButton}>
            <Text style={styles.profileIcon}>⚙️</Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }>
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Syncing lifting telemetry with Bruno...</Text>
          </View>
        ) : (
          <>
            {/* 1. Bruno AI Coach Mascot Bento Card */}
            <BrunoMascotCard
              greeting={`Rise & Grind, ${displayName}!`}
              speechText={
                briefing?.coachingTip ||
                'Upper Body Hypertrophy locked in. I auto-calculated your target sets and micro-loads. Ready to dominate?'
              }
              cnsPercent={briefing?.cnsReadinessPercent ?? 95}
              subTip="Telemetry & equipment grounded • 1-Tap swaps ready"
            />

            {/* 2. Today's Workout Hero Card */}
            {activeProgram && briefing?.todayRoutine ? (
              <Card style={styles.heroCard}>
                <View style={styles.heroHeader}>
                  <Text style={styles.heroPretitle}>TODAY'S WORKOUT</Text>
                  <Badge
                    label={activeProgram.splitType.replace(/_/g, ' ')}
                    variant="blue"
                  />
                </View>

                <Text style={styles.heroTitle}>{briefing.todayRoutine.name}</Text>

                <View style={styles.heroMetaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>⏱️</Text>
                    <Text style={styles.metaText}>
                      {briefing.todayRoutine.targetDurationMinutes} Min
                    </Text>
                  </View>
                  <Text style={styles.metaDot}>•</Text>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>🏋️</Text>
                    <Text style={styles.metaText}>
                      {briefing.todayRoutine.exerciseCount} Exercises
                    </Text>
                  </View>
                  <Text style={styles.metaDot}>•</Text>
                  <Badge
                    label={`Target RPE ${briefing.todayRoutine.targetRpe}`}
                    variant="orange"
                  />
                </View>

                <Button
                  title={`START SCHEDULED LIFT (${briefing.todayRoutine.targetDurationMinutes} MIN)`}
                  onPress={() => router.push('/(tabs)/workout')}
                  variant="primary"
                  size="lg"
                  leftIcon={<Text style={styles.btnIcon}>▶</Text>}
                  style={styles.heroButton}
                />
              </Card>
            ) : activeProgram ? (
              <Card style={styles.heroCard}>
                <View style={styles.heroHeader}>
                  <Text style={styles.heroPretitle}>ACTIVE PROGRAM</Text>
                  <Badge label={activeProgram.splitType.replace(/_/g, ' ')} variant="green" />
                </View>
                <Text style={styles.heroTitle}>{activeProgram.name}</Text>
                <Text style={styles.heroSubtitle}>
                  Week {activeProgram.currentWeek} of {activeProgram.durationWeeks} • {activeProgram.trainingDaysPerWeek} Days/Week
                </Text>
                <Button
                  title="Open Workout Session"
                  onPress={() => router.push('/(tabs)/workout')}
                  variant="primary"
                  size="lg"
                  style={styles.heroButton}
                />
              </Card>
            ) : (
              <EmptyState
                title="No Active Workout Program"
                description="Bruno has not generated your customized lifting cycle yet. Set up your gym gear and generate a plan in seconds!"
                actionTitle="Generate Workout Program"
                onAction={() => router.push('/(tabs)/programs')}
              />
            )}

            {/* 3. Weekly Cadence Micro-Calendar */}
            <Card style={styles.cadenceCard}>
              <View style={styles.cadenceHeader}>
                <Text style={styles.cadenceTitle}>WEEKLY CADENCE</Text>
                <Text style={styles.cadenceDone}>
                  {briefing?.completedSessionsThisWeek ?? 0} / {briefing?.targetSessionsThisWeek ?? 4} Sessions Done
                </Text>
              </View>

              <View style={styles.weekGrid}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                  const completedCount = briefing?.completedSessionsThisWeek ?? 0;
                  const isDone = idx < completedCount;
                  const isToday = idx === completedCount;

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.dayBox,
                        isDone && styles.dayBoxDone,
                        isToday && styles.dayBoxToday,
                      ]}>
                      <Text
                        style={[
                          styles.dayLetter,
                          isToday && styles.dayLetterToday,
                        ]}>
                        {day}
                      </Text>
                      <View
                        style={[
                          styles.dayIndicator,
                          isDone && styles.dayIndicatorDone,
                          isToday && styles.dayIndicatorToday,
                        ]}>
                        <Text style={styles.indicatorText}>
                          {isDone ? '✓' : isToday ? '🏋️' : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>

            {/* 4. Quick Action Bento Tiles */}
            <View style={styles.actionGrid}>
              <Pressable
                onPress={() => router.push('/(tabs)/programs')}
                style={styles.actionTile}>
                <View style={[styles.tileIconCircle, { backgroundColor: Colors.primarySubtle }]}>
                  <Text style={styles.tileEmoji}>📋</Text>
                </View>
                <Text style={styles.tileTitle}>Workout Plan</Text>
                <Text style={styles.tileSubtitle}>Routines & targets</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/gym-setup')}
                style={styles.actionTile}>
                <View style={[styles.tileIconCircle, { backgroundColor: Colors.technicalBlueSubtle }]}>
                  <Text style={styles.tileEmoji}>⚙️</Text>
                </View>
                <Text style={styles.tileTitle}>Gym Setup</Text>
                <Text style={styles.tileSubtitle}>Equipment profile</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/constraints')}
                style={styles.actionTile}>
                <View style={[styles.tileIconCircle, { backgroundColor: Colors.coachOrangeSubtle }]}>
                  <Text style={styles.tileEmoji}>🩹</Text>
                </View>
                <Text style={styles.tileTitle}>Injuries & Joints</Text>
                <Text style={styles.tileSubtitle}>Physical restrictions</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/exercises')}
                style={styles.actionTile}>
                <View style={[styles.tileIconCircle, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={styles.tileEmoji}>🔍</Text>
                </View>
                <Text style={styles.tileTitle}>Exercise Catalog</Text>
                <Text style={styles.tileSubtitle}>Browse & filters</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.canvasBase,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileIcon: {
    fontSize: 16,
  },
  loaderContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loaderText: {
    fontSize: 14,
    color: Colors.slateBody,
    fontWeight: '500',
  },
  heroCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  heroPretitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.slateBody,
    marginBottom: Spacing.md,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 13,
    color: Colors.slateBody,
    fontWeight: '600',
  },
  metaDot: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  btnIcon: {
    color: '#FFF',
    fontSize: 14,
    marginRight: 4,
  },
  heroButton: {
    width: '100%',
  },
  cadenceCard: {
    marginBottom: Spacing.md,
    padding: Spacing.base,
  },
  cadenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cadenceTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  cadenceDone: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLow,
    gap: 6,
  },
  dayBoxDone: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  dayBoxToday: {
    backgroundColor: Colors.coachOrangeSubtle,
  },
  dayLetter: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slateBody,
  },
  dayLetterToday: {
    color: Colors.coachOrange,
    fontWeight: '700',
  },
  dayIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIndicatorDone: {
    backgroundColor: Colors.primary,
  },
  dayIndicatorToday: {
    backgroundColor: Colors.coachOrange,
  },
  indicatorText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  actionTile: {
    width: '47.5%',
    backgroundColor: Colors.canvasBase,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  tileIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  tileEmoji: {
    fontSize: 20,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 2,
  },
  tileSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
