import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { Header } from '../../components/ui/Header';
import { BRUNO_IMAGES } from '../../constants/images';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';
import { api, ApiError } from '../../services/api';
import type {
  Exercise,
  SwapAlternativeExercise,
  WorkoutProgram,
  WorkoutRoutine,
  WorkoutSession,
  WorkoutSetLog,
} from '../../types/api';

export default function WorkoutScreen() {
  const router = useRouter();

  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [activeProgram, setActiveProgram] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set Entry Form Modal / Inline Inputs
  const [selectedExercise, setSelectedExercise] = useState<{
    id: string;
    routineExerciseId?: string;
    name: string;
  } | null>(null);
  const [inputWeight, setInputWeight] = useState('60');
  const [inputReps, setInputReps] = useState('10');
  const [inputRpe, setInputRpe] = useState('8');
  const [isWarmup, setIsWarmup] = useState(false);
  const [setModalVisible, setSetModalVisible] = useState(false);

  // Rest Timer State
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number>(0);
  const [isRestActive, setIsRestActive] = useState<boolean>(false);
  const [coachCue, setCoachCue] = useState<string>(
    'Keep elbows tucked at 45°. Slow 3-second eccentric descent on every single rep—pack that upper chest!'
  );

  // Rest Countdown Effect
  useEffect(() => {
    if (!isRestActive || restSecondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setRestSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsRestActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRestActive, restSecondsRemaining]);

  // 1-Tap Machine Swap Modal
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [swapAlternatives, setSwapAlternatives] = useState<SwapAlternativeExercise[]>([]);
  const [swappingExerciseId, setSwappingExerciseId] = useState<string | null>(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

  const fetchSession = async () => {
    try {
      setErrorMessage(null);
      const session = await api.sessions.getActive();
      setActiveSession(session);

      if (!session) {
        // Load active program to allow starting today's workout
        const progs = await api.programs.list(true);
        if (progs.length > 0) {
          const detail = await api.programs.getById(progs[0].id);
          setActiveProgram(detail);
        }
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load active session.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSession();
  };

  const handleStartSession = async (routineId?: string | null) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const session = await api.sessions.start(routineId);
      setActiveSession(session);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to start session.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openLogSetModal = (exerciseId: string, exerciseName: string, routineExerciseId?: string) => {
    setSelectedExercise({ id: exerciseId, name: exerciseName, routineExerciseId });
    setSetModalVisible(true);
  };

  const handleLogSet = async () => {
    if (!activeSession || !selectedExercise) return;

    const weight = parseFloat(inputWeight) || 0;
    const reps = parseInt(inputReps, 10) || 0;
    const rpe = parseFloat(inputRpe) || 8;

    if (reps <= 0) {
      setErrorMessage('Please enter at least 1 rep');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);

    const existingSets = activeSession.sets?.filter((s) => s.exerciseId === selectedExercise.id) || [];
    const nextSetNumber = existingSets.length + 1;

    try {
      await api.sessions.logSet(activeSession.id, {
        exerciseId: selectedExercise.id,
        routineExerciseId: selectedExercise.routineExerciseId,
        setNumber: nextSetNumber,
        actualWeightKg: weight,
        actualReps: reps,
        rpe,
        isWarmup,
      });

      setSetModalVisible(false);
      setRestSecondsRemaining(120);
      setIsRestActive(true);
      setCoachCue('Terrific tempo! Take your 2 minutes. Hydrate and get your mind ready for the next set.');
      await fetchSession();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to record set.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 1-Tap Hit Prescribed
  const handleHitPrescribed = async () => {
    if (!activeSession) return;

    Alert.alert(
      'Hit Prescribed Targets?',
      'Bruno will mark all scheduled sets as completed at your target weights & reps.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Finish',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.sessions.hitPrescribed(activeSession.id, {
                perceivedRpe: 8,
                jointSoreness: 0,
                notes: 'Completed all prescribed target sets cleanly.',
              });
              router.push({
                pathname: '/post-workout',
                params: { sessionId: activeSession.id },
              });
            } catch (err: unknown) {
              if (err instanceof ApiError) {
                setErrorMessage(err.message);
              }
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  // Open 1-Tap Machine Swap Modal
  const openSwapModal = async (routineExerciseId?: string) => {
    if (!routineExerciseId || !activeSession?.routineId) return;
    setSwappingExerciseId(routineExerciseId);
    setSwapModalVisible(true);
    setLoadingAlternatives(true);
    try {
      const alts = await api.programs.getAlternatives(
        activeSession.routineId,
        routineExerciseId,
      );
      setSwapAlternatives(alts);
    } catch {
      setSwapAlternatives([]);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const handlePerformSwap = async (replacementId: string) => {
    if (!swappingExerciseId || !activeSession?.routineId) return;
    setActionLoading(true);
    try {
      await api.programs.swapExercise(
        activeSession.routineId,
        swappingExerciseId,
        replacementId,
        'Machine unavailable in gym',
      );
      setSwapModalVisible(false);
      await fetchSession();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!activeSession) return;
    Alert.alert('Cancel Workout?', 'Any unsaved sets will be discarded.', [
      { text: 'Keep Lifting', style: 'cancel' },
      {
        text: 'Cancel Workout',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.sessions.cancel(activeSession.id, 'Session cancelled by lifter');
            setActiveSession(null);
            await fetchSession();
          } catch (err: unknown) {
            if (err instanceof ApiError) {
              setErrorMessage(err.message);
            }
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={activeSession ? 'Live Workout' : 'Start Workout'}
        subtitle="Telemetry & Set Tracker"
        rightAction={
          activeSession ? (
            <Badge label="IN PROGRESS" variant="orange" />
          ) : null
        }
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
            <Text style={styles.loaderText}>Syncing session telemetry...</Text>
          </View>
        ) : activeSession ? (
          <View style={styles.activeContainer}>
            {/* Top Session Status Card */}
            <Card style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View>
                  <Text style={styles.sessionTitle}>
                    {activeSession.routine?.name || 'Open Workout Session'}
                  </Text>
                  <Text style={styles.sessionTime}>
                    Started {new Date(activeSession.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Badge
                  label={`${activeSession.sets?.length || 0} Sets Logged`}
                  variant="green"
                />
              </View>

              {/* 1-Tap Hit Prescribed Quick Complete Action */}
              <View style={styles.quickActionRow}>
                <Button
                  title="⚡ 1-Tap Hit Prescribed"
                  onPress={handleHitPrescribed}
                  variant="orange"
                  size="sm"
                  style={styles.hitPrescribedBtn}
                />
                <Button
                  title="Finish & Calibrate"
                  onPress={() => router.push({
                    pathname: '/post-workout',
                    params: { sessionId: activeSession.id },
                  })}
                  variant="primary"
                  size="sm"
                />
              </View>
            </Card>

            {/* Live Rest Timer HUD (MockupFlow Screen 3) */}
            {isRestActive ? (
              <Card style={styles.restTimerCard}>
                <View style={styles.restTimerHeader}>
                  <View style={styles.restTimerTitleRow}>
                    <Text style={styles.restTimerEmoji}>⏱️</Text>
                    <Text style={styles.restTimerTitle}>Active Rest Period</Text>
                  </View>
                  <Text style={styles.restTimerDigits}>
                    {Math.floor(restSecondsRemaining / 60)}:{String(restSecondsRemaining % 60).padStart(2, '0')}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.restProgressBarTrack}>
                  <View
                    style={[
                      styles.restProgressBarFill,
                      { width: `${Math.min(100, Math.max(0, (restSecondsRemaining / 120) * 100))}%` },
                    ]}
                  />
                </View>

                <View style={styles.restActionsRow}>
                  <Pressable
                    onPress={() => setRestSecondsRemaining((prev) => prev + 30)}
                    style={styles.restActionBtn}>
                    <Text style={styles.restActionText}>+30s Rest</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setRestSecondsRemaining(0);
                      setIsRestActive(false);
                    }}
                    style={[styles.restActionBtn, styles.restSkipBtn]}>
                    <Text style={styles.restSkipText}>Skip Rest</Text>
                  </Pressable>
                </View>
              </Card>
            ) : null}

            {/* Coach Bruno Active Cue Banner */}
            <View style={styles.coachCueCard}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={BRUNO_IMAGES.ACTIVE_WORKOUT}
                  style={styles.avatar}
                  resizeMode="cover"
                />
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarBadgeIcon}>🎙️</Text>
                </View>
              </View>
              <View style={styles.speechCol}>
                <View style={styles.coachHeaderRow}>
                  <Text style={styles.coachName}>COACH BRUNO • LIVE CUE</Text>
                  <View style={styles.greenPulse} />
                </View>
                <Text style={styles.coachSpeech}>{coachCue}</Text>
              </View>
            </View>

            {/* Routine Exercises or Active Exercise Sets */}
            {activeSession.routine?.exercises && activeSession.routine.exercises.length > 0 ? (
              activeSession.routine.exercises.map((rx) => {
                const loggedSets = activeSession.sets?.filter((s) => s.exerciseId === rx.exerciseId) || [];
                const isComplete = loggedSets.length >= rx.targetSets;

                return (
                  <Card key={rx.id} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseTitleCol}>
                        <Text style={styles.exerciseName}>
                          {rx.exercise?.name || 'Exercise'}
                        </Text>
                        <Text style={styles.prescribedTarget}>
                          Target: {rx.targetSets} sets × {rx.targetRepsMin}-{rx.targetRepsMax} reps • RPE {rx.targetRpe}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => openSwapModal(rx.id)}
                        style={styles.swapBtn}>
                        <Text style={styles.swapBtnText}>🔄 Swap</Text>
                      </Pressable>
                    </View>

                    {/* Logged Sets Table */}
                    {loggedSets.length > 0 ? (
                      <View style={styles.setsTable}>
                        <View style={styles.tableHead}>
                          <Text style={[styles.th, { width: 32 }]}>SET</Text>
                          <Text style={[styles.th, { flex: 1 }]}>WEIGHT</Text>
                          <Text style={[styles.th, { flex: 1 }]}>REPS</Text>
                          <Text style={[styles.th, { flex: 1 }]}>RPE</Text>
                          <Text style={[styles.th, { width: 40 }]}>TYPE</Text>
                        </View>
                        {loggedSets.map((s) => (
                          <View key={s.id} style={styles.tableRow}>
                            <Text style={[styles.td, { width: 32, fontWeight: '700' }]}>{s.setNumber}</Text>
                            <Text style={[styles.td, { flex: 1 }]}>{s.actualWeightKg} kg</Text>
                            <Text style={[styles.td, { flex: 1 }]}>{s.actualReps}</Text>
                            <Text style={[styles.td, { flex: 1 }]}>{s.rpe ?? '-'}</Text>
                            <Text style={[styles.td, { width: 40, color: s.isWarmup ? Colors.coachOrange : Colors.primary }]}>
                              {s.isWarmup ? 'W' : 'WORK'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noSetsNotice}>No sets logged yet for this movement.</Text>
                    )}

                    {/* Add Set Button */}
                    <Button
                      title={`+ Log Set (${loggedSets.length + 1}/${rx.targetSets})`}
                      onPress={() => openLogSetModal(rx.exerciseId, rx.exercise?.name || 'Exercise', rx.id)}
                      variant={isComplete ? 'secondary' : 'primary'}
                      size="sm"
                      style={styles.addSetBtn}
                    />
                  </Card>
                );
              })
            ) : (
              <Card style={styles.emptyRoutineCard}>
                <Text style={styles.emptyNotice}>Open Free-form Workout Session</Text>
                <Button
                  title="+ Add Custom Exercise Set"
                  onPress={() => openLogSetModal('custom', 'Custom Movement')}
                  variant="primary"
                  size="md"
                />
              </Card>
            )}

            {/* Cancel Session Button */}
            <Button
              title="Cancel Workout"
              onPress={handleCancelSession}
              variant="danger"
              size="md"
              style={styles.cancelButton}
            />
          </View>
        ) : (
          /* Empty / Start Workout Screen */
          <View style={styles.noSessionBox}>
            <EmptyState
              title="No Active Session"
              description="Start today's scheduled lifting routine or begin an open workout session."
              showMascot
            />

            {activeProgram?.routines && activeProgram.routines.length > 0 ? (
              <View style={styles.routinesToStart}>
                <Text style={styles.routineSelectHeader}>Select a Routine to Begin:</Text>
                {activeProgram.routines.map((routine) => (
                  <Card key={routine.id} style={styles.startRoutineCard}>
                    <View style={styles.startRoutineInfo}>
                      <Badge label={`Day ${routine.dayNumber}`} variant="orange" />
                      <Text style={styles.startRoutineTitle}>{routine.name}</Text>
                      <Text style={styles.startRoutineDesc}>
                        {routine.exercises?.length || 0} exercises prescribed
                      </Text>
                    </View>
                    <Button
                      title="Start"
                      onPress={() => handleStartSession(routine.id)}
                      loading={actionLoading}
                      variant="primary"
                      size="sm"
                    />
                  </Card>
                ))}
              </View>
            ) : (
              <Button
                title="Start Open Workout Session"
                onPress={() => handleStartSession(null)}
                loading={actionLoading}
                variant="primary"
                size="lg"
                style={styles.startOpenBtn}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Log Set Modal */}
      <Modal
        visible={setModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSetModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.setModalCard}>
            <Text style={styles.setModalTitle}>Log Set • {selectedExercise?.name}</Text>

            <View style={styles.setInputRow}>
              <View style={styles.setInputCol}>
                <Text style={styles.setInputLabel}>Weight (kg)</Text>
                <TextInput
                  value={inputWeight}
                  onChangeText={setInputWeight}
                  keyboardType="numeric"
                  style={styles.numInput}
                />
              </View>

              <View style={styles.setInputCol}>
                <Text style={styles.setInputLabel}>Reps</Text>
                <TextInput
                  value={inputReps}
                  onChangeText={setInputReps}
                  keyboardType="number-pad"
                  style={styles.numInput}
                />
              </View>

              <View style={styles.setInputCol}>
                <Text style={styles.setInputLabel}>RPE (1-10)</Text>
                <TextInput
                  value={inputRpe}
                  onChangeText={setInputRpe}
                  keyboardType="numeric"
                  style={styles.numInput}
                />
              </View>
            </View>

            <View style={styles.warmupRow}>
              <Text style={styles.warmupLabel}>Mark as Warm-up Set</Text>
              <Switch
                value={isWarmup}
                onValueChange={setIsWarmup}
                trackColor={{ false: Colors.border, true: Colors.coachOrange }}
              />
            </View>

            <View style={styles.setModalActions}>
              <Button
                title="Cancel"
                onPress={() => setSetModalVisible(false)}
                variant="secondary"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Save Set"
                onPress={handleLogSet}
                loading={actionLoading}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* 1-Tap Machine Swap Modal */}
      <Modal
        visible={swapModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSwapModalVisible(false)}>
        <SafeAreaView style={styles.swapModalContainer}>
          <View style={styles.swapHeader}>
            <Text style={styles.swapTitle}>Crowded Gym? 1-Tap Swap</Text>
            <Pressable onPress={() => setSwapModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.swapSubtitle}>
            Bruno calculated replacement exercises matching the exact muscle recruitment curve with equipment currently free in your gym.
          </Text>

          {loadingAlternatives ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loaderText}>Searching biomechanical substitutes...</Text>
            </View>
          ) : swapAlternatives.length > 0 ? (
            <ScrollView contentContainerStyle={styles.swapList}>
              {swapAlternatives.map((alt) => (
                <Card key={alt.exercise.id} style={styles.altCard}>
                  <View style={styles.altTop}>
                    <View style={styles.altTitleCol}>
                      <Text style={styles.altName}>{alt.exercise.name}</Text>
                      <Text style={styles.altMuscle}>{alt.exercise.primaryMuscleGroup} • {alt.exercise.movementPattern}</Text>
                    </View>
                    <Badge
                      label={`${Math.round(alt.movementCompatibility * 100)}% Match`}
                      variant="green"
                    />
                  </View>
                  <Text style={styles.altRationale}>{alt.rationale}</Text>
                  <Button
                    title="Swap to This Exercise"
                    onPress={() => handlePerformSwap(alt.exercise.id)}
                    loading={actionLoading}
                    variant="orange"
                    size="sm"
                    style={{ marginTop: Spacing.sm }}
                  />
                </Card>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noAltsBox}>
              <Text style={styles.noAltsText}>No direct machine alternatives found for this profile.</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
  activeContainer: {
    gap: Spacing.md,
  },
  statusCard: {
    padding: Spacing.base,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  sessionTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  hitPrescribedBtn: {
    flex: 1,
  },
  exerciseCard: {
    padding: Spacing.base,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  exerciseTitleCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  prescribedTarget: {
    fontSize: 12,
    color: Colors.slateBody,
    marginTop: 2,
  },
  swapBtn: {
    backgroundColor: Colors.technicalBlueSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  swapBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.technicalBlue,
  },
  setsTable: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 4,
    marginBottom: 4,
  },
  th: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  td: {
    fontSize: 13,
    color: Colors.charcoalDark,
    textAlign: 'center',
  },
  noSetsNotice: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginVertical: Spacing.sm,
  },
  addSetBtn: {
    width: '100%',
    marginTop: Spacing.xs,
  },
  emptyRoutineCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyNotice: {
    fontSize: 14,
    color: Colors.slateBody,
    marginBottom: Spacing.md,
  },
  cancelButton: {
    width: '100%',
    marginTop: Spacing.md,
  },
  noSessionBox: {
    gap: Spacing.base,
  },
  routinesToStart: {
    gap: Spacing.sm,
  },
  routineSelectHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 4,
  },
  startRoutineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
  },
  startRoutineInfo: {
    flex: 1,
    gap: 4,
  },
  startRoutineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  startRoutineDesc: {
    fontSize: 12,
    color: Colors.slateBody,
  },
  startOpenBtn: {
    width: '100%',
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  setModalCard: {
    width: '100%',
    padding: Spacing.xl,
  },
  setModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: Spacing.base,
  },
  setInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  setInputCol: {
    flex: 1,
  },
  setInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slateBody,
    marginBottom: 4,
  },
  numInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoalDark,
    textAlign: 'center',
  },
  warmupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.base,
  },
  warmupLabel: {
    fontSize: 14,
    color: Colors.slateBody,
    fontWeight: '600',
  },
  setModalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  swapModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  swapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  swapTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeBtnText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  swapSubtitle: {
    fontSize: 13,
    color: Colors.slateBody,
    lineHeight: 18,
    marginBottom: Spacing.base,
  },
  swapList: {
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  altCard: {
    padding: Spacing.base,
  },
  altTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  altTitleCol: {
    flex: 1,
  },
  altName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  altMuscle: {
    fontSize: 12,
    color: Colors.slateBody,
  },
  altRationale: {
    fontSize: 12,
    color: Colors.technicalBlue,
    lineHeight: 16,
    fontWeight: '500',
  },
  noAltsBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noAltsText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  restTimerCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  restTimerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  restTimerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restTimerEmoji: {
    fontSize: 16,
  },
  restTimerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.technicalBlue,
  },
  restTimerDigits: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.charcoalDark,
  },
  restProgressBarTrack: {
    height: 6,
    backgroundColor: '#DBEAFE',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  restProgressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  restActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  restActionBtn: {
    flex: 1,
    backgroundColor: Colors.canvasBase,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.technicalBlue,
  },
  restSkipBtn: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },
  restSkipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slateBody,
  },
  coachCueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.canvasBase,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    padding: 3,
    backgroundColor: Colors.coachOrange,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.coachOrangeSubtle,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.canvasBase,
  },
  avatarBadgeIcon: {
    fontSize: 10,
  },
  speechCol: {
    flex: 1,
    gap: 2,
  },
  coachHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coachName: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.coachOrange,
    letterSpacing: 0.8,
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  coachSpeech: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.charcoalDark,
    lineHeight: 18,
  },
});
