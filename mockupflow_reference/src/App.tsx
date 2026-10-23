import React, { useState } from 'react';
import { ScreenId, WorkoutSessionState, EquipmentState } from './types';
import { SplashScreen } from './components/screens/SplashScreen';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { SignUpScreen } from './components/screens/SignUpScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { RecoveryScreen } from './components/screens/RecoveryScreen';
import { OtpScreen } from './components/screens/OtpScreen';
import { CreatePasswordScreen } from './components/screens/CreatePasswordScreen';
import { PasswordSuccessScreen } from './components/screens/PasswordSuccessScreen';
import { EquipmentSetupScreen } from './components/screens/EquipmentSetupScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { ActiveWorkoutScreen } from './components/screens/ActiveWorkoutScreen';
import { WorkoutCompleteScreen } from './components/screens/WorkoutCompleteScreen';
import { WorkoutsTab } from './components/screens/WorkoutsTab';
import { ProgressTab } from './components/screens/ProgressTab';
import { AICoachTab } from './components/screens/AICoachTab';
import { ProfileTab } from './components/screens/ProfileTab';
import { BottomNav } from './components/BottomNav';
import { ScreenSwitcher } from './components/ScreenSwitcher';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');

  const [sessionState, setSessionState] = useState<WorkoutSessionState>({
    currentExerciseIndex: 0,
    exerciseName: 'Incline Dumbbell Bench Press',
    exerciseSubtitle: '30° Bench Angle • Clavicular Bias',
    activeSetNumber: 2,
    totalSets: 3,
    currentLoadKg: 25,
    currentReps: 9,
    completedSets: [
      { setNum: 1, load: '25 kg', reps: 10, rpe: 7.5 },
    ],
    restSecondsRemaining: 105,
    isRestActive: false,
    totalElapsedSeconds: 872,
    isAudioMuted: false,
    coachCue: 'Keep elbows tucked at 45°. Slow 3-second eccentric descent on every single rep—pack that upper chest!',
  });

  const [equipmentState, setEquipmentState] = useState<EquipmentState>({
    facilityType: 'commercial',
    hasBarbellRack: true,
    hasDualCable: true,
    hasDumbbells: true,
    maxDumbbellWeightKg: 40,
    hasSmithMachine: false,
    shoulderImpingementFlagged: true,
  });

  const showBottomNav = [
    'home',
    'workouts',
    'progress',
    'ai-coach',
    'profile',
  ].includes(currentScreen);

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0F172A] relative flex flex-col font-body selection:bg-[#DCFCE7] selection:text-[#15803D]">
      {/* Screen Quick-Switcher Bar to inspect any of the 12 screens */}
      <ScreenSwitcher
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
      />

      {/* Screen Render Switch */}
      {currentScreen === 'splash' && (
        <SplashScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'welcome' && (
        <WelcomeScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'signup' && (
        <SignUpScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'login' && (
        <LoginScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'recovery' && (
        <RecoveryScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'otp' && (
        <OtpScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'reset-password' && (
        <CreatePasswordScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'password-success' && (
        <PasswordSuccessScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'equipment-setup' && (
        <EquipmentSetupScreen
          onNavigate={setCurrentScreen}
          equipmentState={equipmentState}
          setEquipmentState={setEquipmentState}
        />
      )}

      {currentScreen === 'home' && (
        <HomeScreen onNavigate={setCurrentScreen} activeTab={currentScreen} />
      )}

      {currentScreen === 'active-workout' && (
        <ActiveWorkoutScreen
          onNavigate={setCurrentScreen}
          sessionState={sessionState}
          setSessionState={setSessionState}
        />
      )}

      {currentScreen === 'workout-complete' && (
        <WorkoutCompleteScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'workouts' && (
        <WorkoutsTab onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'progress' && (
        <ProgressTab onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'ai-coach' && (
        <AICoachTab onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'profile' && (
        <ProfileTab onNavigate={setCurrentScreen} equipmentState={equipmentState} />
      )}

      {/* Persistent Bottom Tab Navigation for core app tabs */}
      {showBottomNav && (
        <BottomNav activeScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
    </div>
  );
}
