import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { Header } from '../components/ui/Header';
import { Input } from '../components/ui/Input';
import { BRUNO_IMAGES } from '../constants/images';
import { BorderRadius, Colors, Shadows, Spacing } from '../constants/theme';
import { api, ApiError } from '../services/api';

const RPE_LEVELS = [
  { val: 6, label: '6 - Moderate', desc: '4+ Reps in Reserve' },
  { val: 7, label: '7 - Vigorous', desc: '3 Reps in Reserve' },
  { val: 8, label: '8 - Solid Effort', desc: '2 Reps in Reserve' },
  { val: 9, label: '9 - Very Hard', desc: '1 Rep in Reserve' },
  { val: 10, label: '10 - Maximum', desc: 'Zero Reps Left (Failure)' },
];

export default function PostWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [rpe, setRpe] = useState(8);
  const [soreness, setSoreness] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFinish = async () => {
    if (!sessionId) {
      setErrorMessage('Missing active workout session identifier.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await api.sessions.finish(sessionId, {
        perceivedRpe: rpe,
        jointSoreness: soreness,
        notes: notes.trim() || undefined,
        completedAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to submit post-workout feedback.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.celebrationContainer}>
          <View style={styles.mascotCircle}>
            <Image
              source={BRUNO_IMAGES.WORKOUT_COMPLETE}
              style={styles.mascotImg}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.congratsTitle}>Session Completed!</Text>
          <Text style={styles.congratsSubtitle}>
            Great work today! Bruno calibrated your volume telemetry and updated your CNS recovery curve for your next session.
          </Text>

          <Card style={styles.recoveryCard}>
            <Text style={styles.recLabel}>ESTIMATED RECOVERY WINDOW</Text>
            <Text style={styles.recVal}>48 Hours • Systemic Ready</Text>
            <Text style={styles.recTip}>
              Focus on protein intake and 8 hours of deep sleep to lock in tonight’s hypertrophic adaptation.
            </Text>
          </Card>

          <Button
            title="Return to Dashboard"
            onPress={() => router.replace('/(tabs)')}
            variant="primary"
            size="lg"
            style={styles.returnBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Post-Workout Calibration"
        subtitle="Telemetry & Recovery"
        showBack
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {errorMessage ? (
            <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          ) : null}

          {/* Coach Bruno Debrief Unit */}
          <View style={styles.coachWelcomeCard}>
            <View style={styles.avatarWrapper}>
              <Image
                source={BRUNO_IMAGES.WORKOUT_COMPLETE}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeIcon}>⚡</Text>
              </View>
            </View>
            <View style={styles.speechCol}>
              <View style={styles.coachHeaderRow}>
                <Text style={styles.coachName}>COACH BRUNO</Text>
                <View style={styles.greenPulse} />
              </View>
              <Text style={styles.coachSpeech}>
                “Outstanding execution today! Rate your session so I can calibrate next workout's micro-loads.”
              </Text>
            </View>
          </View>

          {/* RPE Rating Card */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Rate Overall Workout Effort (RPE)</Text>
            <Text style={styles.cardSubtitle}>
              Bruno uses perceived exertion to calculate fatigue accumulation and progressive micro-load adjustments.
            </Text>

            <View style={styles.rpeGrid}>
              {RPE_LEVELS.map((level) => {
                const isSelected = rpe === level.val;
                return (
                  <Pressable
                    key={level.val}
                    onPress={() => setRpe(level.val)}
                    style={[
                      styles.rpeCard,
                      isSelected && styles.rpeCardActive,
                    ]}>
                    <View style={styles.rpeLeft}>
                      <Text style={[styles.rpeNum, isSelected && styles.rpeNumActive]}>
                        {level.val}
                      </Text>
                      <View>
                        <Text style={[styles.rpeLabel, isSelected && styles.rpeLabelActive]}>
                          {level.label}
                        </Text>
                        <Text style={styles.rpeDesc}>{level.desc}</Text>
                      </View>
                    </View>
                    {isSelected ? <Text style={styles.checkIcon}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Joint Soreness Rating Card */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Joint & Connective Soreness (0-10)</Text>
            <Text style={styles.cardSubtitle}>
              0 = completely fresh, 5 = noticeable tendon tenderness, 10 = sharp pain
            </Text>

            <View style={styles.sorenessRow}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = soreness === num;
                return (
                  <Pressable
                    key={num}
                    onPress={() => setSoreness(num)}
                    style={[
                      styles.sorenessPill,
                      isSelected && styles.sorenessPillActive,
                      num >= 6 && isSelected && styles.sorenessPillHigh,
                    ]}>
                    <Text
                      style={[
                        styles.sorenessText,
                        isSelected && styles.sorenessTextActive,
                      ]}>
                      {num}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Session Notes */}
          <Card style={styles.card}>
            <Input
              label="Session Notes (Optional)"
              placeholder="e.g. Incline press felt smooth; bumped working weight by 2.5kg"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
            />
          </Card>

          <Button
            title="Complete Workout & Calibrate"
            onPress={handleFinish}
            loading={submitting}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  card: {
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.slateBody,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  rpeGrid: {
    gap: Spacing.sm,
  },
  rpeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rpeCardActive: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  rpeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rpeNum: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.charcoalDark,
    width: 28,
  },
  rpeNumActive: {
    color: Colors.primary,
  },
  rpeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  rpeLabelActive: {
    color: Colors.primary,
  },
  rpeDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkIcon: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },
  sorenessRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  sorenessPill: {
    width: 28,
    height: 38,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sorenessPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sorenessPillHigh: {
    backgroundColor: Colors.coachOrange,
    borderColor: Colors.coachOrange,
  },
  sorenessText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  sorenessTextActive: {
    color: '#FFF',
  },
  submitBtn: {
    width: '100%',
    marginVertical: Spacing.base,
  },
  celebrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  mascotCircle: {
    width: 140,
    height: 180,
    marginBottom: Spacing.lg,
  },
  mascotImg: {
    width: '100%',
    height: '100%',
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 8,
  },
  congratsSubtitle: {
    fontSize: 14,
    color: Colors.slateBody,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: Spacing.xl,
  },
  recoveryCard: {
    width: '100%',
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  recLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.technicalBlue,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  recVal: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 4,
  },
  recTip: {
    fontSize: 13,
    color: Colors.slateBody,
    lineHeight: 18,
  },
  returnBtn: {
    width: '100%',
  },
  coachWelcomeCard: {
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
    width: 64,
    height: 64,
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
