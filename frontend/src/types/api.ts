/**
 * Bruno AI Gym Buddy — TypeScript API Contract Types
 * Directly reflects the Fastify backend domain schemas
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  createdAt?: string;
}

export interface AuthTokens {
  token?: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface GymProfile {
  id: string;
  userId: string;
  name: string;
  environmentType: 'commercial' | 'apartment' | 'home' | 'other';
  maxDumbbellWeightKg: number | null;
  hasBarbell: boolean;
  hasSquatRack: boolean;
  hasBench: boolean;
  hasCableStack: boolean;
  hasSmithMachine: boolean;
  hasPullupBar: boolean;
  hasAdjustableBench: boolean;
  hasDumbbells: boolean;
  isDefault: boolean;
  createdAt?: string;
}

export interface CreateGymProfileInput {
  name: string;
  environmentType?: 'commercial' | 'apartment' | 'home' | 'other';
  maxDumbbellWeightKg?: number | null;
  hasBarbell?: boolean;
  hasSquatRack?: boolean;
  hasBench?: boolean;
  hasCableStack?: boolean;
  hasSmithMachine?: boolean;
  hasPullupBar?: boolean;
  hasAdjustableBench?: boolean;
  hasDumbbells?: boolean;
  isDefault?: boolean;
}

export type UpdateGymProfileInput = Partial<CreateGymProfileInput>;

export interface UserConstraint {
  id: string;
  userId: string;
  jointArea: string;
  restrictionType: string;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateConstraintInput {
  jointArea: string;
  restrictionType?: string;
  notes?: string | null;
  isActive?: boolean;
}

export type UpdateConstraintInput = Partial<CreateConstraintInput>;

export interface Exercise {
  id: string;
  name: string;
  primaryMuscleGroup: string;
  movementPattern: string;
  secondaryMuscleGroups?: string[];
  equipmentNeeded?: string[];
  notes?: string | null;
  isActive?: boolean;
}

export interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: string;
  orderIndex: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRpe: number;
  restPeriodSeconds?: number;
  exercise?: Exercise;
}

export interface WorkoutRoutine {
  id: string;
  programId: string;
  name: string;
  dayNumber: number;
  description?: string | null;
  exercises?: RoutineExercise[];
}

export interface WorkoutProgram {
  id: string;
  userId: string;
  name: string;
  splitType: 'push_pull_legs' | 'upper_lower' | 'full_body';
  trainingDaysPerWeek: number;
  durationWeeks: number;
  currentWeek: number;
  targetSessionDurationMinutes: number;
  gymProfileId: string | null;
  isActive: boolean;
  createdAt?: string;
  routines?: WorkoutRoutine[];
}

export interface GenerateProgramInput {
  name?: string;
  splitType: 'push_pull_legs' | 'upper_lower' | 'full_body';
  trainingDaysPerWeek: number;
  durationWeeks: number;
  targetSessionDurationMinutes: number;
  gymProfileId?: string | null;
  goal?: 'hypertrophy' | 'strength' | 'endurance';
  baselineLifts?: {
    benchPress1rmKg?: number;
    squat1rmKg?: number;
    deadlift1rmKg?: number;
    overheadPress1rmKg?: number;
  };
}

export interface WorkoutSetLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  actualWeightKg: number;
  actualReps: number;
  rpe: number | null;
  isWarmup: boolean;
  targetWeightKg?: number | null;
  targetReps?: number | null;
  targetHit?: boolean;
  createdAt?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  routineId: string | null;
  status: 'in_progress' | 'completed' | 'cancelled';
  startedAt: string;
  completedAt: string | null;
  perceivedRpe: number | null;
  jointSoreness: number | null;
  notes: string | null;
  routine?: WorkoutRoutine | null;
  sets?: WorkoutSetLog[];
}

export interface LogSetInput {
  exerciseId: string;
  routineExerciseId?: string | null;
  setNumber: number;
  actualWeightKg: number;
  actualReps: number;
  rpe?: number | null;
  isWarmup?: boolean;
  targetWeightKg?: number | null;
  targetReps?: number | null;
  targetHit?: boolean;
}

export interface FinishSessionInput {
  perceivedRpe?: number | null;
  jointSoreness?: number | null;
  notes?: string;
  completedAt?: string;
}

export interface CoachBriefing {
  todayRoutine?: {
    id: string;
    name: string;
    exerciseCount: number;
    targetDurationMinutes: number;
    targetRpe: number;
  } | null;
  cnsReadinessPercent: number;
  coachingTip: string;
  activeStreakWeeks: number;
  completedSessionsThisWeek: number;
  targetSessionsThisWeek: number;
}

export interface CoachWeeklyReview {
  calendarWeekStart: string;
  calendarWeekEnd: string;
  completedWorkouts: number;
  targetWorkouts: number;
  totalWorkingSets: number;
  totalTonnageKg: number;
  adherencePercentage: number;
  verdict: string;
  systemicRecoveryState: string;
}

export interface MascotState {
  state: 'approving_nod' | 'studying_journal' | 'waiting_with_watch';
  message: string;
  context: {
    adherenceRate: number;
    daysSinceLastWorkout: number;
  };
}

export interface MobileProgress {
  totalCompletedSessions: number;
  currentWeekWorkoutCount: number;
  activeProgramName: string | null;
  totalVolumeKg: number;
  totalReps: number;
  streakWeeks: number;
  cnsReadinessPercent: number;
  muscleDistribution: Array<{
    muscleGroup: string;
    volumeKg: number;
    percentage: number;
  }>;
}

export interface SwapAlternativeExercise {
  exercise: Exercise;
  movementCompatibility: number;
  equipmentReady: boolean;
  rationale: string;
}
