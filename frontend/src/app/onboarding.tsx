import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { BorderRadius, Colors, Shadows, Spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import type { WorkoutProgram } from '../types/api';

// Onboarding State Data Interface
interface OnboardingState {
  goal: 'hypertrophy' | 'strength' | 'endurance';
  goalLabel: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  experienceLabel: string;
  environmentType: 'commercial' | 'apartment' | 'home';
  environmentLabel: string;
  equipment: {
    hasDumbbells: boolean;
    maxDumbbellWeightKg: number;
    hasBarbell: boolean;
    hasSquatRack: boolean;
    hasBench: boolean;
    hasCableStack: boolean;
    hasSmithMachine: boolean;
    hasPullupBar: boolean;
    hasAdjustableBench: boolean;
  };
  trainingDaysPerWeek: number;
  targetSessionDurationMinutes: number;
  limitations: Array<'none' | 'lower_back' | 'shoulder' | 'knee' | 'wrist'>;
  splitType: 'full_body' | 'upper_lower' | 'push_pull_legs';
}

const TOTAL_STEPS = 8;

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, markOnboardingCompleted } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generated program review state
  const [generatedProgram, setGeneratedProgram] = useState<WorkoutProgram | null>(null);
  const [activating, setActivating] = useState(false);

  // Answers State
  const [state, setState] = useState<OnboardingState>({
    goal: 'hypertrophy',
    goalLabel: 'Build Muscle (Hypertrophy)',
    experience: 'intermediate',
    experienceLabel: 'Intermediate (1 - 3 yrs)',
    environmentType: 'commercial',
    environmentLabel: 'Commercial Fitness Center',
    equipment: {
      hasDumbbells: true,
      maxDumbbellWeightKg: 24,
      hasBarbell: true,
      hasSquatRack: true,
      hasBench: true,
      hasCableStack: true,
      hasSmithMachine: true,
      hasPullupBar: true,
      hasAdjustableBench: true,
    },
    trainingDaysPerWeek: 4,
    targetSessionDurationMinutes: 45,
    limitations: ['none'],
    splitType: 'upper_lower',
  });

  const firstName = user?.name ? user.name.split(' ')[0] : 'Lifter';

  // Recommendation logic for training split
  const getRecommendedSplit = (days: number): 'full_body' | 'upper_lower' | 'push_pull_legs' => {
    if (days <= 3) return 'full_body';
    if (days === 4) return 'upper_lower';
    return 'push_pull_legs';
  };

  const handleNext = () => {
    setErrorMessage(null);
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final synthesis
      handleSynthesizeProgram();
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (generatedProgram) {
      setGeneratedProgram(null);
      return;
    }
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Submit profile, constraints, and generate program
  const handleSynthesizeProgram = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Create or update user's default Gym Profile
      const gymProfile = await api.gymProfiles.create({
        name: `${firstName}'s ${state.environmentLabel}`,
        environmentType: state.environmentType,
        hasDumbbells: state.equipment.hasDumbbells,
        maxDumbbellWeightKg: state.equipment.hasDumbbells
          ? state.equipment.maxDumbbellWeightKg
          : null,
        hasBarbell: state.equipment.hasBarbell,
        hasSquatRack: state.equipment.hasSquatRack,
        hasBench: state.equipment.hasBench,
        hasCableStack: state.equipment.hasCableStack,
        hasSmithMachine: state.equipment.hasSmithMachine,
        hasPullupBar: state.equipment.hasPullupBar,
        hasAdjustableBench: state.equipment.hasAdjustableBench,
      });

      // 2. Persist active physical constraints if any
      const activeLimits = state.limitations.filter((l) => l !== 'none');
      for (const limit of activeLimits) {
        try {
          await api.constraints.create({
            jointArea: limit,
            restrictionType: 'avoid_heavy_loading',
            notes: `Recorded during onboarding for ${firstName}`,
            isActive: true,
          });
        } catch {
          // ignore duplicate or non-critical constraint save
        }
      }

      // 3. Generate equipment-grounded periodized program
      const programName = `${state.goalLabel.split(' ')[0]} ${
        state.splitType === 'push_pull_legs'
          ? 'Push/Pull/Legs'
          : state.splitType === 'upper_lower'
          ? 'Upper/Lower'
          : 'Full Body'
      }`;

      const program = await api.programs.generate({
        name: programName,
        splitType: state.splitType,
        trainingDaysPerWeek: state.trainingDaysPerWeek,
        durationWeeks: 4,
        targetSessionDurationMinutes: state.targetSessionDurationMinutes,
        gymProfileId: gymProfile.id,
        goal: state.goal,
      });

      setGeneratedProgram(program);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to synthesize workout plan. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Activate program and navigate to Home
  const handleActivateAndStart = async () => {
    if (!generatedProgram) return;
    setActivating(true);
    setErrorMessage(null);

    try {
      await api.programs.activate(generatedProgram.id);
      await markOnboardingCompleted();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to activate program. Please try again.');
      }
    } finally {
      setActivating(false);
    }
  };

  // Step Header & Prompt mapping
  const getStepPrompt = () => {
    switch (currentStep) {
      case 1:
        return {
          title: `Hey, ${firstName}! What's your primary training objective?`,
          subtitle:
            'Bruno tunes your hypertrophy curves, rep schemes, and volume progression accordingly.',
        };
      case 2:
        return {
          title: 'What is your current lifting experience level?',
          subtitle:
            'This informs recovery assumptions and progressive overload pacing.',
        };
      case 3:
        return {
          title: 'Where will you do the majority of your workouts?',
          subtitle:
            'We ensure every prescribed movement matches your actual training facility.',
        };
      case 4:
        return {
          title: 'Check off your available equipment hardware:',
          subtitle:
            'Bruno will only prescribe exercises matching this equipment checklist.',
        };
      case 5:
        return {
          title: 'How many days per week can you realistically train?',
          subtitle:
            'Consistency trumps heroics. Choose a frequency you can maintain weekly.',
        };
      case 6:
        return {
          title: 'What is your target duration per workout session?',
          subtitle:
            'We will allocate working sets so you hit peak training stimulus without rushing.',
        };
      case 7:
        return {
          title: 'Do you have any physical joint restrictions or injury history?',
          subtitle:
            'Safety first: Bruno excludes contraindicated exercises in real-time. (Not medical advice)',
        };
      case 8:
        return {
          title: 'Choose your preferred weekly training split:',
          subtitle: `Based on ${state.trainingDaysPerWeek} days/week, Bruno recommends ${getRecommendedSplit(
            state.trainingDaysPerWeek,
          ).replace(/_/g, ' ').toUpperCase()}.`,
        };
      default:
        return { title: '', subtitle: '' };
    }
  };

  const prompt = getStepPrompt();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation Bar with Progress */}
      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          disabled={currentStep === 1 && !generatedProgram}
          style={[styles.backBtn, currentStep === 1 && !generatedProgram && styles.disabledBtn]}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            {generatedProgram ? 'Plan Review' : `Step ${currentStep} of ${TOTAL_STEPS}`}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            Alert.alert(
              'Skip Customization?',
              'Bruno will generate a balanced 4-day Upper/Lower cycle with default commercial gym equipment.',
              [
                { text: 'Continue Setup', style: 'cancel' },
                { text: 'Use Defaults', onPress: handleSynthesizeProgram },
              ],
            );
          }}
          style={styles.skipBtn}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </Pressable>
      </View>

      {/* Progress Bar Track */}
      {!generatedProgram && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentStep / TOTAL_STEPS) * 100}%` },
            ]}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {errorMessage && (
          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        )}

        {/* 1. Bruno Mascot Interactive Speech Bubble */}
        <View style={styles.brunoCard}>
          <View style={styles.brunoAvatarBox}>
            <Image
              source={require('@/assets/images/bruno-coach-avatar.png')}
              style={styles.brunoAvatar}
            />
          </View>
          <View style={styles.speechBubble}>
            <Text style={styles.speechTitle}>
              {generatedProgram ? 'Your Custom Program is Ready!' : prompt.title}
            </Text>
            <Text style={styles.speechSubtitle}>
              {generatedProgram
                ? 'Review your routines and prescribed volume below. Once activated, Bruno will guide you set-by-set.'
                : prompt.subtitle}
            </Text>
          </View>
        </View>

        {/* Loading Spinner during Generation */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingTitle}>Bruno is generating your lifting plan...</Text>
            <Text style={styles.loadingSub}>
              Grounding in equipment • Checking joint contraindications • Periodizing volume
            </Text>
          </View>
        )}

        {/* 2. Generated Program Review Mode */}
        {generatedProgram && !loading && (
          <Card style={styles.planCard}>
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planPre}>READY FOR ACTION</Text>
                <Text style={styles.planTitle}>{generatedProgram.name}</Text>
              </View>
              <Badge
                label={generatedProgram.splitType.replace(/_/g, ' ').toUpperCase()}
                variant="green"
              />
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>🗓️</Text>
                <Text style={styles.metaText}>{generatedProgram.trainingDaysPerWeek} Days / Week</Text>
              </View>
              <Text style={styles.metaDot}>•</Text>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>⏱️</Text>
                <Text style={styles.metaText}>
                  {generatedProgram.targetSessionDurationMinutes} Min / Session
                </Text>
              </View>
              <Text style={styles.metaDot}>•</Text>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>🔁</Text>
                <Text style={styles.metaText}>{generatedProgram.durationWeeks} Weeks</Text>
              </View>
            </View>

            <Text style={styles.routinesHeader}>SCHEDULED ROUTINES</Text>
            <View style={styles.routinesList}>
              {(generatedProgram.routines || []).map((routine, idx) => (
                <View key={routine.id || idx} style={styles.routineRow}>
                  <View style={styles.routineNumCircle}>
                    <Text style={styles.routineNumText}>{routine.dayNumber}</Text>
                  </View>
                  <View style={styles.routineTextCol}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    <Text style={styles.routineMeta}>
                      {routine.exercises?.length ?? 0} prescribed exercises
                      {routine.exercises?.[0]?.targetRpe
                        ? ` • Target RPE ${routine.exercises[0].targetRpe}`
                        : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <Button
              title={activating ? 'ACTIVATING PLAN...' : 'ACTIVATE PLAN & START TRAINING'}
              onPress={handleActivateAndStart}
              variant="primary"
              size="lg"
              loading={activating}
              style={styles.actionBtn}
            />
          </Card>
        )}

        {/* 3. Questionnaire Steps (When Not in Review Mode) */}
        {!generatedProgram && !loading && (
          <View style={styles.stepContainer}>
            {/* STEP 1: Primary Goal */}
            {currentStep === 1 && (
              <View style={styles.optionsCol}>
                {[
                  {
                    key: 'hypertrophy',
                    title: 'Build Muscle',
                    desc: 'Maximize hypertrophy, mechanical tension, and volume progression.',
                    icon: '💪',
                  },
                  {
                    key: 'strength',
                    title: 'Increase Strength',
                    desc: 'Focus on compound lifts, heavy loads, and neuromuscular power.',
                    icon: '🏋️',
                  },
                  {
                    key: 'endurance',
                    title: 'Athletic Conditioning',
                    desc: 'Boost muscular endurance, density, and systemic stamina.',
                    icon: '⚡',
                  },
                ].map((item) => {
                  const isSelected = state.goal === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() =>
                        setState((s) => ({
                          ...s,
                          goal: item.key as any,
                          goalLabel: item.title,
                        }))
                      }
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}>
                      <Text style={styles.cardIcon}>{item.icon}</Text>
                      <View style={styles.cardTextCol}>
                        <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                          {item.title}
                        </Text>
                        <Text style={styles.cardDesc}>{item.desc}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* STEP 2: Experience */}
            {currentStep === 2 && (
              <View style={styles.optionsCol}>
                {[
                  {
                    key: 'beginner',
                    title: 'Beginner',
                    desc: 'Under 1 year of consistent lifting. Fast linear neural adaptation.',
                    icon: '🌱',
                  },
                  {
                    key: 'intermediate',
                    title: 'Intermediate',
                    desc: '1 - 3 years. Solid form on compound lifts; benefits from structured splits.',
                    icon: '🎯',
                  },
                  {
                    key: 'advanced',
                    title: 'Advanced',
                    desc: '3+ years. Requires nuanced periodization, volume thresholds & fatigue management.',
                    icon: '🔥',
                  },
                ].map((item) => {
                  const isSelected = state.experience === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() =>
                        setState((s) => ({
                          ...s,
                          experience: item.key as any,
                          experienceLabel: item.title,
                        }))
                      }
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}>
                      <Text style={styles.cardIcon}>{item.icon}</Text>
                      <View style={styles.cardTextCol}>
                        <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                          {item.title}
                        </Text>
                        <Text style={styles.cardDesc}>{item.desc}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* STEP 3: Training Location */}
            {currentStep === 3 && (
              <View style={styles.optionsCol}>
                {[
                  {
                    key: 'commercial',
                    title: 'Commercial Gym',
                    desc: 'Full selection of barbells, power racks, cable stacks, and dumbbells.',
                    icon: '🏢',
                  },
                  {
                    key: 'apartment',
                    title: 'Apartment / Hotel Gym',
                    desc: 'Compact layout with dumbbells, basic benches, and select machines.',
                    icon: '🏙️',
                  },
                  {
                    key: 'home',
                    title: 'Home / Garage Gym',
                    desc: 'Dedicated private setup: rack, barbell, or adjustable dumbbell set.',
                    icon: '🏡',
                  },
                ].map((item) => {
                  const isSelected = state.environmentType === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() =>
                        setState((s) => ({
                          ...s,
                          environmentType: item.key as any,
                          environmentLabel: item.title,
                        }))
                      }
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}>
                      <Text style={styles.cardIcon}>{item.icon}</Text>
                      <View style={styles.cardTextCol}>
                        <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                          {item.title}
                        </Text>
                        <Text style={styles.cardDesc}>{item.desc}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* STEP 4: Equipment Checklist */}
            {currentStep === 4 && (
              <View style={styles.equipmentContainer}>
                <View style={styles.chipGrid}>
                  {[
                    { key: 'hasDumbbells', label: 'Dumbbells', icon: '🏋️' },
                    { key: 'hasBarbell', label: 'Barbell & Plates', icon: '🏋️‍♂️' },
                    { key: 'hasSquatRack', label: 'Squat Rack', icon: '🚪' },
                    { key: 'hasBench', label: 'Flat Bench', icon: '🛋️' },
                    { key: 'hasAdjustableBench', label: 'Adjustable Bench', icon: '📐' },
                    { key: 'hasCableStack', label: 'Cable Tower / Stack', icon: '⛓️' },
                    { key: 'hasSmithMachine', label: 'Smith Machine', icon: '🏗️' },
                    { key: 'hasPullupBar', label: 'Pull-up Bar', icon: '🪜' },
                  ].map((eq) => {
                    const isChecked = Boolean(state.equipment[eq.key as keyof typeof state.equipment]);
                    return (
                      <Pressable
                        key={eq.key}
                        onPress={() =>
                          setState((s) => ({
                            ...s,
                            equipment: {
                              ...s.equipment,
                              [eq.key]: !isChecked,
                            },
                          }))
                        }
                        style={[styles.equipChip, isChecked ? styles.equipChipActive : null]}>
                        <Text style={styles.equipIcon}>{eq.icon}</Text>
                        <Text style={[styles.equipLabel, isChecked ? styles.equipLabelActive : null]}>
                          {eq.label}
                        </Text>
                        <Text style={styles.checkIcon}>{isChecked ? '✓' : '+'}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Max Dumbbell Stepper if dumbbells selected */}
                {state.equipment.hasDumbbells && (
                  <Card style={styles.stepperCard}>
                    <Text style={styles.stepperTitle}>HEAVIEST DUMBBELL IN GYM</Text>
                    <View style={styles.stepperRow}>
                      <Pressable
                        onPress={() =>
                          setState((s) => ({
                            ...s,
                            equipment: {
                              ...s.equipment,
                              maxDumbbellWeightKg: Math.max(
                                10,
                                s.equipment.maxDumbbellWeightKg - 2,
                              ),
                            },
                          }))
                        }
                        style={styles.stepBtn}>
                        <Text style={styles.stepBtnText}>−</Text>
                      </Pressable>
                      <Text style={styles.stepVal}>
                        {state.equipment.maxDumbbellWeightKg} kg
                      </Text>
                      <Pressable
                        onPress={() =>
                          setState((s) => ({
                            ...s,
                            equipment: {
                              ...s.equipment,
                              maxDumbbellWeightKg: Math.min(
                                60,
                                s.equipment.maxDumbbellWeightKg + 2,
                              ),
                            },
                          }))
                        }
                        style={styles.stepBtn}>
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </Card>
                )}
              </View>
            )}

            {/* STEP 5: Training Frequency */}
            {currentStep === 5 && (
              <View style={styles.optionsCol}>
                {[
                  {
                    days: 3,
                    title: '3 Days / Week',
                    desc: 'Balanced Full-Body cycle. Perfect for high recovery and busy schedules.',
                  },
                  {
                    days: 4,
                    title: '4 Days / Week (Recommended)',
                    desc: 'Upper / Lower split. The gold-standard balance of frequency and fatigue.',
                  },
                  {
                    days: 5,
                    title: '5 Days / Week',
                    desc: 'Push / Pull / Legs + Upper / Lower hybrid for dedicated lifters.',
                  },
                  {
                    days: 6,
                    title: '6 Days / Week',
                    desc: 'Dedicated Push / Pull / Legs double-cycle with high volume demands.',
                  },
                ].map((item) => {
                  const isSelected = state.trainingDaysPerWeek === item.days;
                  return (
                    <Pressable
                      key={item.days}
                      onPress={() => {
                        const rec = getRecommendedSplit(item.days);
                        setState((s) => ({
                          ...s,
                          trainingDaysPerWeek: item.days,
                          splitType: rec,
                        }));
                      }}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}>
                      <View style={styles.daysCircle}>
                        <Text style={styles.daysCircleText}>{item.days}</Text>
                      </View>
                      <View style={styles.cardTextCol}>
                        <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                          {item.title}
                        </Text>
                        <Text style={styles.cardDesc}>{item.desc}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* STEP 6: Session Duration */}
            {currentStep === 6 && (
              <View style={styles.optionsCol}>
                {[
                  {
                    mins: 30,
                    title: '30 Minutes',
                    desc: 'Express high-density session. Minimal rest, focused working sets.',
                  },
                  {
                    mins: 45,
                    title: '45 Minutes (Recommended)',
                    desc: 'Optimal sweet spot. Adequate warmup, compound sets & accessory work.',
                  },
                  {
                    mins: 60,
                    title: '60 Minutes',
                    desc: 'High volume capacity. Full compound sets and isolation specialization.',
                  },
                ].map((item) => {
                  const isSelected = state.targetSessionDurationMinutes === item.mins;
                  return (
                    <Pressable
                      key={item.mins}
                      onPress={() =>
                        setState((s) => ({ ...s, targetSessionDurationMinutes: item.mins }))
                      }
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}>
                      <Text style={styles.cardIcon}>⏱️</Text>
                      <View style={styles.cardTextCol}>
                        <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                          {item.title}
                        </Text>
                        <Text style={styles.cardDesc}>{item.desc}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* STEP 7: Joint Limitations */}
            {currentStep === 7 && (
              <View style={styles.optionsCol}>
                <Card style={styles.noticeCard}>
                  <Text style={styles.noticeIcon}>ℹ️</Text>
                  <Text style={styles.noticeText}>
                    Bruno will automatically swap out exercises known to aggravate these joints.
                  </Text>
                </Card>

                {[
                  {
                    key: 'none',
                    title: 'None — Fully Healthy',
                    desc: 'No restrictions. Standard compound mechanics apply.',
                    icon: '✨',
                  },
                  {
                    key: 'lower_back',
                    title: 'Lower Back Sensitivity',
                    desc: 'Excludes heavy axial loading (deadlifts, unbraced squats).',
                    icon: '🩹',
                  },
                  {
                    key: 'shoulder',
                    title: 'Shoulder Impingement',
                    desc: 'Excludes behind-neck presses and deep flares.',
                    icon: '🩹',
                  },
                  {
                    key: 'knee',
                    title: 'Knee Patellar Strain',
                    desc: 'Favors hip hinges, controlled leg presses over quad shears.',
                    icon: '🩹',
                  },
                ].map((item) => {
                  const isChecked = state.limitations.includes(item.key as any);
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => {
                        setState((s) => {
                          if (item.key === 'none') {
                            return { ...s, limitations: ['none'] };
                          }
                          const filtered = s.limitations.filter((l) => l !== 'none');
                          const exists = filtered.includes(item.key as any);
                          const updated = exists
                            ? filtered.filter((l) => l !== item.key)
                            : [...filtered, item.key as any];
                          return {
                            ...s,
                            limitations: updated.length > 0 ? updated : ['none'],
                          };
                        });
                      }}
                      style={[styles.optionCard, isChecked && styles.optionCardSelected]}>
                      <Text style={styles.cardIcon}>{item.icon}</Text>
                      <View style={styles.cardTextCol}>
                        <Text style={[styles.cardTitle, isChecked && styles.cardTitleSelected]}>
                          {item.title}
                        </Text>
                        <Text style={styles.cardDesc}>{item.desc}</Text>
                      </View>
                      <View style={[styles.checkboxBox, isChecked && styles.checkboxActive]}>
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* STEP 8: Training Split */}
            {currentStep === 8 && (
              <View style={styles.optionsCol}>
                {[
                  {
                    key: 'full_body',
                    title: 'Full Body Split',
                    desc: 'Every session trains major push, pull, and leg drivers.',
                    bestFor: '3 days/week',
                  },
                  {
                    key: 'upper_lower',
                    title: 'Upper / Lower Split',
                    desc: 'Alternates upper body pressing/pulling and lower body squats/hinges.',
                    bestFor: '4 days/week (Recommended)',
                  },
                  {
                    key: 'push_pull_legs',
                    title: 'Push / Pull / Legs (PPL)',
                    desc: 'Chest/Delts/Triceps -> Back/Biceps -> Quads/Hamstrings.',
                    bestFor: '5-6 days/week',
                  },
                ].map((item) => {
                  const isSelected = state.splitType === item.key;
                  const isRecommended =
                    getRecommendedSplit(state.trainingDaysPerWeek) === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() =>
                        setState((s) => ({ ...s, splitType: item.key as any }))
                      }
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}>
                      <View style={styles.cardTextCol}>
                        <View style={styles.splitRow}>
                          <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                            {item.title}
                          </Text>
                          {isRecommended && (
                            <Badge label="RECOMMENDED" variant="orange" />
                          )}
                        </View>
                        <Text style={styles.cardDesc}>{item.desc}</Text>
                        <Text style={styles.bestForText}>Optimal cadence: {item.bestFor}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Bottom Continue Action */}
            <Button
              title={
                currentStep === TOTAL_STEPS
                  ? 'BUILD & PERSONALIZE MY PLAN'
                  : `CONTINUE TO STEP ${currentStep + 1}`
              }
              onPress={handleNext}
              variant="primary"
              size="lg"
              style={styles.actionBtn}
            />
          </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.canvasBase,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  disabledBtn: {
    opacity: 0,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.charcoalDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.borderSubtle,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  brunoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.canvasBase,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    marginBottom: Spacing.base,
    width: '100%',
    ...Shadows.card,
  },
  brunoAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.coachOrangeSubtle,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.coachOrange,
  },
  brunoAvatar: {
    width: '100%',
    height: '100%',
  },
  speechBubble: {
    flex: 1,
  },
  speechTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 4,
    lineHeight: 20,
  },
  speechSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slateBody,
  },
  stepContainer: {
    width: '100%',
  },
  optionsCol: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasBase,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySubtle,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 2,
  },
  cardTitleSelected: {
    color: Colors.primaryHover,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.slateBody,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  daysCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysCircleText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  bestForText: {
    fontSize: 11,
    color: Colors.coachOrange,
    fontWeight: '600',
    marginTop: 4,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  noticeIcon: {
    fontSize: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  equipmentContainer: {
    width: '100%',
    marginBottom: Spacing.base,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  equipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasBase,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  equipChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySubtle,
  },
  equipIcon: {
    fontSize: 15,
  },
  equipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.charcoalDark,
  },
  equipLabelActive: {
    color: Colors.primaryHover,
  },
  checkIcon: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  stepperCard: {
    backgroundColor: Colors.canvasBase,
    padding: Spacing.md,
    alignItems: 'center',
  },
  stepperTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  stepVal: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.charcoalDark,
    minWidth: 80,
    textAlign: 'center',
  },
  loadingBox: {
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoalDark,
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  planCard: {
    width: '100%',
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  planPre: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  routinesHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  routinesList: {
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  routineNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  routineTextCol: {
    flex: 1,
  },
  routineName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  routineMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionBtn: {
    width: '100%',
  },
});
