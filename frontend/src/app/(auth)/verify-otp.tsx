import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { BorderRadius, Colors, Spacing } from '../../constants/theme';
import { api, ApiError } from '../../services/api';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async () => {
    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('Please enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.auth.verifyResetOtp(email, cleanOtp);
      router.push({
        pathname: '/(auth)/reset-password',
        params: { resetToken: res.resetToken },
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Invalid or expired verification code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setErrorMessage(null);
    try {
      await api.auth.resendResetOtp(email);
      setInfoMessage('A fresh verification code was sent to your email.');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to resend code. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>STEP 2 OF 3</Text>
            </View>
            <Text style={styles.title}>Enter 6-Digit Code</Text>
            <Text style={styles.subtitle}>
              We sent a verification code to <Text style={styles.emailHighlight}>{email || 'your email'}</Text>.
            </Text>
          </View>

          {/* Form Card */}
          <Card style={styles.card}>
            {errorMessage ? (
              <ErrorBanner
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {infoMessage ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>✓ {infoMessage}</Text>
              </View>
            ) : null}

            <Input
              label="6-Digit OTP"
              placeholder="e.g. 123456"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />

            <Button
              title="Verify Code"
              onPress={handleVerify}
              loading={loading}
              variant="primary"
              size="lg"
              style={styles.button}
            />

            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn't receive the code?</Text>
              <Pressable onPress={handleResend} disabled={resending}>
                <Text style={styles.resendLink}>
                  {resending ? 'Sending...' : 'Resend Code'}
                </Text>
              </Pressable>
            </View>
          </Card>

          <View style={styles.footer}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>← Back</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  badgePill: {
    backgroundColor: Colors.technicalBlueSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.technicalBlue,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.slateBody,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  emailHighlight: {
    color: Colors.charcoalDark,
    fontWeight: '700',
  },
  card: {
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  infoBox: {
    backgroundColor: Colors.primarySubtle,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    marginTop: Spacing.xs,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.lg,
  },
  resendLabel: {
    fontSize: 13,
    color: Colors.slateBody,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  footer: {
    alignItems: 'center',
  },
  backLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slateBody,
  },
});
