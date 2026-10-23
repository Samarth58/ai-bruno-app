import React, { useState } from 'react';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const WorkoutsTab: React.FC<Props> = ({ onNavigate }) => {
  const [selectedSplit, setSelectedSplit] = useState<'A' | 'B' | 'C' | 'D'>('A');

  const splits = [
    {
      id: 'A',
      title: 'Upper Body Hypertrophy A',
      focus: 'Chest, Shoulders & Triceps',
      duration: '45 Min',
      sets: 12,
      intensity: 'Target RPE 8.0',
      drills: [
        'Incline DB Bench Press (3 sets × 8-10 reps • 25 kg)',
        'Chest-Supported T-Bar Row (3 sets × 10-12 reps • 40 kg)',
        'Cable Lateral Raise (3 sets × 12-15 reps • 7.5 kg)',
        'Dual Rope Tricep Extension (3 sets × 12 reps • 17.5 kg)',
      ],
      isToday: true,
    },
    {
      id: 'B',
      title: 'Lower Body Strength B',
      focus: 'Quads, Posterior Chain & Calves',
      duration: '50 Min',
      sets: 14,
      intensity: 'Target RPE 8.5',
      drills: [
        'Barbell Back Squat (4 sets × 6-8 reps • 105 kg)',
        'Romanian Deadlift (3 sets × 8-10 reps • 90 kg)',
        'Leg Press (3 sets × 10-12 reps • 180 kg)',
        'Standing Calf Raise (4 sets × 12-15 reps • 65 kg)',
      ],
      isToday: false,
    },
    {
      id: 'C',
      title: 'Upper Body Power C',
      focus: 'Lats, Delts & Biceps',
      duration: '45 Min',
      sets: 12,
      intensity: 'Target RPE 8.0',
      drills: [
        'Weighted Neutral Pull-ups (3 sets × 6-8 reps • +15 kg)',
        'Standing Overhead DB Press (3 sets × 8-10 reps • 22.5 kg)',
        'Incline Dumbbell Curl (3 sets × 10-12 reps • 14 kg)',
        'Rear Delt Cable Fly (3 sets × 15 reps • 6 kg)',
      ],
      isToday: false,
    },
    {
      id: 'D',
      title: 'Lower Body Hypertrophy D',
      focus: 'Hamstrings, Glutes & Core',
      duration: '40 Min',
      sets: 10,
      intensity: 'Target RPE 7.5',
      drills: [
        'Barbell Hip Thrust (3 sets × 10-12 reps • 120 kg)',
        'Bulgarian Split Squat (3 sets × 10 reps/side • 18 kg DBs)',
        'Seated Leg Curl (4 sets × 12-15 reps • 50 kg)',
        'Hanging Leg Raise (3 sets × 15 reps)',
      ],
      isToday: false,
    },
  ];

  const current = splits.find((s) => s.id === selectedSplit) || splits[0];

  return (
    <div className="flex flex-col w-full pb-28 pt-16 bg-[#f8f9ff]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#f8f9ff]/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#E2E8F0]">
        <div className="h-16 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
              <span className="material-symbols-outlined text-[24px]">event_note</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-[#0284C7]">
                Program Mesocycle
              </span>
              <span className="font-heading text-xl font-bold tracking-tight text-[#0F172A]">
                Workouts
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('equipment-setup')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-sm text-[#0F172A] font-heading text-xs font-bold hover:bg-[#F8F9FA]"
          >
            <span className="material-symbols-outlined text-sm text-[#EA580C]">tune</span>
            <span>Gear</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col w-full max-w-md mx-auto px-4 pt-2 pb-6 gap-4">
        {/* Mesocycle Status Card */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-heading text-[10px] text-[#16A34A] font-bold uppercase tracking-wider">
              Cycle 4 • Hypertrophy Peak
            </span>
            <h2 className="font-heading text-lg font-bold text-[#0F172A]">4-Day Upper/Lower Split</h2>
            <span className="font-body text-xs text-[#334155]">Optimal 48h recovery cadence</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-heading text-xs font-bold text-[#EA580C] bg-[#FFEDD5] px-2.5 py-1 rounded-full">
              Week 3 of 6
            </span>
          </div>
        </div>

        {/* Split Day Selector */}
        <div className="grid grid-cols-4 gap-2">
          {splits.map((split) => (
            <button
              key={split.id}
              onClick={() => setSelectedSplit(split.id as any)}
              className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                selectedSplit === split.id
                  ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-md'
                  : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#eff4ff]'
              }`}
            >
              <span className="font-heading text-sm font-bold">Day {split.id}</span>
              <span className={`text-[10px] font-heading ${selectedSplit === split.id ? 'text-white/90' : 'text-[#565e74]'}`}>
                {split.duration}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Routine Detail Card */}
        <div className="w-full bg-white rounded-2xl shadow-sm p-4 border border-[#E2E8F0] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-heading text-[10px] font-bold uppercase text-[#EA580C] bg-[#FFEDD5] px-2 py-0.5 rounded-full">
                {current.focus}
              </span>
              <h3 className="font-heading text-xl font-bold text-[#0F172A] mt-1.5">{current.title}</h3>
            </div>
            <span className="font-heading text-xs text-[#0284C7] bg-[#E0F2FE] px-2.5 py-1 rounded-full font-bold">
              {current.intensity}
            </span>
          </div>

          <div className="h-px bg-[#E2E8F0] my-1"></div>

          {/* Drill Checklist */}
          <div className="space-y-2">
            <span className="font-heading text-xs font-bold text-[#0F172A] uppercase tracking-wider block">
              Programmed Drills ({current.sets} sets total)
            </span>
            {current.drills.map((drill, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-white border border-[#E2E8F0] text-[#0F172A] font-heading text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <span className="font-body text-xs text-[#0F172A] font-semibold">{drill}</span>
                </div>
                <span className="material-symbols-outlined text-[#16A34A] text-lg">check_circle</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('active-workout')}
            className="w-full min-h-[50px] mt-2 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white rounded-full font-heading text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_arrow
            </span>
            <span>LAUNCH THIS SESSION NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
};
