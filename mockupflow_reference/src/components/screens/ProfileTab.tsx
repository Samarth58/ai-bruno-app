import React from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId, EquipmentState } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
  equipmentState: EquipmentState;
}

export const ProfileTab: React.FC<Props> = ({ onNavigate, equipmentState }) => {
  return (
    <div className="flex flex-col w-full pb-28 pt-16 bg-[#f8f9ff]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#f8f9ff]/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#E2E8F0]">
        <div className="h-16 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#565e74]">
              <span className="material-symbols-outlined text-[24px]">person</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-[#565e74]">
                Lifter Dossier
              </span>
              <span className="font-heading text-xl font-bold tracking-tight text-[#0F172A]">
                Profile
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('login')}
            className="text-xs font-heading font-semibold text-[#ba1a1a] bg-[#ffdad6] px-3 py-1 rounded-full hover:bg-red-200 transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      <div className="flex flex-col w-full max-w-md mx-auto px-4 pt-2 pb-6 gap-4">
        {/* User Card */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] flex items-center gap-4">
          <div className="relative">
            <img
              alt="Alex Mercer"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#16A34A]"
              src={IMAGES.ALEX_PROFILE}
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#16A34A] border-2 border-white"></span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-lg font-bold text-[#0F172A]">Alex Mercer</h2>
            <span className="font-body text-xs text-[#565e74] block">alex.lift@ironclub.com</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-heading text-[10px] font-bold">
                Intermediate Lifter
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FFEDD5] text-[#EA580C] font-heading text-[10px] font-bold">
                5d Streak 🔥
              </span>
            </div>
          </div>
        </div>

        {/* Hardware & Training Profile */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-[#0F172A]">Gym Equipment Baseline</h3>
            <button
              onClick={() => onNavigate('equipment-setup')}
              className="font-heading text-xs font-bold text-[#16A34A] hover:underline"
            >
              Edit Gear
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#eff4ff] flex flex-col">
              <span className="text-[#565e74] font-heading text-[10px] uppercase">Facility</span>
              <span className="font-heading font-bold text-[#0F172A] capitalize">
                {equipmentState.facilityType} Gym
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#eff4ff] flex flex-col">
              <span className="text-[#565e74] font-heading text-[10px] uppercase">Heaviest DB</span>
              <span className="font-heading font-bold text-[#0F172A]">
                {equipmentState.maxDumbbellWeightKg} kg
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#eff4ff] flex flex-col">
              <span className="text-[#565e74] font-heading text-[10px] uppercase">Cables & Rack</span>
              <span className="font-heading font-bold text-[#16A34A]">Auto-Synced</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#eff4ff] flex flex-col">
              <span className="text-[#565e74] font-heading text-[10px] uppercase">Joint Cautions</span>
              <span className="font-heading font-bold text-[#EA580C]">Shoulder Impingement</span>
            </div>
          </div>
        </div>

        {/* Quick Screen Access Links */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] space-y-2">
          <h3 className="font-heading text-sm font-bold text-[#0F172A] mb-1">Account &amp; Security</h3>

          <button
            onClick={() => onNavigate('recovery')}
            className="w-full p-2.5 rounded-xl hover:bg-[#eff4ff] flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#0284C7] text-lg">lock_reset</span>
              <span className="font-heading text-xs font-semibold text-[#0F172A]">
                Reset Passcode (Recovery Pass)
              </span>
            </div>
            <span className="material-symbols-outlined text-sm text-[#565e74]">chevron_right</span>
          </button>

          <button
            onClick={() => onNavigate('splash')}
            className="w-full p-2.5 rounded-xl hover:bg-[#eff4ff] flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#EA580C] text-lg">sensors</span>
              <span className="font-heading text-xs font-semibold text-[#0F172A]">
                View Telemetry Loading Splash
              </span>
            </div>
            <span className="material-symbols-outlined text-sm text-[#565e74]">chevron_right</span>
          </button>

          <button
            onClick={() => onNavigate('welcome')}
            className="w-full p-2.5 rounded-xl hover:bg-[#eff4ff] flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#16A34A] text-lg">home</span>
              <span className="font-heading text-xs font-semibold text-[#0F172A]">
                View Meet Bruno Landing Page
              </span>
            </div>
            <span className="material-symbols-outlined text-sm text-[#565e74]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};
