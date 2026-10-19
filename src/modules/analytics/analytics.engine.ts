/**
 * Mathematical models, 1RM estimations, and date-aggregation logic for lifter analytics.
 */

// ---------------------------------------------------------------------------
// Date & Time Boundary Helpers (UTC Consistent)
// ---------------------------------------------------------------------------

/**
 * Returns the Monday 00:00:00.000 UTC of the given date's calendar week.
 */
export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d.getTime());
  const day = date.getUTCDay();
  // In JS getUTCDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  // Diff to Monday: if day is 0 (Sunday), diff is -6 days; otherwise 1 - day
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * Returns the Sunday 23:59:59.999 UTC of the given date's calendar week.
 */
export function getSundayOfWeek(d: Date): Date {
  const monday = getMondayOfWeek(d);
  const sunday = new Date(monday.getTime());
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday;
}

// ---------------------------------------------------------------------------
// 1-Rep Maximum (1RM) Formulas
// ---------------------------------------------------------------------------

/**
 * Estimates 1-Rep Maximum based on submaximal load and completed repetitions.
 * Supports standard Epley and Brzycki equations.
 * Note: Formula accuracy degrades beyond 15–20 repetitions.
 */
export function calculateEstimated1rm(
  weightKg: number,
  reps: number,
  formula: 'epley' | 'brzycki' = 'epley',
): number {
  if (weightKg <= 0 || reps <= 0) {
    return 0;
  }

  // Exact single rep is the actual 1RM
  if (reps === 1) {
    return Math.round(weightKg * 10) / 10;
  }

  let raw1rm = 0;

  if (formula === 'brzycki') {
    // Brzycki: weight / (1.0278 - (0.0278 * reps))
    const denominator = 1.0278 - 0.0278 * reps;
    if (denominator <= 0.1) {
      raw1rm = weightKg * (1 + reps / 30);
    } else {
      raw1rm = weightKg / denominator;
    }
  } else {
    // Epley: weight * (1 + (reps / 30))
    raw1rm = weightKg * (1 + reps / 30);
  }

  // Round to nearest 0.5 kg for realistic gym plate increments
  return Math.round(raw1rm * 2) / 2;
}

// ---------------------------------------------------------------------------
// Consistency & Streak Calculations
// ---------------------------------------------------------------------------

export interface WeeklyConsistencyBucket {
  weekStartDate: string; // ISO date string (Monday)
  weekEndDate: string; // ISO date string (Sunday)
  completedWorkouts: number;
  targetWorkouts: number;
  consistencyPercentage: number;
}

export interface TrainingStreakSummary {
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  weeklyBuckets: WeeklyConsistencyBucket[];
  totalWorkoutsInWindow: number;
  averageWeeklyWorkouts: number;
}

/**
 * Calculates weekly workout counts and consecutive training-week streaks.
 * A week is considered active if at least 1 completed workout occurred.
 * The current streak remains alive if either the current week or the immediate
 * preceding week has active workouts.
 */
export function calculateTrainingStreaks(
  completedSessionDates: Date[],
  weeksBack = 8,
  targetWorkoutsPerWeek = 4,
): TrainingStreakSummary {
  const now = new Date();
  const currentWeekMonday = getMondayOfWeek(now);

  // Initialize weekly buckets from oldest to newest
  const weeklyBuckets: WeeklyConsistencyBucket[] = [];
  const weekStartMap = new Map<string, number>();

  for (let i = weeksBack - 1; i >= 0; i--) {
    const monday = new Date(currentWeekMonday.getTime());
    monday.setUTCDate(monday.getUTCDate() - i * 7);
    const sunday = getSundayOfWeek(monday);

    const key = monday.toISOString().split('T')[0];
    weekStartMap.set(key, 0);

    weeklyBuckets.push({
      weekStartDate: monday.toISOString().split('T')[0],
      weekEndDate: sunday.toISOString().split('T')[0],
      completedWorkouts: 0,
      targetWorkouts: targetWorkoutsPerWeek,
      consistencyPercentage: 0,
    });
  }

  // Count sessions into corresponding weekly buckets
  for (const sessionDate of completedSessionDates) {
    const sessionMonday = getMondayOfWeek(sessionDate);
    const key = sessionMonday.toISOString().split('T')[0];
    if (weekStartMap.has(key)) {
      weekStartMap.set(key, (weekStartMap.get(key) ?? 0) + 1);
    }
  }

  // Update buckets with counts and consistency percentages
  let totalWorkouts = 0;
  for (const bucket of weeklyBuckets) {
    const count = weekStartMap.get(bucket.weekStartDate) ?? 0;
    bucket.completedWorkouts = count;
    bucket.consistencyPercentage = Math.min(
      100,
      Math.round((count / bucket.targetWorkouts) * 100),
    );
    totalWorkouts += count;
  }

  // Calculate Streaks
  // Current streak backwards from current week
  let currentStreak = 0;
  const currentWeekCount = weeklyBuckets[weeklyBuckets.length - 1]?.completedWorkouts ?? 0;
  const previousWeekCount =
    weeklyBuckets.length > 1
      ? (weeklyBuckets[weeklyBuckets.length - 2]?.completedWorkouts ?? 0)
      : 0;

  // Determine starting index for current streak
  let startIndex = weeklyBuckets.length - 1;
  if (currentWeekCount === 0) {
    // If current week has 0 workouts yet, streak is still active if previous week was active
    if (previousWeekCount > 0) {
      startIndex = weeklyBuckets.length - 2;
    } else {
      startIndex = -1; // Streak broken
    }
  }

  if (startIndex >= 0) {
    for (let i = startIndex; i >= 0; i--) {
      if (weeklyBuckets[i].completedWorkouts > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak across all buckets
  let longestStreak = 0;
  let runningStreak = 0;
  for (const bucket of weeklyBuckets) {
    if (bucket.completedWorkouts > 0) {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  const averageWeeklyWorkouts =
    weeklyBuckets.length > 0
      ? Math.round((totalWorkouts / weeklyBuckets.length) * 10) / 10
      : 0;

  return {
    currentStreakWeeks: currentStreak,
    longestStreakWeeks: longestStreak,
    weeklyBuckets,
    totalWorkoutsInWindow: totalWorkouts,
    averageWeeklyWorkouts,
  };
}
