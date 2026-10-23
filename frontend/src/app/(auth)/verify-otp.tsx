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
          {/* Coach Bruno OTP Unit */}
          <View style={styles.coachWelcomeCard}>
            <View style={styles.avatarWrapper}>
              <Image
                source={BRUNO_IMAGES.OTP_BRUNO}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeIcon}>📨</Text>
              </View>
            </View>
            <View style={styles.speechCol}>
              <View style={styles.coachHeaderRow}>
                <Text style={styles.coachName}>COACH BRUNO</Text>
                <View style={styles.greenPulse} />
              </View>
              <Text style={styles.coachSpeech}>
                “Check your inbox! 6-digit pin dispatched to your email.”
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Check your inbox</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit verification code to <Text style={styles.emailHighlight}>{email || 'your email'}</Text>.
              </Text>
            </View>
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
