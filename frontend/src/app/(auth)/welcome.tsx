import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { BRUNO_IMAGES } from '../../constants/images';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Coach Badge Header */}
        <View style={styles.headerPill}>
          <Text style={styles.boltIcon}>⚡</Text>
          <Text style={styles.pillText}>YOUR 24/7 STRENGTH COACH</Text>
        </View>

        <Text style={styles.title}>Meet Bruno, your AI gym buddy</Text>
        <Text style={styles.subtitle}>
          Smart lifting telemetry, zero spreadsheet dread, and tailored real-time guidance every set.
        </Text>

        {/* 3D Bruno Mascot Hero Box */}
        <View style={styles.heroBox}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.versionPill}>
              <Text style={styles.versionText}>BRUNO v2.4</Text>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.greenPulse} />
              <Text style={styles.statusText}>READY TO LIFT</Text>
            </View>
          </View>

          <View style={styles.mascotContainer}>
            <Image
              source={BRUNO_IMAGES.WELCOME_HERO}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.quoteCard}>
            <View style={styles.quoteIconBox}>
              <Text style={styles.quoteIcon}>💬</Text>
            </View>
            <Text style={styles.quoteText}>
              “Chalk up, buddy! I'll build your equipment-tailored lifting cycle.”
            </Text>
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: Colors.technicalBlueSubtle }]}>
              <Text style={styles.featureEmoji}>⚙️</Text>
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Adaptive Equipment Logic</Text>
              <Text style={styles.featureDesc}>
                Tell me what to lift today based on your gear — commercial, garage gym, or just dumbbells.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: Colors.primarySubtle }]}>
              <Text style={styles.featureEmoji}>📈</Text>
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Frictionless Overload</Text>
              <Text style={styles.featureDesc}>
                Progressive overload without spreadsheet anxiety. Bruno auto-calculates micro-loads.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: Colors.coachOrangeSubtle }]}>
              <Text style={styles.featureEmoji}>🔄</Text>
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Crowded Gym Solver</Text>
              <Text style={styles.featureDesc}>
                1-Tap instant machine swaps when equipment is busy — matched to muscle recruitment curves.
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <Button
            title="Get Started (Create Account)"
            onPress={() => router.push('/(auth)/register')}
            variant="primary"
            size="lg"
            style={styles.button}
          />

          <Button
            title="I Already Have an Account — Log In"
            onPress={() => router.push('/(auth)/login')}
            variant="secondary"
            size="lg"
            style={styles.button}
          />

          <Text style={styles.legalNotice}>
            By continuing, you agree to Bruno’s Terms of Service and Privacy Policy.
          </Text>
        </View>
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
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.coachOrangeSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 4,
    marginBottom: Spacing.md,
  },
  boltIcon: {
    fontSize: 12,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.coachOrange,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.charcoalDark,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.slateBody,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: Spacing.base,
  },
  heroBox: {
    width: '100%',
    backgroundColor: Colors.canvasBase,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    alignItems: 'center',
    ...Shadows.card,
    marginBottom: Spacing.base,
  },
  heroHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  greenPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.charcoalDark,
  },
  versionPill: {
    backgroundColor: Colors.coachOrangeSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.coachOrange,
  },
  mascotContainer: {
    width: '100%',
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  quoteCard: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  quoteIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.coachOrangeSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteIcon: {
    fontSize: 14,
  },
  quoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.charcoalDark,
    fontWeight: '500',
  },
  featureList: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.canvasBase,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureEmoji: {
    fontSize: 18,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.slateBody,
    lineHeight: 18,
  },
  actionContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  button: {
    width: '100%',
  },
  legalNotice: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
