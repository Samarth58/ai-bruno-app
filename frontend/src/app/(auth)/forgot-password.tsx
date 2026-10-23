import { useRouter } from 'expo-router';
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your account email address');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await api.auth.forgotPassword(email.trim());
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email: email.trim() },
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to send reset code. Please verify your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Coach Bruno Recovery Unit */}
          <View style={styles.coachWelcomeCard}>
            <View style={styles.avatarWrapper}>
              <Image
                source={BRUNO_IMAGES.RECOVERY_BRUNO}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeIcon}>🔐</Text>
              </View>
            </View>
            <View style={styles.speechCol}>
              <View style={styles.coachHeaderRow}>
                <Text style={styles.coachName}>COACH BRUNO</Text>
                <View style={styles.greenPulse} />
              </View>
              <Text style={styles.coachSpeech}>
                “Lost the lock pin? Don’t sweat it. Drop your email and I’ll send a secure one-time code.”
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Recovery Pass</Text>
              <Text style={styles.subtitle}>
                Reset your credentials with Bruno's instant verification code.
              </Text>
            </View>

            {errorMessage ? (
              <ErrorBanner
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            <Input
              label="Account Email"
              placeholder="e.g. lifter@brunogym.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Button
              title="Send Verification Code"
              onPress={handleSubmit}
              loading={loading}
              variant="primary"
              size="lg"
              style={styles.button}
            />
          </Card>

          <View style={styles.footer}>
            <Pressable onPress={() => router.back()}>
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
});
