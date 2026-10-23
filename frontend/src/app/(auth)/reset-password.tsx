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
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { Input } from '../../components/ui/Input';
import { BRUNO_IMAGES } from '../../constants/images';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';
import { api, ApiError } from '../../services/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ resetToken: string }>();
  const resetToken = params.resetToken || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = async () => {
    if (!resetToken) {
      setErrorMessage('Missing reset token. Please request a new verification code.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await api.auth.resetPassword(resetToken, newPassword, confirmPassword);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to reset password. The link or token may have expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successAvatarWrapper}>
            <Image
              source={BRUNO_IMAGES.PASSWORD_SUCCESS_BRUNO}
              style={styles.avatar}
              resizeMode="cover"
            />
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeIcon}>✓</Text>
            </View>
          </View>

          <Text style={styles.successTitle}>All Set & Locked In!</Text>
          <Text style={styles.successDesc}>
            Your credentials have been updated. Coach Bruno is ready to track your next session.
          </Text>
          <Button
            title="Return to Power Up"
            onPress={() => router.replace('/(auth)/login')}
            variant="primary"
            size="lg"
            style={styles.successButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Coach Bruno Create Password Unit */}
          <View style={styles.coachWelcomeCard}>
            <View style={styles.avatarWrapper}>
              <Image
                source={BRUNO_IMAGES.CREATE_PASSWORD_BRUNO}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeIcon}>🔒</Text>
              </View>
            </View>
            <View style={styles.speechCol}>
              <View style={styles.coachHeaderRow}>
                <Text style={styles.coachName}>COACH BRUNO</Text>
                <View style={styles.greenPulse} />
              </View>
              <Text style={styles.coachSpeech}>
                “Set a solid lock. Min 8 chars with an uppercase & symbol.”
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Create New Password</Text>
              <Text style={styles.subtitle}>
                Choose a strong password with at least 8 characters.
              </Text>
            </View>
            {errorMessage ? (
              <ErrorBanner
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            <Input
              label="New Password"
              placeholder="Minimum 8 characters"
              isPassword
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Input
              label="Confirm New Password"
              placeholder="Re-enter password"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Button
              title="Reset Password"
              onPress={handleReset}
              loading={loading}
              variant="primary"
              size="lg"
              style={styles.button}
            />
          </Card>

          <View style={styles.footer}>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.backLink}>← Back to Login</Text>
            </Pressable>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
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
    marginBottom: Spacing.lg,
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
  cardHeader: {
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.slateBody,
    lineHeight: 18,
  },
  card: {
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  button: {
    width: '100%',
    marginTop: Spacing.xs,
  },
  footer: {
    alignItems: 'center',
  },
  backLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slateBody,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  successAvatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    padding: 4,
    backgroundColor: Colors.primary,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 15,
    color: Colors.slateBody,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  successButton: {
    width: '100%',
  },
});
