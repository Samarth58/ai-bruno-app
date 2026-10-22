import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { Header } from '../../components/ui/Header';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';
import { api, ApiError } from '../../services/api';
import type { MobileProgress } from '../../types/api';

export default function ProgressScreen() {
  const [progress, setProgress] = useState<MobileProgress | null>(null);
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      setErrorMessage(null);
      const [progData, overData] = await Promise.allSettled([
        api.analytics.getProgress(),
        api.analytics.getOverview(),
      ]);

      if (progData.status === 'fulfilled') {
        setProgress(progData.value);
      }
      if (overData.status === 'fulfilled') {
        setOverview(overData.value);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load lifter telemetry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProgress();
  };

  const hasData = progress && (progress.totalCompletedSessions > 0 || progress.totalVolumeKg > 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Training Telemetry"
        subtitle="Progressive Overload"
        streakDays={progress?.streakWeeks ? progress.streakWeeks : 0}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }>
        {errorMessage ? (
          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        ) : null}

        {loading && !refreshing ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Aggregating volume & recovery telemetry...</Text>
          </View>
        ) : !hasData ? (
          <EmptyState
            title="No Training Telemetry Yet"
            description="Complete your first workout session with Bruno to begin tracking total tonnage, volume trends, and muscle recovery curves."
            showMascot
          />
        ) : (
          <>
            {/* Top Stat Highlights Bento */}
            <View style={styles.bentoRow}>
              <Card style={styles.bentoTile}>
                <Text style={styles.bentoLabel}>TOTAL SESSIONS</Text>
                <Text style={styles.bentoValue}>{progress.totalCompletedSessions}</Text>
                <Badge label="COMPLETED" variant="green" />
              </Card>

              <Card style={styles.bentoTile}>
                <Text style={styles.bentoLabel}>TOTAL TONNAGE</Text>
                <Text style={styles.bentoValue}>
                  {progress.totalVolumeKg >= 1000
                    ? `${(progress.totalVolumeKg / 1000).toFixed(1)}k`
                    : Math.round(progress.totalVolumeKg)} kg
                </Text>
                <Badge label="LIFTED" variant="blue" />
              </Card>
            </View>

            <View style={styles.bentoRow}>
              <Card style={styles.bentoTile}>
                <Text style={styles.bentoLabel}>THIS WEEK</Text>
                <Text style={styles.bentoValue}>{progress.currentWeekWorkoutCount} Lifts</Text>
                <Badge label={`${progress.streakWeeks}w Streak`} variant="orange" />
              </Card>

              <Card style={styles.bentoTile}>
                <Text style={styles.bentoLabel}>TOTAL REPS</Text>
                <Text style={styles.bentoValue}>{progress.totalReps}</Text>
                <Badge label="ACCUMULATED" variant="neutral" />
              </Card>
            </View>

            {/* CNS Readiness Card */}
            <Card style={styles.cnsCard}>
              <View style={styles.cnsHeader}>
                <View>
                  <Text style={styles.cnsTitle}>Systemic Recovery Score</Text>
                  <Text style={styles.cnsSubtitle}>Calculated from post-workout RPE & soreness</Text>
                </View>
                <Badge
                  label={`${progress.cnsReadinessPercent}% READY`}
                  variant={progress.cnsReadinessPercent >= 80 ? 'green' : 'orange'}
                />
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, Math.max(0, progress.cnsReadinessPercent))}%`,
                      backgroundColor:
                        progress.cnsReadinessPercent >= 80
                          ? Colors.primary
                          : Colors.coachOrange,
                    },
                  ]}
                />
              </View>
            </Card>

            {/* Muscle Volume Distribution */}
            <Card style={styles.muscleCard}>
              <Text style={styles.sectionTitle}>Volume by Muscle Group</Text>
              <Text style={styles.sectionSubtitle}>Real working set tonnage distribution</Text>

              {progress.muscleDistribution && progress.muscleDistribution.length > 0 ? (
                <View style={styles.muscleList}>
                  {progress.muscleDistribution.map((item, idx) => (
                    <View key={idx} style={styles.muscleRow}>
                      <View style={styles.muscleInfo}>
                        <Text style={styles.muscleName}>{item.muscleGroup}</Text>
                        <Text style={styles.muscleVolume}>{Math.round(item.volumeKg)} kg ({item.percentage}%)</Text>
                      </View>
                      <View style={styles.muscleBarTrack}>
                        <View
                          style={[
                            styles.muscleBarFill,
                            { width: `${Math.min(100, item.percentage)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyMuscleText}>No working set tonnage recorded for active cycle.</Text>
              )}
            </Card>

            {/* Active Cycle Information */}
            {progress.activeProgramName ? (
              <Card style={styles.programCard}>
                <Text style={styles.programLabel}>LINKED PROGRAM</Text>
                <Text style={styles.programName}>{progress.activeProgramName}</Text>
              </Card>
            ) : null}
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
  loaderBox: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loaderText: {
    fontSize: 14,
    color: Colors.slateBody,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  bentoTile: {
    flex: 1,
    padding: Spacing.base,
    gap: 4,
  },
  bentoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  bentoValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  cnsCard: {
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  cnsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cnsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  cnsSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.surfaceContainerLow,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  muscleCard: {
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.base,
  },
  muscleList: {
    gap: Spacing.md,
  },
  muscleRow: {
    gap: 4,
  },
  muscleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  muscleName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.charcoalDark,
  },
  muscleVolume: {
    fontSize: 12,
    color: Colors.slateBody,
    fontWeight: '500',
  },
  muscleBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceContainerLow,
    overflow: 'hidden',
  },
  muscleBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  emptyMuscleText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  programCard: {
    padding: Spacing.base,
    gap: 2,
  },
  programLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  programName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
});
