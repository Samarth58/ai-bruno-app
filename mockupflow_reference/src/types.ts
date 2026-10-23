export type ScreenId =
  | 'splash'            // Screen 5: Telemetry v4.8 Loading / Splash
  | 'welcome'           // Screen 6: Meet Bruno Landing
  | 'signup'            // Screen 7: Join the Rack (Step 01 Identity)
  | 'login'             // Screen 8: Power Up (Sign In)
  | 'recovery'          // Screen 9: Recovery Pass (Forgot Password)
  | 'otp'               // Screen 10: Check your inbox (6-digit keypad)
  | 'reset-password'    // Screen 11: Create New Password
  | 'password-success'  // Screen 12: All Set & Locked In
  | 'equipment-setup'   // Screen 2: Step 4 of 10 Equipment Setup
  | 'home'              // Screen 1: Home Dashboard & Today's Workout
  | 'active-workout'    // Screen 3: Active Workout & Live Rest Timer
  | 'workout-complete'  // Screen 4: Crushed It Alex / Post-Workout Debrief
  | 'workouts'          // Workouts mesocycle tab
  | 'progress'          // Progress telemetry tab
  | 'ai-coach'          // AI Coach Bruno interactive chat
  | 'profile';          // Profile tab

export interface ExerciseItem {
  id: string;
  orderNumber: number;
  name: string;
  prescription: string;
  load: string;
  tag: string;
  tagColor?: string;
}

export interface ExerciseSwap {
  id: string;
  name: string;
  loadMatched: string;
  notes: string;
  image: string;
}

export interface WorkoutSessionState {
  currentExerciseIndex: number;
  exerciseName: string;
  exerciseSubtitle: string;
  activeSetNumber: number;
  totalSets: number;
  currentLoadKg: number;
  currentReps: number;
  completedSets: {
    setNum: number;
    load: string;
    reps: number;
    rpe: number;
  }[];
  restSecondsRemaining: number;
  isRestActive: boolean;
  totalElapsedSeconds: number;
  isAudioMuted: boolean;
  coachCue: string;
}

export interface EquipmentState {
  facilityType: 'commercial' | 'apartment' | 'garage';
  hasBarbellRack: boolean;
  hasDualCable: boolean;
  hasDumbbells: boolean;
  maxDumbbellWeightKg: number;
  hasSmithMachine: boolean;
  shoulderImpingementFlagged: boolean;
}
