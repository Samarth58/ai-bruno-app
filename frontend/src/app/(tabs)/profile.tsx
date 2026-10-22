import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { BorderRadius, Colors, Spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { api, getApiBaseUrl } from '../../services/api';
import type { GymProfile, UserConstraint } from '../../types/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [gymProfiles, setGymProfiles] = useState<GymProfile[]>([]);
  const [constraints, setConstraints] = useState<UserConstraint[]>([]);
  const [backendHealth, setBackendHealth] = useState<'connected' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    async function loadData() {
      try {
        const [profilesData, constraintsData, healthData] = await Promise.allSettled([
          api.gymProfiles.list(),
          api.constraints.list(true),
          api.health(),
        ]);

        if (profilesData.status === 'fulfilled') setGymProfiles(profilesData.value);
        if (constraintsData.status === 'fulfilled') setConstraints(constraintsData.value);
        if (healthData.status === 'fulfilled' && healthData.value.status === 'ok') {
          setBackendHealth('connected');
        } else {
          setBackendHealth('offline');
        }
      } catch {
        setBackendHealth('offline');
      }
    }
    loadData();
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Bruno AI Gym Buddy?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const defaultGym = gymProfiles.find((g) => g.isDefault) || gymProfiles[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Profile & Settings" subtitle="Account & Hardware" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Identity Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Image
              source={require('@/assets/images/bruno-coach-avatar.png')}
              style={styles.avatarImg}
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Lifter'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleRow}>
              <Badge label={user?.role?.toUpperCase() || 'LIFTER'} variant="green" />
            </View>
          </View>
        </Card>

        {/* Bruno AI Consultation & Program Setup */}
        <Text style={styles.sectionHeader}>Bruno AI Consultation</Text>
        <Card style={styles.menuCard}>
          <Pressable onPress={() => router.push('/onboarding')} style={styles.menuRow}>
            <View style={[styles.menuIconCircle, { backgroundColor: Colors.coachOrangeSubtle }]}>
              <Text style={styles.menuIcon}>🤖</Text>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Re-run Bruno's Questionnaire</Text>
              <Text style={styles.menuSubtitle}>
                Update fitness goals, equipment & regenerate lifting cycle
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Card>

        {/* Gym Hardware Setup Section */}
        <Text style={styles.sectionHeader}>Gym Hardware Profile</Text>
        <Card style={styles.menuCard}>
          <Pressable onPress={() => router.push('/gym-setup')} style={styles.menuRow}>
            <View style={styles.menuIconCircle}>
              <Text style={styles.menuIcon}>🏋️</Text>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>
                {defaultGym ? defaultGym.name : 'Configure Gym Profile'}
              </Text>
              <Text style={styles.menuSubtitle}>
                {defaultGym
                  ? `${defaultGym.environmentType.toUpperCase()} • ${defaultGym.hasBarbell ? 'Barbell' : 'No Barbell'} • ${defaultGym.hasDumbbells ? 'Dumbbells' : ''}`
                  : 'Specify available racks, dumbbells & benches'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Card>

        {/* Physical Joint Restrictions */}
        <Text style={styles.sectionHeader}>Injury & Constraint Safety</Text>
        <Card style={styles.menuCard}>
          <Pressable onPress={() => router.push('/constraints')} style={styles.menuRow}>
            <View style={[styles.menuIconCircle, { backgroundColor: Colors.coachOrangeSubtle }]}>
              <Text style={styles.menuIcon}>🩹</Text>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Active Joint Restrictions</Text>
              <Text style={styles.menuSubtitle}>
                {constraints.length > 0
                  ? `${constraints.length} active restrictions (${constraints.map((c) => c.jointArea).join(', ')})`
                  : 'No active physical restrictions'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Card>

        {/* Exercise Library */}
        <Text style={styles.sectionHeader}>Exercise Knowledge Base</Text>
        <Card style={styles.menuCard}>
          <Pressable onPress={() => router.push('/exercises')} style={styles.menuRow}>
            <View style={[styles.menuIconCircle, { backgroundColor: Colors.technicalBlueSubtle }]}>
              <Text style={styles.menuIcon}>📚</Text>
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Exercise Catalog</Text>
              <Text style={styles.menuSubtitle}>
                Browse exercise variations, muscle recruitment & substitutions
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Card>

        {/* Backend Connectivity Status */}
        <Text style={styles.sectionHeader}>System Diagnostics</Text>
        <Card style={styles.systemCard}>
          <View style={styles.systemRow}>
            <Text style={styles.systemLabel}>Backend API Target</Text>
            <Text style={styles.systemVal} numberOfLines={1}>{getApiBaseUrl()}</Text>
          </View>
          <View style={styles.systemRow}>
            <Text style={styles.systemLabel}>API Health Status</Text>
            <Badge
              label={backendHealth.toUpperCase()}
              variant={backendHealth === 'connected' ? 'green' : 'error'}
            />
          </View>
          <View style={styles.systemRow}>
            <Text style={styles.systemLabel}>Client App Version</Text>
            <Text style={styles.systemVal}>Bruno Mobile v1.0.0 (Expo SDK 58)</Text>
          </View>
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="secondary"
          size="lg"
          style={styles.logoutBtn}
        />
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    backgroundColor: Colors.coachOrangeSubtle,
    borderWidth: 2,
    borderColor: Colors.coachOrange,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.slateBody,
    marginTop: 2,
  },
  roleRow: {
    marginTop: 6,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 18,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.slateBody,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textMuted,
    fontWeight: '300',
  },
  systemCard: {
    padding: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  systemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemLabel: {
    fontSize: 13,
    color: Colors.slateBody,
  },
  systemVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.charcoalDark,
    maxWidth: 180,
  },
  logoutBtn: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
});
