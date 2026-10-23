import React from 'react';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const ProgressTab: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col w-full pb-28 pt-16 bg-[#f8f9ff]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#f8f9ff]/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#E2E8F0]">
        <div className="h-16 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#16A34A]">
              <span className="material-symbols-outlined text-[24px]">trending_up</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">
                Telemetry Engine
              </span>
              <span className="font-heading text-xl font-bold tracking-tight text-[#0F172A]">
                Progress
              </span>
            </div>
          </div>
          <span className="font-heading text-xs font-bold text-[#EA580C] bg-[#FFEDD5] px-3 py-1 rounded-full">
            +8.4% 1RM Gain
          </span>
        </div>
      </header>

      <div className="flex flex-col w-full max-w-md mx-auto px-4 pt-2 pb-6 gap-4">
        {/* Weekly Tonnage Banner */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs text-[#565e74] uppercase font-bold">Total Workload</span>
            <span className="font-heading text-xs text-[#16A34A] font-bold bg-[#DCFCE7] px-2 py-0.5 rounded-full">
              Optimal Stimulus
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl font-extrabold text-[#0F172A] tabular-nums">
              12,450 kg
            </span>
            <span className="font-body text-xs text-[#334155] font-semibold">lifted this week (+1,200 kg vs last wk)</span>
          </div>

          {/* Bar Chart Mockup with high precision CSS */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-end justify-between h-28 gap-2 pt-4 px-1">
              {[
                { day: 'W1', height: '55%', load: '10.2k' },
                { day: 'W2', height: '68%', load: '11.1k' },
                { day: 'W3', height: '82%', load: '11.8k' },
                { day: 'W4 (Now)', height: '100%', load: '12.4k', active: true },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="font-heading text-[10px] text-[#334155] font-semibold tabular-nums">
                    {item.load}
                  </span>
                  <div
                    style={{ height: item.height }}
                    className={`w-full rounded-t-lg transition-all ${
                      item.active ? 'bg-[#16A34A] shadow-sm' : 'bg-[#dce9ff]'
                    }`}
                  ></div>
                  <span className={`font-heading text-[10px] ${item.active ? 'text-[#16A34A] font-bold' : 'text-[#565e74]'}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 1RM Strength Telemetry Table */}
        <div className="w-full bg-white rounded-2xl shadow-sm p-4 border border-[#E2E8F0] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-base font-bold text-[#0F172A]">Calculated 1RM Baselines</h3>
            <span className="font-heading text-[10px] text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full font-bold">
              VBT Calibrated
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-between">
              <div>
                <span className="font-heading text-xs font-bold text-[#0F172A] block">Incline DB Bench Press</span>
                <span className="font-body text-[11px] text-[#334155]">Working Load: 25 kg/side × 10 reps</span>
              </div>
              <div className="text-right">
                <span className="font-heading text-sm font-bold text-[#16A34A]">34.5 kg est. 1RM</span>
                <span className="block font-heading text-[10px] text-[#EA580C] font-semibold">+2.5 kg bump</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-between">
              <div>
                <span className="font-heading text-xs font-bold text-[#0F172A] block">Barbell Back Squat</span>
                <span className="font-body text-[11px] text-[#334155]">Working Load: 105 kg × 8 reps</span>
              </div>
              <div className="text-right">
                <span className="font-heading text-sm font-bold text-[#16A34A]">131.2 kg est. 1RM</span>
                <span className="block font-heading text-[10px] text-[#16A34A] font-semibold">+5.0 kg bump</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-between">
              <div>
                <span className="font-heading text-xs font-bold text-[#0F172A] block">Chest-Supported Row</span>
                <span className="font-body text-[11px] text-[#334155]">Working Load: 40 kg × 12 reps</span>
              </div>
              <div className="text-right">
                <span className="font-heading text-sm font-bold text-[#16A34A]">56.0 kg est. 1RM</span>
                <span className="block font-heading text-[10px] text-[#0284C7] font-semibold">Maintained</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coach Bruno Bio-readiness Note */}
        <div className="w-full rounded-2xl bg-[#FFEDD5] border border-[#FED7AA] p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-[#EA580C] text-[22px] shrink-0 mt-0.5">
            insights
          </span>
          <div className="flex flex-col">
            <span className="font-heading text-xs text-[#EA580C] font-bold uppercase tracking-wide">
              Bruno's Velocity Analysis
            </span>
            <p className="font-body text-xs text-[#0F172A] mt-0.5 leading-relaxed font-medium">
              "Your bar speed on concentric drives remains in the 0.45 m/s hypertrophic sweet spot. No neuromuscular fatigue detected. We proceed with progressive overload on Friday!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
