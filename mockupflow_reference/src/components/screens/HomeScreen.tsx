import React from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
  activeTab: string;
}

export const HomeScreen: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col w-full pb-28 pt-16 bg-[#f8f9ff]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#f8f9ff]/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#E2E8F0]">
        <div className="h-16 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#FFEDD5] flex items-center justify-center text-[#EA580C]">
              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-[#EA580C]">
                Bruno AI
              </span>
              <span className="font-heading text-xl font-bold tracking-tight text-[#0F172A]">
                Home
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFEDD5] text-[#EA580C] font-heading text-xs font-bold">
              <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
              <span>5d</span>
            </div>
            <button
              onClick={() => onNavigate('profile')}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#16A34A] focus:outline-none"
            >
              <img
                alt="Profile"
                className="w-full h-full object-cover"
                src={IMAGES.ALEX_PROFILE}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/Image_1_4e36ac8d.png';
                }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col w-full max-w-md mx-auto px-4 pt-2 pb-6 gap-4">
        {/* Coach Bruno Morning Briefing Bento Card */}
        <div className="w-full bg-white rounded-2xl shadow-sm p-4 flex flex-col relative overflow-hidden border border-[#E2E8F0]">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-[#EA580C]">
                  Coach Sync • Live
                </span>
              </div>
              <h2 className="font-heading text-xl font-bold text-[#0F172A] tracking-tight">
                Rise &amp; Grind, Alex!
              </h2>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A]">
              <span className="material-symbols-outlined text-[16px]">battery_charging_full</span>
              <span className="font-heading text-[10px] font-bold">CNS 95%</span>
            </div>
          </div>

          {/* Coach 3D Visual + Speech Container */}
          <div className="flex flex-row items-center gap-2.5 bg-[#eff4ff] rounded-xl p-3 relative border border-[#dce9ff]">
            <div className="relative w-28 h-36 shrink-0 rounded-lg overflow-hidden bg-[#FFEDD5] flex items-center justify-center">
              <img
                className="w-full h-full object-cover object-top"
                alt="Coach Bruno with clipboard"
                src={IMAGES.BRUNO_CLIPBOARD}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/Image_1_4e36ac8d.png';
                }}
              />
              <div className="absolute bottom-1 right-1 bg-[#0F172A]/80 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-heading font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px] text-[#EA580C]">menu_book</span>
                <span>Log</span>
              </div>
            </div>

            <div className="flex flex-col flex-1 min-w-0 justify-center">
              <div className="bg-white rounded-xl p-3 shadow-sm relative border border-[#E2E8F0]">
                {/* Speech Pointer Indicator */}
                <div className="absolute -left-1.5 top-5 w-3 h-3 bg-white rotate-45 transform pointer-events-none border-l border-b border-[#E2E8F0]"></div>
                <p className="font-body text-xs text-[#0F172A] leading-snug">
                  <span className="font-bold text-[#EA580C]">Upper Body Hypertrophy A</span> locked in. I bumped your Incline DB Press <span className="font-bold text-[#16A34A]">+2.5 kg</span> after that solid 8h deep sleep. Ready to dominate?
                </p>
                <div className="mt-2 flex items-center gap-1 text-[#334155] text-[11px] font-heading font-medium">
                  <span className="material-symbols-outlined text-[13px] text-[#0284C7]">tune</span>
                  <span>Micro-load auto-applied</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Hero Card: Today's Workout */}
        <div className="w-full bg-white rounded-2xl shadow-md p-4 flex flex-col gap-4 relative overflow-hidden border border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="font-heading text-[10px] uppercase tracking-wider text-[#334155] font-bold">
              Today's Workout
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] font-heading text-xs font-bold">
              Hypertrophy Cycle
            </span>
          </div>

          <div>
            <h1 className="font-heading text-2xl font-bold text-[#0F172A] tracking-tight">
              Upper Body Hypertrophy A
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-[#334155] font-body text-xs">
                <span className="material-symbols-outlined text-[16px] text-[#334155]">timer</span> 45 Min
              </span>
              <span className="text-[#334155]">•</span>
              <span className="inline-flex items-center gap-1 text-[#334155] font-body text-xs">
                <span className="material-symbols-outlined text-[16px] text-[#334155]">fitness_center</span> 12 Sets
              </span>
              <span className="text-[#334155]">•</span>
              <span className="inline-flex items-center gap-1 font-heading text-xs px-2 py-0.5 rounded-full bg-[#FFEDD5] text-[#EA580C] font-bold">
                Target RPE 8.0
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => onNavigate('active-workout')}
            className="w-full min-h-[52px] bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] transition-all text-white rounded-full font-heading text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-[#16A34A]/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_arrow
            </span>
            <span>START SCHEDULED LIFT (45 MIN)</span>
          </button>
        </div>

        {/* Weekly Workout Micro-Calendar */}
        <div className="w-full bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2 border border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs uppercase tracking-wider text-[#334155] font-bold">
              Weekly Cadence
            </span>
            <span className="font-heading text-xs text-[#16A34A] font-bold">
              2 / 4 Sessions Done
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {/* Mon */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#eff4ff]">
              <span className="font-heading text-[10px] text-[#334155] font-bold">M</span>
              <div className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
            </div>
            {/* Tue */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#eff4ff]">
              <span className="font-heading text-[10px] text-[#334155] font-bold">T</span>
              <div className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
            </div>
            {/* Wed (Today) */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#FFEDD5] border border-[#FED7AA]">
              <span className="font-heading text-[10px] font-bold text-[#EA580C]">W</span>
              <div className="w-6 h-6 rounded-full bg-[#EA580C] text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[16px]">fitness_center</span>
              </div>
            </div>
            {/* Thu (Rest) */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#eff4ff]/60 opacity-60">
              <span className="font-heading text-[10px] text-[#334155]">T</span>
              <div className="w-6 h-6 rounded-full bg-[#d3e4fe] text-[#565e74] flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">hotel</span>
              </div>
            </div>
            {/* Fri */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#eff4ff]">
              <span className="font-heading text-[10px] text-[#334155] font-bold">F</span>
              <div className="w-6 h-6 rounded-full bg-[#e5eeff] text-[#334155] flex items-center justify-center">
                <span className="font-heading text-[11px] font-bold">B</span>
              </div>
            </div>
            {/* Sat */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#eff4ff]">
              <span className="font-heading text-[10px] text-[#334155] font-bold">S</span>
              <div className="w-6 h-6 rounded-full bg-[#e5eeff] text-[#334155] flex items-center justify-center">
                <span className="font-heading text-[11px] font-bold">C</span>
              </div>
            </div>
            {/* Sun */}
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#eff4ff]/60 opacity-60">
              <span className="font-heading text-[10px] text-[#334155]">S</span>
              <div className="w-6 h-6 rounded-full bg-[#d3e4fe] text-[#565e74] flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">bedtime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Direct Set Balance Telemetry Card */}
        <div className="w-full bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2 border border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-[#0F172A]">Direct Set Balance</h3>
                <p className="font-body text-xs text-[#334155]">Optimal hypertrophic stimulus window</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-heading text-lg text-[#16A34A] font-bold">14/16</span>
              <span className="block font-heading text-[10px] text-[#334155] uppercase font-bold">MAV sets</span>
            </div>
          </div>

          {/* Progress Gauge Bar */}
          <div className="w-full h-2.5 rounded-full bg-[#e5eeff] mt-1 overflow-hidden flex">
            <div className="bg-[#0284C7] h-full w-[25%]" title="MEV Minimal Volume"></div>
            <div className="bg-[#16A34A] h-full w-[62.5%]" title="MAV Sweet Spot"></div>
            <div className="bg-[#EA580C] h-full w-[12.5%]" title="MRV Boundary"></div>
          </div>
          <div className="flex justify-between items-center text-[11px] font-heading text-[#334155] pt-0.5 font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#0284C7]"></span> Min (8)
            </span>
            <span className="flex items-center gap-1 font-bold text-[#16A34A]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span> Sweet Spot (12-16)
            </span>
            <span className="flex items-center gap-1 text-[#EA580C]">
              <span className="w-2 h-2 rounded-full bg-[#EA580C]"></span> Max (18)
            </span>
          </div>
        </div>

        {/* Target Exercise Routine Preview List */}
        <div className="w-full flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-heading text-base font-bold text-[#0F172A]">Planned Movements</h3>
            <span className="font-heading text-xs text-[#EA580C] font-bold">4 Drills</span>
          </div>

          {/* Exercise 1 */}
          <div
            onClick={() => onNavigate('active-workout')}
            className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3 border border-[#E2E8F0] hover:border-[#16A34A] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center font-heading text-base font-bold text-[#EA580C] shrink-0">
                1
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-heading text-sm font-bold text-[#0F172A] truncate">
                  Incline DB Bench Press
                </span>
                <span className="font-body text-xs text-[#334155]">
                  3 sets × 8-10 reps • <strong className="text-[#0F172A] font-semibold">25 kg</strong>
                </span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A] font-heading text-[10px] font-bold whitespace-nowrap">
              +2.5 kg PR
            </div>
          </div>

          {/* Exercise 2 */}
          <div className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3 border border-[#E2E8F0]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center font-heading text-base font-bold text-[#EA580C] shrink-0">
                2
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-heading text-sm font-bold text-[#0F172A] truncate">
                  Chest-Supported T-Bar Row
                </span>
                <span className="font-body text-xs text-[#334155]">
                  3 sets × 10-12 reps • <strong className="text-[#0F172A] font-semibold">40 kg</strong>
                </span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#334155] font-heading text-[10px] font-bold whitespace-nowrap">
              RPE 8.0
            </div>
          </div>

          {/* Exercise 3 */}
          <div className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3 border border-[#E2E8F0]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center font-heading text-base font-bold text-[#EA580C] shrink-0">
                3
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-heading text-sm font-bold text-[#0F172A] truncate">
                  Cable Lateral Raise
                </span>
                <span className="font-body text-xs text-[#334155]">
                  3 sets × 12-15 reps • <strong className="text-[#0F172A] font-semibold">7.5 kg</strong>
                </span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#334155] font-heading text-[10px] font-bold whitespace-nowrap">
              Strict Form
            </div>
          </div>

          {/* Exercise 4 */}
          <div className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3 border border-[#E2E8F0]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center font-heading text-base font-bold text-[#EA580C] shrink-0">
                4
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-heading text-sm font-bold text-[#0F172A] truncate">
                  Dual Rope Tricep Extension
                </span>
                <span className="font-body text-xs text-[#334155]">
                  3 sets × 12 reps • <strong className="text-[#0F172A] font-semibold">17.5 kg</strong>
                </span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#E0F2FE] text-[#0284C7] font-heading text-[10px] font-bold whitespace-nowrap">
              Peak Pump
            </div>
          </div>
        </div>

        {/* Warm Coach Signoff Tip */}
        <div className="w-full rounded-2xl bg-[#FFEDD5] border border-[#FED7AA] p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-[#EA580C] text-[22px] shrink-0 mt-0.5">
            lightbulb
          </span>
          <div className="flex flex-col">
            <span className="font-heading text-xs text-[#EA580C] font-bold uppercase tracking-wide">
              Bruno's Gym Floor Cue
            </span>
            <p className="font-body text-xs text-[#0F172A] mt-0.5 leading-relaxed font-medium">
              "Control that two-second eccentric drop on the incline presses. Protect those rotator cuffs and let the pec fibers do the work."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
