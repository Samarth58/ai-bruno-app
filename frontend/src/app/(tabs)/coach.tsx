import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { Header } from '../../components/ui/Header';
import { BRUNO_IMAGES } from '../../constants/images';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../services/api';
import type { CoachBriefing, CoachWeeklyReview } from '../../types/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bruno';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'How do I calculate warmup sets for 25kg dumbbells?',
  'What if the incline benches are taken today?',
  'Should I take a deload week next week?',
  'Check my weekly volume balance (MAV)',
  'My shoulders feel tight today from overhead pressing',
];

export default function CoachScreen() {
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<CoachBriefing | null>(null);
  const [weeklyReview, setWeeklyReview] = useState<CoachWeeklyReview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial welcome greeting from Bruno
    const initialMsg: ChatMessage = {
      id: 'init-1',
      sender: 'bruno',
      text: `Hey ${user?.name ? user.name.split(' ')[0] : 'buddy'}! I'm Bruno, your AI strength coach. I track your gym equipment, joint constraints, and recovery telemetry to keep your progressive overload optimal. What are we tackling today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([initialMsg]);

    // Fetch live coaching briefing & review
    async function loadCoachData() {
      try {
        const [bData, rData] = await Promise.allSettled([
          api.coach.getBriefing(),
          api.coach.getWeeklyReview(),
        ]);
        if (bData.status === 'fulfilled') setBriefing(bData.value);
        if (rData.status === 'fulfilled') setWeeklyReview(rData.value);
      } catch {
        // Safe to ignore non-blocking
      }
    }
    loadCoachData();
  }, [user]);

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.coach.chat(text);
      const brunoMsg: ChatMessage = {
        id: `bruno-${Date.now()}`,
        sender: 'bruno',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, brunoMsg]);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Bruno is momentarily catching his breath. Please try again.');
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Coach Bruno"
        subtitle="24/7 AI Mentorship"
        rightAction={<Badge label="AI ONLINE" variant="green" />}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        {/* Weekly Verdict / Briefing Card */}
        {weeklyReview ? (
          <View style={styles.reviewBanner}>
            <View style={styles.reviewIconBox}>
              <Text style={styles.reviewEmoji}>📊</Text>
            </View>
            <View style={styles.reviewTextCol}>
              <Text style={styles.reviewTitle}>WEEKLY VERDICT: {weeklyReview.verdict}</Text>
              <Text style={styles.reviewDesc}>
                {weeklyReview.completedWorkouts}/{weeklyReview.targetWorkouts} workouts done • {Math.round(weeklyReview.totalTonnageKg)} kg tonnage • Recovery: {weeklyReview.systemicRecoveryState}
              </Text>
            </View>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={{ paddingHorizontal: Spacing.base }}>
            <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          </View>
        ) : null}

        {/* Chat Message Stream */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => {
            const isBruno = item.sender === 'bruno';
            return (
              <View
                style={[
                  styles.messageRow,
                  isBruno ? styles.messageRowBruno : styles.messageRowUser,
                ]}>
                {isBruno ? (
                  <View style={styles.brunoAvatarWrapper}>
                    <Image
                      source={BRUNO_IMAGES.LOGIN_BRUNO}
                      style={styles.brunoAvatar}
                    />
                  </View>
                ) : null}

                <View
                  style={[
                    styles.bubble,
                    isBruno ? styles.bubbleBruno : styles.bubbleUser,
                  ]}>
                  {isBruno ? (
                    <Text style={styles.senderLabel}>BRUNO</Text>
                  ) : null}
                  <Text
                    style={[
                      styles.bubbleText,
                      isBruno ? styles.bubbleTextBruno : styles.bubbleTextUser,
                    ]}>
                    {item.text}
                  </Text>
                  <Text
                    style={[
                      styles.timestampText,
                      isBruno ? styles.timestampBruno : styles.timestampUser,
                    ]}>
                    {item.timestamp}
                  </Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            loading ? (
              <View style={styles.typingIndicator}>
                <View style={styles.brunoAvatarWrapper}>
                  <Image
                    source={require('@/assets/images/bruno-coach-avatar.png')}
                    style={styles.brunoAvatar}
                  />
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={Colors.coachOrange} />
                  <Text style={styles.typingText}>Bruno is analyzing your telemetry...</Text>
                </View>
              </View>
            ) : undefined
          }
        />

        {/* Quick Prompt Suggestions */}
        <View style={styles.quickPromptsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsScroll}>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <Pressable
                key={idx}
                onPress={() => sendMessage(prompt)}
                style={styles.promptPill}>
                <Text style={styles.promptText}>⚡ {prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Chat Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            placeholder="Ask Bruno about sets, form, swaps, or recovery..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            style={styles.textInput}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || loading}
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled,
            ]}>
            <Text style={styles.sendIcon}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  reviewIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.technicalBlueSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewEmoji: {
    fontSize: 16,
  },
  reviewTextCol: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.technicalBlue,
    letterSpacing: 0.5,
  },
  reviewDesc: {
    fontSize: 12,
    color: Colors.slateBody,
  },
  messageList: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  messageRowBruno: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  brunoAvatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    backgroundColor: Colors.coachOrangeSubtle,
    borderWidth: 1,
    borderColor: Colors.coachOrange,
  },
  brunoAvatar: {
    width: '100%',
    height: '100%',
  },
  bubble: {
    maxWidth: '82%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  bubbleBruno: {
    backgroundColor: Colors.canvasBase,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: BorderRadius.xs,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: BorderRadius.xs,
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.coachOrange,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextBruno: {
    color: Colors.charcoalDark,
  },
  bubbleTextUser: {
    color: '#FFF',
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timestampBruno: {
    color: Colors.textMuted,
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasBase,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  typingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  quickPromptsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.canvasBase,
    paddingVertical: Spacing.sm,
  },
  promptsScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  promptPill: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  promptText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slateBody,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.canvasBase,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.charcoalDark,
    maxHeight: 90,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 2,
  },
});
