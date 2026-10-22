import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { api, ApiError } from '../services/api';
import type { Exercise } from '../types/api';

const MUSCLE_FILTERS = [
  'All',
  'Chest',
  'Back',
  'Quads',
  'Hamstrings',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Core',
];

export default function ExercisesScreen() {
  const router = useRouter();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadExercises = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.exercises.list({
        search: search.trim() || undefined,
        primaryMuscleGroup: selectedMuscle !== 'All' ? selectedMuscle.toLowerCase() : undefined,
      });
      setExercises(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load exercises.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, [selectedMuscle]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Exercise Catalog"
        subtitle="Exercise Library"
        showBack
        onBack={() => router.back()}
      />

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search exercise by name or equipment..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={loadExercises}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {search ? (
            <Pressable onPress={() => { setSearch(''); loadExercises(); }}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={MUSCLE_FILTERS}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.filterScroll}
            renderItem={({ item }) => {
              const isSelected = selectedMuscle === item;
              return (
                <Pressable
                  onPress={() => setSelectedMuscle(item)}
                  style={[styles.filterPill, isSelected && styles.filterPillActive]}>
                  <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Exercise List */}
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Filtering exercise library...</Text>
          </View>
        ) : exercises.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Exercises Found</Text>
            <Text style={styles.emptyDesc}>Try adjusting your search terms or filter selection.</Text>
          </View>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card style={styles.exerciseCard}>
                <View style={styles.cardTop}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Badge
                    label={item.primaryMuscleGroup}
                    variant="green"
                  />
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Pattern:</Text>
                  <Text style={styles.metaVal}>{item.movementPattern.replace(/_/g, ' ')}</Text>
                </View>

                {item.equipmentNeeded && item.equipmentNeeded.length > 0 ? (
                  <View style={styles.equipRow}>
                    <Text style={styles.metaLabel}>Gear:</Text>
                    <Text style={styles.equipText}>{item.equipmentNeeded.join(', ')}</Text>
                  </View>
                ) : null}
              </Card>
            )}
          />
        )}
      </View>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvasBase,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 46,
    gap: Spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.charcoalDark,
  },
  clearIcon: {
    fontSize: 14,
    color: Colors.textMuted,
    padding: 4,
  },
  filterRow: {
    marginBottom: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.canvasBase,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slateBody,
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  loaderBox: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loaderText: {
    fontSize: 14,
    color: Colors.slateBody,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.charcoalDark,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.slateBody,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  exerciseCard: {
    padding: Spacing.base,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.charcoalDark,
    flex: 1,
    marginRight: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  metaVal: {
    fontSize: 12,
    color: Colors.slateBody,
  },
  equipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  equipText: {
    fontSize: 12,
    color: Colors.technicalBlue,
    fontWeight: '500',
  },
});
