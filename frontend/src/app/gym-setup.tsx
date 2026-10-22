import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { Header } from '../components/ui/Header';
import { Input } from '../components/ui/Input';
import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { api, ApiError } from '../services/api';
import type { CreateGymProfileInput, GymProfile } from '../types/api';

export default function GymSetupScreen() {
  const router = useRouter();

  const [profiles, setProfiles] = useState<GymProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('My Gym Setup');
  const [environmentType, setEnvironmentType] = useState<'commercial' | 'apartment' | 'home' | 'other'>('commercial');
  const [maxDumbbellWeightKg, setMaxDumbbellWeightKg] = useState('40');
  const [hasBarbell, setHasBarbell] = useState(true);
  const [hasSquatRack, setHasSquatRack] = useState(true);
  const [hasBench, setHasBench] = useState(true);
  const [hasCableStack, setHasCableStack] = useState(true);
  const [hasSmithMachine, setHasSmithMachine] = useState(true);
  const [hasPullupBar, setHasPullupBar] = useState(true);
  const [hasAdjustableBench, setHasAdjustableBench] = useState(true);
  const [hasDumbbells, setHasDumbbells] = useState(true);
  const [isDefault, setIsDefault] = useState(true);

  const fetchProfiles = async () => {
    try {
      setErrorMessage(null);
      const data = await api.gymProfiles.list();
      setProfiles(data);
      if (data.length > 0) {
        const p = data.find((item) => item.isDefault) || data[0];
        setName(p.name);
        setEnvironmentType(p.environmentType);
        setMaxDumbbellWeightKg(p.maxDumbbellWeightKg ? String(p.maxDumbbellWeightKg) : '40');
        setHasBarbell(p.hasBarbell);
        setHasSquatRack(p.hasSquatRack);
        setHasBench(p.hasBench);
        setHasCableStack(p.hasCableStack);
        setHasSmithMachine(p.hasSmithMachine);
        setHasPullupBar(p.hasPullupBar);
        setHasAdjustableBench(p.hasAdjustableBench);
        setHasDumbbells(p.hasDumbbells);
        setIsDefault(p.isDefault);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage('Please give your gym profile a name');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const payload: CreateGymProfileInput = {
      name: name.trim(),
      environmentType,
      maxDumbbellWeightKg: parseFloat(maxDumbbellWeightKg) || null,
      hasBarbell,
      hasSquatRack,
      hasBench,
      hasCableStack,
      hasSmithMachine,
      hasPullupBar,
      hasAdjustableBench,
      hasDumbbells,
      isDefault,
    };

    try {
      if (profiles.length > 0) {
        await api.gymProfiles.update(profiles[0].id, payload);
      } else {
        await api.gymProfiles.create(payload);
      }
      Alert.alert('Saved!', 'Bruno will use this equipment setup to filter workouts.');
      router.back();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save gym hardware profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Gym Hardware"
        subtitle="Equipment Calibration"
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

          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              <Card style={styles.card}>
                <Input
                  label="Gym Profile Name"
                  placeholder="e.g. Golds Gym, Apartment Gym"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.fieldLabel}>Facility Environment</Text>
                <View style={styles.envRow}>
                  {[
                    { label: 'Commercial Gym', val: 'commercial' as const },
                    { label: 'Apartment', val: 'apartment' as const },
                    { label: 'Home Garage', val: 'home' as const },
                  ].map((env) => (
                    <Pressable
                      key={env.val}
                      onPress={() => setEnvironmentType(env.val)}
                      style={[
                        styles.envPill,
                        environmentType === env.val && styles.envPillActive,
                      ]}>
                      <Text
                        style={[
                          styles.envText,
                          environmentType === env.val && styles.envTextActive,
                        ]}>
                        {env.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Input
                  label="Heaviest Dumbbell Available (kg)"
                  placeholder="e.g. 40"
                  keyboardType="numeric"
                  value={maxDumbbellWeightKg}
                  onChangeText={setMaxDumbbellWeightKg}
                />
              </Card>

              {/* Hardware Toggles */}
              <Text style={styles.sectionTitle}>Available Equipment Checklist</Text>
              <Card style={styles.toggleCard}>
                {[
                  { label: 'Barbell & Olympic Plates', state: hasBarbell, set: setHasBarbell, icon: '🏋️' },
                  { label: 'Power / Squat Rack', state: hasSquatRack, set: setHasSquatRack, icon: '🪜' },
                  { label: 'Flat Workout Bench', state: hasBench, set: setHasBench, icon: '🛋️' },
                  { label: 'Adjustable Incline Bench', state: hasAdjustableBench, set: setHasAdjustableBench, icon: '📐' },
                  { label: 'Cable Tower / Dual Stack', state: hasCableStack, set: setHasCableStack, icon: '🪢' },
                  { label: 'Smith Machine', state: hasSmithMachine, set: setHasSmithMachine, icon: '⛓️' },
                  { label: 'Dumbbells Set', state: hasDumbbells, set: setHasDumbbells, icon: '💪' },
                  { label: 'Pull-up / Dip Station', state: hasPullupBar, set: setHasPullupBar, icon: '🔝' },
                ].map((item, idx) => (
                  <View key={idx} style={styles.toggleRow}>
                    <View style={styles.toggleLabelRow}>
                      <Text style={styles.toggleIcon}>{item.icon}</Text>
                      <Text style={styles.toggleLabel}>{item.label}</Text>
                    </View>
                    <Switch
                      value={item.state}
                      onValueChange={item.set}
                      trackColor={{ false: Colors.border, true: Colors.primary }}
                    />
                  </View>
                ))}
              </Card>

              <Button
                title="Save Gym Profile"
                onPress={handleSave}
                loading={saving}
                variant="primary"
                size="lg"
                style={styles.saveBtn}
              />
            </>
          )}
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
  loaderBox: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  card: {
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.charcoalDark,
    marginBottom: Spacing.sm,
  },
  envRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  envPill: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  envPillActive: {
    backgroundColor: Colors.technicalBlue,
    borderColor: Colors.technicalBlue,
  },
  envText: {
    fontSize: 13,
    color: Colors.slateBody,
    fontWeight: '600',
  },
  envTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  toggleCard: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  toggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  toggleIcon: {
    fontSize: 18,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.charcoalDark,
  },
  saveBtn: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
});
