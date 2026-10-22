import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { Header } from '../components/ui/Header';
import { Input } from '../components/ui/Input';
import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { api, ApiError } from '../services/api';
import type { UserConstraint } from '../types/api';

const JOINT_AREAS = [
  { id: 'shoulder', label: 'Shoulder', emoji: '🦾' },
  { id: 'lower_back', label: 'Lower Back', emoji: '🪵' },
  { id: 'knee', label: 'Knee', emoji: '🦵' },
  { id: 'wrist', label: 'Wrist', emoji: '✋' },
  { id: 'elbow', label: 'Elbow', emoji: '💪' },
  { id: 'hip', label: 'Hip', emoji: '🦴' },
];

export default function ConstraintsScreen() {
  const router = useRouter();

  const [constraints, setConstraints] = useState<UserConstraint[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Constraint Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJoint, setSelectedJoint] = useState('shoulder');
  const [restrictionType, setRestrictionType] = useState('pain');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchConstraints = async () => {
    try {
      setErrorMessage(null);
      const data = await api.constraints.list(false);
      setConstraints(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConstraints();
  }, []);

  const handleToggleConstraint = async (constraint: UserConstraint) => {
    try {
      await api.constraints.update(constraint.id, {
        isActive: !constraint.isActive,
      });
      await fetchConstraints();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      }
    }
  };

  const handleDeleteConstraint = (id: string) => {
    Alert.alert('Remove Restriction', 'Are you sure you want to remove this constraint?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.constraints.delete(id);
            await fetchConstraints();
          } catch (err: unknown) {
            if (err instanceof ApiError) {
              setErrorMessage(err.message);
            }
          }
        },
      },
    ]);
  };

  const handleCreateConstraint = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await api.constraints.create({
        jointArea: selectedJoint,
        restrictionType,
        notes: notes.trim() || null,
        isActive: true,
      });
      setModalVisible(false);
      setNotes('');
      await fetchConstraints();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to add physical constraint.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Joint Restrictions"
        subtitle="Injury Safety Protection"
        showBack
        onBack={() => router.back()}
        rightAction={
          <Button
            title="+ Add"
            onPress={() => setModalVisible(true)}
            size="sm"
            variant="orange"
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {errorMessage ? (
          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        ) : null}

        <View style={styles.safetyInfoCard}>
          <Text style={styles.safetyIcon}>🛡️</Text>
          <View style={styles.safetyTextCol}>
            <Text style={styles.safetyTitle}>Safety-Grounded Telemetry</Text>
            <Text style={styles.safetyDesc}>
              Bruno strictly filters out exercises that aggravate active joint pain or limited range of motion (e.g. overhead pressing for shoulder impingement or heavy axial spinal loading for lower back pain).
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : constraints.length === 0 ? (
          <EmptyState
            title="No Restrictions Logged"
            description="You have not added any joint or movement limitations. Bruno assumes full range of motion for all biomechanical movements."
            actionTitle="+ Add Joint Restriction"
            onAction={() => setModalVisible(true)}
            showMascot={false}
          />
        ) : (
          <View style={styles.constraintList}>
            {constraints.map((c) => (
              <Card key={c.id} style={styles.constraintCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.jointTitleRow}>
                    <Text style={styles.jointName}>
                      {c.jointArea.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Badge
                      label={c.restrictionType.toUpperCase()}
                      variant="orange"
                    />
                  </View>

                  <Switch
                    value={c.isActive}
                    onValueChange={() => handleToggleConstraint(c)}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                  />
                </View>

                {c.notes ? <Text style={styles.notesText}>{c.notes}</Text> : null}

                <View style={styles.cardFooter}>
                  <Text style={styles.statusLabel}>
                    Status: <Text style={{ color: c.isActive ? Colors.primary : Colors.textMuted, fontWeight: '700' }}>
                      {c.isActive ? 'Active Guard' : 'Inactive'}
                    </Text>
                  </Text>
                  <Pressable onPress={() => handleDeleteConstraint(c.id)}>
                    <Text style={styles.deleteLink}>Delete</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Constraint Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Joint Restriction</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Affected Joint / Anatomical Area</Text>
            <View style={styles.jointGrid}>
              {JOINT_AREAS.map((j) => (
                <Pressable
                  key={j.id}
                  onPress={() => setSelectedJoint(j.id)}
                  style={[
                    styles.jointPill,
                    selectedJoint === j.id && styles.jointPillActive,
                  ]}>
                  <Text style={styles.jointEmoji}>{j.emoji}</Text>
                  <Text
                    style={[
                      styles.jointLabel,
                      selectedJoint === j.id && styles.jointLabelActive,
                    ]}>
                    {j.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Restriction Severity Type</Text>
            <View style={styles.typeRow}>
              {[
                { id: 'pain', label: 'Active Pain' },
                { id: 'limited_rom', label: 'Limited ROM' },
                { id: 'rehab', label: 'Rehab / Surgery' },
              ].map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setRestrictionType(t.id)}
                  style={[
                    styles.typePill,
                    restrictionType === t.id && styles.typePillActive,
                  ]}>
                  <Text
                    style={[
                      styles.typeLabel,
                      restrictionType === t.id && styles.typeLabelActive,
                    ]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Input
              label="Doctor or Physiotherapist Notes (Optional)"
              placeholder="e.g. Avoid overhead pressing above 90 degrees"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
            />

            <Button
              title="Save Joint Restriction"
              onPress={handleCreateConstraint}
              loading={submitting}
              variant="orange"
              size="lg"
              style={{ marginTop: Spacing.base }}
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
  safetyInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  safetyIcon: {
    fontSize: 22,
  },
  safetyTextCol: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 2,
  },
  safetyDesc: {
    fontSize: 12,
    color: Colors.slateBody,
    lineHeight: 18,
  },
  loaderBox: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  constraintList: {
    gap: Spacing.md,
  },
  constraintCard: {
    padding: Spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  jointTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  jointName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  notesText: {
    fontSize: 13,
    color: Colors.slateBody,
    lineHeight: 18,
    marginVertical: Spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deleteLink: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
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
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  closeBtn: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  jointGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  jointPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.canvasBase,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jointPillActive: {
    backgroundColor: Colors.coachOrangeSubtle,
    borderColor: Colors.coachOrange,
  },
  jointEmoji: {
    fontSize: 16,
  },
  jointLabel: {
    fontSize: 13,
    color: Colors.slateBody,
    fontWeight: '600',
  },
  jointLabelActive: {
    color: Colors.coachOrange,
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typePill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.canvasBase,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  typePillActive: {
    backgroundColor: Colors.charcoalDark,
    borderColor: Colors.charcoalDark,
  },
  typeLabel: {
    fontSize: 12,
    color: Colors.slateBody,
    fontWeight: '600',
  },
  typeLabelActive: {
    color: '#FFF',
    fontWeight: '700',
  },
});
