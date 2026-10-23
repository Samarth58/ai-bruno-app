import React, { useState, useEffect } from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId, WorkoutSessionState } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
  sessionState: WorkoutSessionState;
  setSessionState: React.Dispatch<React.SetStateAction<WorkoutSessionState>>;
}

export const ActiveWorkoutScreen: React.FC<Props> = ({
  onNavigate,
  sessionState,
  setSessionState,
}) => {
  const [sessionSeconds, setSessionSeconds] = useState(sessionState.totalElapsedSeconds || 872);
  const [restSeconds, setRestSeconds] = useState(105);
  const [isResting, setIsResting] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(true);
  const [loggedSet2, setLoggedSet2] = useState(false);
  const [swapToast, setSwapToast] = useState<string | null>(null);

  // Workout Session Running Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rest Countdown Timer
  useEffect(() => {
    if (!isResting || restSeconds <= 0) return;
    const timer = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isResting, restSeconds]);

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const adjustLoad = (delta: number) => {
    setSessionState((prev) => ({
      ...prev,
      currentLoadKg: Math.max(2, prev.currentLoadKg + delta),
    }));
  };

  const adjustReps = (delta: number) => {
    setSessionState((prev) => ({
      ...prev,
      currentReps: Math.max(1, prev.currentReps + delta),
    }));
  };

  const logCurrentSet = () => {
    setLoggedSet2(true);
    setIsResting(true);
    setRestSeconds(120);
    setSessionState((prev) => ({
      ...prev,
      coachCue: "Terrific tempo! Take your 2 minutes. Hydrate and get your mind ready for set 3.",
    }));
  };

  const addRestTime = (seconds: number) => {
    setRestSeconds((prev) => prev + seconds);
    setIsResting(true);
  };

  const skipRest = () => {
    setRestSeconds(0);
    setIsResting(false);
  };

  const handleSwap = (name: string, matchedLoad: string, cueText: string) => {
    setSessionState((prev) => ({
      ...prev,
      exerciseName: name,
      coachCue: cueText,
    }));
    setSwapToast(`Swapped to ${name} (${matchedLoad})!`);
    setTimeout(() => setSwapToast(null), 3000);
  };

  const restPercent = Math.max(0, Math.min(100, (restSeconds / 120) * 100));

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0F172A] font-body flex flex-col justify-between max-w-md mx-auto relative select-none">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#f8f9ff]/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#E2E8F0]">
        <div className="h-16 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              aria-label="Go back"
              className="w-11 h-11 flex items-center justify-center rounded-full text-[#0F172A] hover:bg-[#dce9ff] transition-colors -ml-2"
              onClick={() => onNavigate('home')}
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-heading text-lg font-bold text-[#0F172A] truncate">
              Active Workout
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border-2 border-[#16A34A]"
              src={IMAGES.ALEX_PROFILE}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/aistudio/Image_5_f7348416.png';
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-8 bg-[#f8f9ff]">
        <div className="flex flex-col w-full px-4 pt-2 pb-6 space-y-4">
          {/* Session Status & Live Telemetry Bar */}
          <div className="flex items-center justify-between bg-[#eff4ff] px-3.5 py-2.5 rounded-xl border border-[#dce9ff]">
            <div className="flex items-center space-x-2">
              <span className="inline-flex w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse"></span>
              <span className="font-heading text-[10px] text-[#334155] uppercase tracking-wider font-bold">
                Active Session • 1 of 4 Exercises
              </span>
            </div>
            <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-full shadow-sm border border-[#E2E8F0]">
              <span className="material-symbols-outlined text-[16px] text-[#0284C7]">timer</span>
              <span className="font-heading text-xs text-[#0F172A] font-bold tabular-nums">
                {formatTime(sessionSeconds)}
              </span>
            </div>
          </div>

          {/* Coach Bruno Audio Prompt Card */}
          <div className="relative bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] overflow-hidden flex flex-col space-y-2">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#EA580C]"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10 rounded-full bg-[#FFEDD5] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#FED7AA]">
                  <img
                    className="w-full h-full object-cover"
                    alt="Coach Bruno portrait"
                    src={IMAGES.BRUNO_AVATAR_ROUND}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/aistudio/Image_5_f7348416.png';
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-heading text-xs font-bold text-[#0F172A]">Coach Bruno</span>
                    <span className="bg-[#FFEDD5] text-[#EA580C] font-heading text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      LIVE CUE
                    </span>
                  </div>
                  <span className="font-body text-[11px] text-[#334155]">Real-time biomechanic pacing</span>
                </div>
              </div>

              {/* Audio Pacing Visualizer */}
              <button
                onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#eff4ff] hover:bg-[#dce9ff] rounded-full transition-colors"
                title={isAudioPlaying ? 'Mute audio cue' : 'Unmute audio cue'}
              >
                <span
                  className="material-symbols-outlined text-[16px] text-[#EA580C]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isAudioPlaying ? 'volume_up' : 'volume_off'}
                </span>
                <div className="flex items-end space-x-0.5 h-3.5 w-7">
                  <span
                    className={`w-1 bg-[#EA580C] rounded-full transition-all ${
                      isAudioPlaying ? 'h-2 animate-bounce' : 'h-1'
                    }`}
                  ></span>
                  <span
                    className={`w-1 bg-[#EA580C] rounded-full transition-all ${
                      isAudioPlaying ? 'h-3.5 animate-bounce [animation-delay:0.15s]' : 'h-1'
                    }`}
                  ></span>
                  <span
                    className={`w-1 bg-[#EA580C] rounded-full transition-all ${
                      isAudioPlaying ? 'h-1.5 animate-bounce [animation-delay:0.3s]' : 'h-1'
                    }`}
                  ></span>
                </div>
              </button>
            </div>
            <p className="font-body text-xs text-[#0F172A] pt-1 leading-relaxed font-medium">
              “{sessionState.coachCue || "Keep elbows tucked at 45°. Slow 3-second eccentric descent on every single rep—pack that upper chest!"}”
            </p>
          </div>

          {/* Swap Toast if any */}
          {swapToast && (
            <div className="bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] px-3.5 py-2 rounded-xl font-heading text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">sync_alt</span>
              <span>{swapToast}</span>
            </div>
          )}

          {/* Primary Exercise Focus Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 mb-1">
                  <span className="bg-[#E0F2FE] text-[#0284C7] font-heading text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                    Clavicular Bias
                  </span>
                  <span className="bg-[#eff4ff] text-[#334155] font-heading text-[10px] px-2 py-0.5 rounded-full font-bold">
                    30° Bench Angle
                  </span>
                </div>
                <h2 className="font-heading text-xl font-bold text-[#0F172A] truncate">
                  {sessionState.exerciseName || "Incline Dumbbell Bench Press"}
                </h2>
              </div>
              <button
                aria-label="Exercise details"
                className="w-9 h-9 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#334155] hover:bg-[#dce9ff] transition-colors flex-shrink-0"
                type="button"
                onClick={() => onNavigate('ai-coach')}
              >
                <span className="material-symbols-outlined text-[20px]">info</span>
              </button>
            </div>

            {/* Set Logging Matrix */}
            <div className="space-y-2">
              {/* Set 1: Completed */}
              <div className="flex items-center justify-between p-2.5 bg-[#eff4ff] rounded-xl border border-[#dce9ff]">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-[#16A34A] flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading text-[10px] text-[#334155] uppercase font-bold">
                      Set 1 • Completed
                    </span>
                    <span className="font-heading text-sm text-[#0F172A] font-bold">
                      25 kg × 10 reps
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-md shadow-sm border border-[#E2E8F0]">
                  <span className="font-heading text-[10px] text-[#334155]">RPE</span>
                  <span className="font-heading text-xs text-[#16A34A] font-bold">7.5</span>
                </div>
              </div>

              {/* Set 2: Active Working Set */}
              <div className="flex flex-col p-4 bg-white rounded-2xl shadow-md border-2 border-[#16A34A] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-[#DCFCE7] text-[#16A34A] font-heading text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    <div>
                      <span className="font-heading text-[10px] text-[#EA580C] font-bold uppercase tracking-wide">
                        Active Working Set
                      </span>
                      <p className="font-heading text-lg font-bold text-[#0F172A]">Target: 8–10 Reps</p>
                    </div>
                  </div>
                  <div className="bg-[#FFEDD5] text-[#EA580C] px-2.5 py-1 rounded-full font-heading text-[10px] font-bold">
                    Target RPE 8.5
                  </div>
                </div>

                {/* Increment Controls for Weight and Reps */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center bg-[#eff4ff] p-3 rounded-xl border border-[#dce9ff]">
                    <span className="font-heading text-[10px] text-[#334155] font-bold mb-1">
                      LOAD (EACH DB)
                    </span>
                    <div className="flex items-center justify-between w-full">
                      <button
                        className="w-9 h-9 rounded-full bg-white shadow-sm border border-[#E2E8F0] flex items-center justify-center active:scale-95 transition-transform"
                        onClick={() => adjustLoad(-2)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#0F172A]">remove</span>
                      </button>
                      <div className="flex items-baseline space-x-0.5">
                        <span className="font-heading text-2xl text-[#0F172A] font-bold tabular-nums">
                          {sessionState.currentLoadKg}
                        </span>
                        <span className="font-body text-xs text-[#334155] font-semibold">kg</span>
                      </div>
                      <button
                        className="w-9 h-9 rounded-full bg-white shadow-sm border border-[#E2E8F0] flex items-center justify-center active:scale-95 transition-transform"
                        onClick={() => adjustLoad(2)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#0F172A]">add</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center bg-[#eff4ff] p-3 rounded-xl border border-[#dce9ff]">
                    <span className="font-heading text-[10px] text-[#334155] font-bold mb-1">
                      REPS COMPLETED
                    </span>
                    <div className="flex items-center justify-between w-full">
                      <button
                        className="w-9 h-9 rounded-full bg-white shadow-sm border border-[#E2E8F0] flex items-center justify-center active:scale-95 transition-transform"
                        onClick={() => adjustReps(-1)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#0F172A]">remove</span>
                      </button>
                      <span className="font-heading text-2xl text-[#0F172A] font-bold tabular-nums">
                        {sessionState.currentReps}
                      </span>
                      <button
                        className="w-9 h-9 rounded-full bg-white shadow-sm border border-[#E2E8F0] flex items-center justify-center active:scale-95 transition-transform"
                        onClick={() => adjustReps(1)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#0F172A]">add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Log Set CTA */}
                <button
                  className={`w-full h-[52px] text-white rounded-full font-heading text-sm font-semibold flex items-center justify-center space-x-2 shadow-md transition-all active:scale-[0.99] cursor-pointer ${
                    loggedSet2 ? 'bg-[#EA580C]' : 'bg-[#16A34A] hover:bg-[#15803D]'
                  }`}
                  onClick={logCurrentSet}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {loggedSet2 ? 'celebration' : 'check_circle'}
                  </span>
                  <span>
                    {loggedSet2 ? 'SAVED • REST STARTED!' : 'LOG SET 2 & START REST'}
                  </span>
                </button>
              </div>

              {/* Set 3: Upcoming */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#E2E8F0] opacity-70">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#565e74] font-heading text-xs font-bold">
                    3
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading text-[10px] text-[#565e74] uppercase font-bold">
                      Set 3 • Upcoming
                    </span>
                    <span className="font-heading text-xs text-[#565e74] font-semibold">
                      Target: 25 kg × 8–10 reps
                    </span>
                  </div>
                </div>
                <span className="font-heading text-[10px] text-[#565e74] bg-[#eff4ff] px-2 py-0.5 rounded font-bold">
                  RPE 9.0
                </span>
              </div>
            </div>
          </div>

          {/* Rest Countdown HUD Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-11 h-11 flex items-center justify-center">
                {/* SVG Progress Ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#e5eeff]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  ></path>
                  <path
                    className="text-[#16A34A] transition-all duration-500"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${restPercent}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  ></path>
                </svg>
                <span className="material-symbols-outlined absolute text-[18px] text-[#0F172A]">
                  snooze
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-[10px] text-[#565e74] uppercase font-bold">
                  Prescribed Inter-Set Rest
                </span>
                <span className="font-heading text-lg text-[#0F172A] font-bold tabular-nums">
                  {formatTime(restSeconds)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                className="px-3 py-1.5 bg-[#eff4ff] hover:bg-[#dce9ff] active:scale-95 rounded-full font-heading text-xs text-[#0F172A] font-bold transition-all"
                onClick={() => addRestTime(30)}
                type="button"
              >
                +30s
              </button>
              <button
                className="px-3 py-1.5 bg-[#dce9ff] hover:bg-[#cbdbf5] active:scale-95 rounded-full font-heading text-xs text-[#334155] font-bold transition-all"
                onClick={skipRest}
                type="button"
              >
                Skip
              </button>
            </div>
          </div>

          {/* Smart Biomechanical Swap Drawer */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="material-symbols-outlined text-[#EA580C] text-[22px]">swap_horiz</span>
                <h3 className="font-heading text-base font-bold text-[#0F172A]">
                  Equipment Busy? 1-Tap Swaps
                </h3>
              </div>
              <span className="bg-[#FFEDD5] text-[#EA580C] font-heading text-[10px] font-bold px-2 py-0.5 rounded-full">
                AI Matched
              </span>
            </div>
            <p className="font-body text-xs text-[#334155] leading-relaxed">
              Dumbbells or flat-to-incline benches occupied? Bruno calculated equivalent clavicular loading &amp; intensity curves:
            </p>

            {/* Swaps List */}
            <div className="space-y-2.5">
              {/* Alternate 1: Barbell Bench */}
              <div className="bg-[#eff4ff] p-2.5 rounded-xl border border-[#dce9ff] flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="w-12 h-12 rounded-lg bg-white flex-shrink-0 overflow-hidden shadow-sm border border-[#E2E8F0]">
                    <img
                      className="w-full h-full object-cover"
                      alt="Barbell Bench"
                      src={IMAGES.BARBELL_BENCH}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/aistudio/Image_5_f7348416.png';
                      }}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="font-heading text-xs font-bold text-[#0F172A] truncate">
                      Low-Incline Barbell Bench
                    </h4>
                    <div className="flex items-center space-x-1">
                      <span className="font-heading text-[10px] text-[#16A34A] font-bold">
                        Matched: 60 kg total
                      </span>
                      <span className="text-[#334155] text-[10px]">• 100% clavicular</span>
                    </div>
                  </div>
                </div>
                <button
                  className="h-9 px-3 rounded-full bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white font-heading text-[11px] font-bold flex items-center space-x-1 shadow-sm flex-shrink-0 transition-transform cursor-pointer"
                  onClick={() =>
                    handleSwap(
                      'Low-Incline Barbell Bench',
                      '60 kg total',
                      'Drive through your heels, flare slightly at the top, and maintain rigid thoracic extension!'
                    )
                  }
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                  <span>SWAP IN</span>
                </button>
              </div>

              {/* Alternate 2: Machine Incline Press */}
              <div className="bg-[#eff4ff] p-2.5 rounded-xl border border-[#dce9ff] flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="w-12 h-12 rounded-lg bg-white flex-shrink-0 overflow-hidden shadow-sm border border-[#E2E8F0]">
                    <img
                      className="w-full h-full object-cover"
                      alt="Machine Press"
                      src={IMAGES.MACHINE_INCLINE_PRESS}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/aistudio/Image_5_f7348416.png';
                      }}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="font-heading text-xs font-bold text-[#0F172A] truncate">
                      Machine Incline Chest Press
                    </h4>
                    <div className="flex items-center space-x-1">
                      <span className="font-heading text-[10px] text-[#16A34A] font-bold">
                        Matched: 35 kg/side
                      </span>
                      <span className="text-[#334155] text-[10px]">• Converging arc</span>
                    </div>
                  </div>
                </div>
                <button
                  className="h-9 px-3 rounded-full bg-[#dce9ff] hover:bg-[#cbdbf5] active:scale-95 text-[#0F172A] font-heading text-[11px] font-bold flex items-center space-x-1 flex-shrink-0 transition-transform cursor-pointer"
                  onClick={() =>
                    handleSwap(
                      'Machine Incline Chest Press',
                      '35 kg/side',
                      'Converging arc allows deep squeeze at the apex! Hold contraction for 1 second.'
                    )
                  }
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                  <span>SWAP IN</span>
                </button>
              </div>

              {/* Alternate 3: Weighted Dips */}
              <div className="bg-[#eff4ff] p-2.5 rounded-xl border border-[#dce9ff] flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="w-12 h-12 rounded-lg bg-white flex-shrink-0 overflow-hidden shadow-sm border border-[#E2E8F0]">
                    <img
                      className="w-full h-full object-cover"
                      alt="Weighted Dips"
                      src={IMAGES.WEIGHTED_DIPS}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/aistudio/Image_5_f7348416.png';
                      }}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="font-heading text-xs font-bold text-[#0F172A] truncate">
                      Weighted Neutral Dips
                    </h4>
                    <div className="flex items-center space-x-1">
                      <span className="font-heading text-[10px] text-[#16A34A] font-bold">
                        Matched: BW + 12.5 kg
                      </span>
                      <span className="text-[#334155] text-[10px]">• Forward lean</span>
                    </div>
                  </div>
                </div>
                <button
                  className="h-9 px-3 rounded-full bg-[#dce9ff] hover:bg-[#cbdbf5] active:scale-95 text-[#0F172A] font-heading text-[11px] font-bold flex items-center space-x-1 flex-shrink-0 transition-transform cursor-pointer"
                  onClick={() =>
                    handleSwap(
                      'Weighted Neutral Dips',
                      'BW + 12.5 kg',
                      'Lean your torso forward at 30° to target the lower & mid pec line with zero joint shear!'
                    )
                  }
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                  <span>SWAP IN</span>
                </button>
              </div>
            </div>
          </div>

          {/* End Session Action Footer */}
          <div className="pt-2">
            <button
              onClick={() => onNavigate('workout-complete')}
              className="w-full h-[52px] bg-[#0F172A] hover:bg-[#1e293b] active:scale-[0.99] text-white rounded-full font-heading text-sm font-semibold flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px] text-[#EA580C]">flag</span>
              <span>FINISH WORKOUT &amp; DEBRIEF WITH BRUNO</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
