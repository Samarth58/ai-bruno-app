import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { Header } from '../../components/ui/Header';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';
import { api, ApiError } from '../../services/api';
import type { GenerateProgramInput, WorkoutProgram, WorkoutRoutine } from '../../types/api';

export default function ProgramsScreen() {
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Program Generator Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [splitType, setSplitType] = useState<'upper_lower' | 'push_pull_legs' | 'full_body'>('upper_lower');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [goal, setGoal] = useState<'hypertrophy' | 'strength' | 'endurance'>('hypertrophy');

  const fetchPrograms = async () => {
    try {
      setErrorMessage(null);
      const list = await api.programs.list();
      setPrograms(list);
      if (list.length > 0) {
        // Fetch full details of the active or first program
        const active = list.find((p) => p.isActive) || list[0];
        try {
          const detail = await api.programs.getById(active.id);
          setSelectedProgram(detail);
        } catch {
          setSelectedProgram(active);
        }
      } else {
        setSelectedProgram(null);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load workout programs.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrograms();
  };

  const handleSelectProgram = async (p: WorkoutProgram) => {
    setLoading(true);
    try {
      const detail = await api.programs.getById(p.id);
      setSelectedProgram(detail);
    } catch {
      setSelectedProgram(p);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateProgram = async (id: string) => {
    try {
      await api.programs.activate(id);
      await fetchPrograms();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      }
    }
  };

  const handleGenerateProgram = async () => {
    setGenerating(true);
    setErrorMessage(null);
    try {
      const input: GenerateProgramInput = {
        name: `${goal === 'hypertrophy' ? 'Hypertrophy' : 'Strength'} ${splitType.replace(/_/g, ' ')}`,
        splitType,
        trainingDaysPerWeek: daysPerWeek,
        durationWeeks,
        targetSessionDurationMinutes: durationMinutes,
        goal,
      };

      const newProg = await api.programs.generate(input);
      setModalVisible(false);
      await fetchPrograms();
      setSelectedProgram(newProg);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to generate program. Check gym hardware profile.');
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Workout Programs"
        subtitle="Periodized Training"
        rightAction={
          <Button
            title="+ New"
            onPress={() => setModalVisible(true)}
            size="sm"
            variant="primary"
          />
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
            <Text style={styles.loaderText}>Loading workout programs...</Text>
          </View>
        ) : programs.length === 0 ? (
          <EmptyState
            title="No Programs Found"
            description="Generate a tailored workout program with Bruno matching your gym equipment and joint restrictions."
            actionTitle="Generate First Program"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          <>
            {/* Program Selector Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectorRow}>
              {programs.map((p) => {
                const isSelected = selectedProgram?.id === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => handleSelectProgram(p)}
                    style={[
                      styles.selectorPill,
                      isSelected && styles.selectorPillActive,
                    ]}>
                    <Text
                      style={[
                        styles.selectorText,
                        isSelected && styles.selectorTextActive,
                      ]}>
                      {p.name}
                    </Text>
                    {p.isActive ? (
                      <View style={styles.activeDot} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Selected Program Details */}
            {selectedProgram ? (
              <View style={styles.programDetails}>
                <Card style={styles.summaryCard}>
                  <View style={styles.summaryTop}>
                    <View>
                      <Text style={styles.summaryTitle}>{selectedProgram.name}</Text>
                      <Text style={styles.summarySplit}>
                        {selectedProgram.splitType.replace(/_/g, ' ').toUpperCase()} • {selectedProgram.trainingDaysPerWeek} DAYS/WK
                      </Text>
                    </View>
                    {selectedProgram.isActive ? (
                      <Badge label="ACTIVE" variant="green" />
                    ) : (
                      <Button
                        title="Set Active"
                        onPress={() => handleActivateProgram(selectedProgram.id)}
                        size="sm"
                        variant="secondary"
                      />
                    )}
                  </View>

                  <View style={styles.metricRow}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{selectedProgram.durationWeeks} Wks</Text>
                      <Text style={styles.metricLabel}>Duration</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>Wk {selectedProgram.currentWeek}</Text>
                      <Text style={styles.metricLabel}>Current</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{selectedProgram.targetSessionDurationMinutes}m</Text>
                      <Text style={styles.metricLabel}>Target Time</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{selectedProgram.routines?.length || 0}</Text>
                      <Text style={styles.metricLabel}>Routines</Text>
                    </View>
                  </View>
                </Card>

                {/* Routines List */}
                <Text style={styles.sectionHeader}>Routines & Exercises</Text>
                {selectedProgram.routines && selectedProgram.routines.length > 0 ? (
                  selectedProgram.routines.map((routine: WorkoutRoutine) => (
                    <Card key={routine.id} style={styles.routineCard}>
                      <View style={styles.routineHeader}>
                        <View style={styles.dayBadge}>
                          <Text style={styles.dayBadgeText}>DAY {routine.dayNumber}</Text>
                        </View>
                        <Text style={styles.routineName}>{routine.name}</Text>
                      </View>

                      {routine.exercises && routine.exercises.length > 0 ? (
                        <View style={styles.exerciseList}>
                          {routine.exercises.map((rx, idx) => (
                            <View key={rx.id || idx} style={styles.exerciseItem}>
                              <View style={styles.exerciseNumber}>
                                <Text style={styles.numberText}>{idx + 1}</Text>
                              </View>
                              <View style={styles.exerciseInfo}>
                                <Text style={styles.exerciseName}>
                                  {rx.exercise?.name || 'Target Exercise'}
                                </Text>
                                <Text style={styles.exerciseTarget}>
                                  {rx.targetSets} sets × {rx.targetRepsMin}-{rx.targetRepsMax} reps • RPE {rx.targetRpe}
                                </Text>
                              </View>
                              <Badge
                                label={rx.exercise?.primaryMuscleGroup || 'Primary'}
                                variant="neutral"
                              />
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.noExercisesText}>No exercises populated for this routine.</Text>
                      )}
                    </Card>
                  ))
                ) : (
                  <Text style={styles.noExercisesText}>No routines found for this program.</Text>
                )}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Program Generator Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate Program</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Bruno will algorithmically tailor volume, reps, and routines strictly to your gym equipment and injury restrictions.
            </Text>

            {/* Training Goal */}
            <Text style={styles.fieldLabel}>Training Goal</Text>
            <View style={styles.optionsRow}>
              {(['hypertrophy', 'strength', 'endurance'] as const).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGoal(g)}
                  style={[styles.optionPill, goal === g && styles.optionPillActive]}>
                  <Text style={[styles.optionText, goal === g && styles.optionTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Split Type */}
            <Text style={styles.fieldLabel}>Split Type</Text>
            <View style={styles.optionsRow}>
              {[
                { label: 'Upper / Lower', val: 'upper_lower' as const },
                { label: 'Push / Pull / Legs', val: 'push_pull_legs' as const },
                { label: 'Full Body', val: 'full_body' as const },
              ].map((s) => (
                <Pressable
                  key={s.val}
                  onPress={() => setSplitType(s.val)}
                  style={[styles.optionPill, splitType === s.val && styles.optionPillActive]}>
                  <Text style={[styles.optionText, splitType === s.val && styles.optionTextActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Days Per Week */}
            <Text style={styles.fieldLabel}>Training Days Per Week</Text>
            <View style={styles.optionsRow}>
              {[3, 4, 5, 6].map((days) => (
                <Pressable
                  key={days}
                  onPress={() => setDaysPerWeek(days)}
                  style={[styles.numPill, daysPerWeek === days && styles.optionPillActive]}>
                  <Text style={[styles.optionText, daysPerWeek === days && styles.optionTextActive]}>
                    {days} Days
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Duration Weeks */}
            <Text style={styles.fieldLabel}>Program Duration</Text>
            <View style={styles.optionsRow}>
              {[4, 8, 12].map((w) => (
                <Pressable
                  key={w}
                  onPress={() => setDurationWeeks(w)}
                  style={[styles.numPill, durationWeeks === w && styles.optionPillActive]}>
                  <Text style={[styles.optionText, durationWeeks === w && styles.optionTextActive]}>
                    {w} Weeks
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Target Session Duration */}
            <Text style={styles.fieldLabel}>Session Duration</Text>
            <View style={styles.optionsRow}>
              {[30, 45, 60, 75].map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setDurationMinutes(m)}
                  style={[styles.numPill, durationMinutes === m && styles.optionPillActive]}>
                  <Text style={[styles.optionText, durationMinutes === m && styles.optionTextActive]}>
                    {m} Min
                  </Text>
                </Pressable>
              ))}
            </View>

            <Button
              title="Generate Workout Program"
              onPress={handleGenerateProgram}
              loading={generating}
              variant="primary"
              size="lg"
              style={styles.modalSubmit}
            />
          </ScrollView>
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
  selectorRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  selectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.canvasBase,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  selectorPillActive: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slateBody,
  },
  selectorTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  programDetails: {
    gap: Spacing.md,
  },
  summaryCard: {
    padding: Spacing.base,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 4,
  },
  summarySplit: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.coachOrange,
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginTop: Spacing.sm,
  },
  routineCard: {
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dayBadge: {
    backgroundColor: Colors.coachOrangeSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.coachOrange,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  exerciseList: {
    gap: Spacing.sm,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: Spacing.md,
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slateBody,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.charcoalDark,
    marginBottom: 2,
  },
  exerciseTarget: {
    fontSize: 12,
    color: Colors.slateBody,
  },
  noExercisesText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalScroll: {
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: 22,
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
  modalSubtitle: {
    fontSize: 14,
    color: Colors.slateBody,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionPill: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.canvasBase,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slateBody,
  },
  optionTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  numPill: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.canvasBase,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 70,
    alignItems: 'center',
  },
  modalSubmit: {
    width: '100%',
    marginTop: Spacing.xl,
  },
});
