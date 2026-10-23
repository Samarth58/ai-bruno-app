import React, { useState } from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const WorkoutCompleteScreen: React.FC<Props> = ({ onNavigate }) => {
  const [autoLogged, setAutoLogged] = useState(true);
  const [selectedDebriefChip, setSelectedDebriefChip] = useState<'strong' | 'failure' | 'struggled'>('strong');
  const [rpeValue, setRpeValue] = useState(8);
  const [jointValue, setJointValue] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  const getRpeFeedback = (val: number) => {
    if (val <= 5) return { label: 'Warmup Pace (RPE 1-5)', color: 'text-[#0284C7]' };
    if (val <= 8) return { label: 'Optimal Growth Band (RPE 7-8)', color: 'text-[#16A34A]' };
    return { label: 'Peak Exertion / Failure (RPE 9-10)', color: 'text-[#EA580C]' };
  };

  const getJointFeedback = (val: number) => {
    if (val <= 3) return { label: 'Fresh & Pain Free (Safe)', color: 'text-[#16A34A]' };
    if (val <= 6) return { label: 'Mild Tension Detected', color: 'text-[#0284C7]' };
    return { label: 'High Inflammation - Deload Advised', color: 'text-[#EA580C]' };
  };

  const handleFinish = () => {
    setIsFinishing(true);
    setTimeout(() => {
      setIsFinishing(false);
      onNavigate('home');
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0F172A] font-body flex flex-col justify-between max-w-md mx-auto relative select-none">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#f8f9ff]/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#E2E8F0]">
        <div className="h-16 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              aria-label="Go back"
              className="w-11 h-11 flex items-center justify-center rounded-full text-[#0F172A] hover:bg-[#dce9ff] transition-colors -ml-2"
              onClick={() => onNavigate('active-workout')}
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-heading text-lg font-bold text-[#0F172A] truncate">
              Workout Debrief
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border-2 border-[#16A34A]"
              src={IMAGES.ALEX_PROFILE}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/aistudio/Image_7_f542712c.png';
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-8 bg-[#f8f9ff]">
        <div className="flex flex-col w-full px-4 pt-2 pb-6 space-y-4">
          {/* Victory Celebration Header */}
          <div className="relative w-full rounded-2xl bg-[#eff4ff] overflow-hidden shadow-sm pt-5 px-4 pb-4 border border-[#dce9ff]">
            {/* Decorative Glows */}
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#FFEDD5] rounded-full blur-2xl pointer-events-none opacity-70"></div>
            <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-[#DCFCE7] rounded-full blur-2xl pointer-events-none opacity-60"></div>

            <div className="relative flex flex-col items-center text-center">
              {/* Mascot Bruno Render */}
              <div className="relative w-44 h-52 flex items-end justify-center mb-1">
                <img
                  alt="Coach Bruno Celebration"
                  className="w-full h-full object-contain drop-shadow-md z-10"
                  src={IMAGES.BRUNO_HERO_FULL}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/aistudio/Image_7_f542712c.png';
                  }}
                />
                {/* Floating Badges */}
                <div
                  className="absolute -left-2 top-4 bg-white shadow-md rounded-full px-2.5 py-1 flex items-center gap-1 z-20 animate-bounce border border-[#E2E8F0]"
                  style={{ animationDuration: '2.8s' }}
                >
                  <span
                    className="material-symbols-outlined text-[#EA580C] text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    military_tech
                  </span>
                  <span className="font-heading text-[10px] text-[#0F172A] font-bold uppercase">
                    PR Crusher
                  </span>
                </div>
                <div
                  className="absolute -right-2 top-12 bg-white shadow-md rounded-full px-2.5 py-1 flex items-center gap-1 z-20 animate-bounce border border-[#E2E8F0]"
                  style={{ animationDuration: '3.2s' }}
                >
                  <span
                    className="material-symbols-outlined text-[#16A34A] text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    workspace_premium
                  </span>
                  <span className="font-heading text-[10px] text-[#0F172A] font-bold uppercase">
                    18/18 Sets
                  </span>
                </div>
              </div>

              {/* Headline Celebration Text */}
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] mb-1">
                <span className="material-symbols-outlined text-[16px]">celebration</span>
                <span className="font-heading text-[10px] font-bold uppercase tracking-wider">
                  Workout Complete
                </span>
              </div>
              <h2 className="font-heading text-2xl font-bold text-[#0F172A] tracking-tight">
                CRUSHED IT, ALEX!
              </h2>
              <p className="font-body text-xs text-[#334155] mt-0.5">
                Upper Body Power A • Week 4 Cycle
              </p>

              {/* Telemetry Highlights Grid */}
              <div className="grid grid-cols-2 gap-3 w-full mt-4">
                <div className="bg-white rounded-xl p-3 flex flex-col items-center shadow-sm border border-[#E2E8F0]">
                  <div className="flex items-center gap-1 text-[#334155]">
                    <span className="material-symbols-outlined text-[16px] text-[#0284C7]">timer</span>
                    <span className="font-heading text-[10px] font-bold uppercase">Duration</span>
                  </div>
                  <span className="font-heading text-lg font-bold text-[#0F172A] mt-0.5">52 mins</span>
                </div>
                <div className="bg-white rounded-xl p-3 flex flex-col items-center shadow-sm border border-[#E2E8F0]">
                  <div className="flex items-center gap-1 text-[#334155]">
                    <span className="material-symbols-outlined text-[16px] text-[#16A34A]">fitness_center</span>
                    <span className="font-heading text-[10px] font-bold uppercase">Volume Lifted</span>
                  </div>
                  <span className="font-heading text-lg font-bold text-[#0F172A] mt-0.5">12,450 kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick 1-Tap Auto Logging Card */}
          <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] flex items-center justify-between gap-4">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 text-[#16A34A] mb-0.5">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span className="font-heading text-[10px] uppercase font-bold">Targets Maintained</span>
              </div>
              <h3 className="font-heading text-sm font-bold text-[#0F172A] truncate">
                Auto-Log Prescribed Sets
              </h3>
              <p className="font-body text-xs text-[#334155]">Confirm all 18 sets, reps &amp; auto-rest times</p>
            </div>
            <button
              aria-label="Confirm all sets"
              className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all ${
                autoLogged
                  ? 'bg-[#16A34A] text-white'
                  : 'bg-[#e5eeff] text-[#565e74]'
              }`}
              onClick={() => setAutoLogged(!autoLogged)}
              type="button"
            >
              <span className="material-symbols-outlined text-[26px]">
                {autoLogged ? 'check' : 'edit'}
              </span>
            </button>
          </div>

          {/* Conversational Post-Set Debrief with Bruno */}
          <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#EA580C]"></div>
            <div className="flex items-start gap-3 pl-1">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#FFEDD5] flex-shrink-0 flex items-center justify-center shadow-sm border border-[#FED7AA]">
                <img
                  alt="Coach Bruno Avatar"
                  className="w-10 h-10 object-cover"
                  src={IMAGES.BRUNO_AVATAR_ROUND}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/aistudio/Image_7_f542712c.png';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-xs text-[#EA580C] uppercase font-bold">
                    Coach Bruno
                  </span>
                  <span className="font-heading text-[10px] text-[#565e74] font-semibold">Just now</span>
                </div>
                <p className="font-body text-xs text-[#0F172A] mt-1 leading-snug font-medium">
                  "Tremendous grit today, Alex! You blasted through that top set on Incline Dumbbell Press. How did that final round feel?"
                </p>
              </div>
            </div>

            {/* Interactive Debrief Quick-Tap Chips */}
            <div className="mt-3.5 flex flex-wrap gap-2 pl-1">
              <button
                className={`px-3 py-2 rounded-full font-heading text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedDebriefChip === 'strong'
                    ? 'bg-[#16A34A] text-white font-bold'
                    : 'bg-[#eff4ff] text-[#334155] border border-[#dce9ff]'
                }`}
                onClick={() => setSelectedDebriefChip('strong')}
                type="button"
              >
                <span>💪</span>
                <span>Felt strong (RPE 7-8)</span>
              </button>

              <button
                className={`px-3 py-2 rounded-full font-heading text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedDebriefChip === 'failure'
                    ? 'bg-[#16A34A] text-white font-bold'
                    : 'bg-[#eff4ff] text-[#334155] border border-[#dce9ff]'
                }`}
                onClick={() => setSelectedDebriefChip('failure')}
                type="button"
              >
                <span>🔥</span>
                <span>Pushed to failure</span>
              </button>

              <button
                className={`px-3 py-2 rounded-full font-heading text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedDebriefChip === 'struggled'
                    ? 'bg-[#16A34A] text-white font-bold'
                    : 'bg-[#eff4ff] text-[#334155] border border-[#dce9ff]'
                }`}
                onClick={() => setSelectedDebriefChip('struggled')}
                type="button"
              >
                <span>⚡</span>
                <span>Struggled a bit</span>
              </button>
            </div>
          </div>

          {/* Tactile Biofeedback Sliders Module */}
          <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0284C7] text-[20px]">tune</span>
                <h3 className="font-heading text-sm font-bold text-[#0F172A]">Session Biofeedback</h3>
              </div>
              <span className="font-heading text-[10px] bg-[#E0F2FE] text-[#0284C7] px-2 py-0.5 rounded-full uppercase font-bold">
                Calibration
              </span>
            </div>

            {/* Effort / RPE Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-body text-xs text-[#334155] font-medium">Session Effort</span>
                <div className="flex items-center gap-1">
                  <span className={`font-heading text-lg font-bold ${getRpeFeedback(rpeValue).color}`}>
                    {rpeValue}
                  </span>
                  <span className="font-body text-xs text-[#565e74]">/ 10</span>
                </div>
              </div>
              <div className="relative w-full py-1">
                <input
                  className="w-full accent-[#16A34A] h-2 rounded-lg bg-[#e5eeff] appearance-none cursor-pointer"
                  max="10"
                  min="1"
                  step="1"
                  type="range"
                  value={rpeValue}
                  onChange={(e) => setRpeValue(parseInt(e.target.value, 10))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-heading text-[10px] text-[#565e74]">Warmup Pace</span>
                <span className={`font-heading text-[10px] font-bold ${getRpeFeedback(rpeValue).color}`}>
                  {getRpeFeedback(rpeValue).label}
                </span>
                <span className="font-heading text-[10px] text-[#565e74]">Max Out</span>
              </div>
            </div>

            {/* Joint & Soreness Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-body text-xs text-[#334155] font-medium">
                  Joint &amp; Tendon Soreness
                </span>
                <div className="flex items-center gap-1">
                  <span className={`font-heading text-lg font-bold ${getJointFeedback(jointValue).color}`}>
                    {jointValue}
                  </span>
                  <span className="font-body text-xs text-[#565e74]">/ 10</span>
                </div>
              </div>
              <div className="relative w-full py-1">
                <input
                  className="w-full accent-[#16A34A] h-2 rounded-lg bg-[#e5eeff] appearance-none cursor-pointer"
                  max="10"
                  min="1"
                  step="1"
                  type="range"
                  value={jointValue}
                  onChange={(e) => setJointValue(parseInt(e.target.value, 10))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-heading text-[10px] font-bold ${getJointFeedback(jointValue).color}`}>
                  {getJointFeedback(jointValue).label}
                </span>
                <span className="font-heading text-[10px] text-[#565e74]">Requires Deload</span>
              </div>
            </div>
          </div>

          {/* Bruno Progressive Overload Engine Card */}
          <div className="w-full bg-[#eff4ff] rounded-2xl p-4 shadow-sm border border-[#dce9ff] relative overflow-hidden">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#16A34A] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">trending_up</span>
                </div>
                <div>
                  <span className="font-heading text-[10px] text-[#16A34A] uppercase tracking-wider font-bold">
                    Progressive Overload Earned
                  </span>
                  <h4 className="font-heading text-sm font-bold text-[#0F172A] leading-tight">
                    +2.5 KG Next Session!
                  </h4>
                </div>
              </div>
              <span className="bg-[#DCFCE7] text-[#16A34A] font-heading text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                +10%
              </span>
            </div>

            <p className="font-body text-xs text-[#334155] mb-3 leading-relaxed">
              Target RPE was sub-9 across all working sets with crisp bar speed. Coach Bruno has automatically updated your next training block.
            </p>

            {/* Overload Comparison Metric Row */}
            <div className="bg-white rounded-xl p-3 flex items-center justify-around text-center shadow-sm border border-[#E2E8F0]">
              <div className="flex flex-col">
                <span className="font-heading text-[10px] text-[#565e74]">Today's Load</span>
                <span className="font-heading text-base text-[#0F172A] line-through decoration-[#565e74]/50 font-bold">
                  25.0 kg
                </span>
                <span className="font-body text-xs text-[#334155]">8 reps</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#16A34A]">
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-[10px] text-[#16A34A] font-bold">Next Target</span>
                <span className="font-heading text-base text-[#16A34A] font-bold">
                  27.5 kg
                </span>
                <span className="font-body text-xs text-[#334155]">8 reps</span>
              </div>
            </div>
          </div>

          {/* Primary Bottom Completion CTA */}
          <div className="w-full pt-1">
            <button
              className="w-full h-14 rounded-full bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-heading text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              onClick={handleFinish}
              type="button"
            >
              {isFinishing ? (
                <>
                  <span className="material-symbols-outlined text-[22px] animate-spin">refresh</span>
                  <span>Saving Progress...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    done_all
                  </span>
                  <span>Done • Rest Up with Bruno</span>
                </>
              )}
            </button>
            <p className="text-center font-body text-xs text-[#565e74] mt-2">
              Recovery timer set to 48 hours for Upper Body Power
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
