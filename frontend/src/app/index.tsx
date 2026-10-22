import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function IndexGate() {
  const { isAuthenticated, isLoading, isOnboardingCompleted } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.mascotCircle}>
          <Image
            source={require('@/assets/images/bruno-coach-avatar.png')}
            style={styles.mascotImg}
          />
        </View>
        <Text style={styles.brandTitle}>Bruno AI Gym Buddy</Text>
        <Text style={styles.brandSubtitle}>Intelligent Telemetry & Biomechanical Coaching</Text>
        <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (isAuthenticated) {
    if (isOnboardingCompleted === false) {
      return <Redirect href="/onboarding" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  mascotCircle: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    backgroundColor: Colors.coachOrangeSubtle,
    borderWidth: 2.5,
    borderColor: Colors.coachOrange,
    marginBottom: Spacing.base,
  },
  mascotImg: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.slateBody,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  loader: {
    marginTop: Spacing.xl,
  },
});
