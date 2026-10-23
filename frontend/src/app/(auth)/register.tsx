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
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await register(email.trim(), password, name.trim());
      router.replace('/onboarding');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to create account. Please try again.');
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Coach Bruno Welcome Unit */}
          <View style={styles.coachWelcomeCard}>
            <View style={styles.avatarWrapper}>
              <Image
                source={BRUNO_IMAGES.SIGNUP_BRUNO}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeIcon}>📋</Text>
              </View>
            </View>
            <View style={styles.speechCol}>
              <View style={styles.coachHeaderRow}>
                <Text style={styles.coachName}>COACH BRUNO</Text>
                <View style={styles.greenPulse} />
              </View>
              <Text style={styles.coachSpeech}>
                “Every legend started with an empty bar. Let's get your profile dialed in.”
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Join the Rack</Text>
              <Text style={styles.subtitle}>
                Step 01: Identity — Build your biomechanical strength profile.
              </Text>
            </View>

            {errorMessage ? (
              <ErrorBanner
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            <Input
              label="Full Name"
              placeholder="e.g. Alex Henderson"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />

            <Input
              label="Email Address"
              placeholder="e.g. alex@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label="Password (min. 8 characters)"
              placeholder="Create a secure password"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              variant="primary"
              size="lg"
              style={styles.registerButton}
            />
          </Card>

          {/* Switch to Login */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already lifting with Bruno?</Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Log in</Text>
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
  formCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  registerButton: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: Colors.slateBody,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
