import React from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const PasswordSuccessScreen: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0F172A] font-body flex flex-col justify-between max-w-md mx-auto relative select-none">
      {/* Top back button */}
      <div className="fixed top-0 left-0 z-50 pt-safe px-4">
        <div className="h-16 flex items-center">
          <button
            aria-label="Go back"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-[0_1px_8px_rgba(15,23,42,0.06)] text-[#0F172A] hover:bg-[#dce9ff] transition-colors"
            onClick={() => onNavigate('login')}
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-8 bg-[#f8f9ff] px-4">
        <div className="relative w-full flex flex-col items-center">
          {/* Top Celebration Graphic Area */}
          <div className="relative w-full max-w-sm flex flex-col items-center pt-2 pb-1">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#DCFCE7]/60 rounded-full blur-3xl pointer-events-none"></div>

            {/* Bruno Mascot Character Visual */}
            <div className="relative z-10 w-60 h-64 flex items-center justify-center">
              <img
                alt="Bruno AI Gym Buddy 3D character celebrating"
                className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none"
                src={IMAGES.BRUNO_HERO_FULL}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/Image_23_c4c3bfd7.png';
                }}
              />
              <div className="absolute bottom-2 right-4 bg-white shadow-md px-3 py-1 rounded-full flex items-center space-x-1 border border-[#E2E8F0]">
                <span
                  className="material-symbols-outlined text-[#EA580C] text-base font-bold"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
                <span className="font-heading text-[10px] text-[#0F172A] uppercase font-bold">
                  Bruno Ready
                </span>
              </div>
            </div>

            {/* Primary Success Pill Badge */}
            <div className="relative z-20 mt-2 flex items-center gap-1.5 bg-[#DCFCE7] text-[#16A34A] px-3.5 py-1.5 rounded-full shadow-sm">
              <span
                className="material-symbols-outlined text-base font-bold"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <span className="font-heading text-xs font-bold tracking-wider uppercase">
                Password Reset Complete!
              </span>
            </div>
          </div>

          {/* Main Message */}
          <div className="w-full max-w-sm text-center mt-3 px-1">
            <h1 className="font-heading text-[28px] font-bold text-[#0F172A] tracking-tight">
              All Set &amp; Locked In
            </h1>
            <p className="font-body text-xs text-[#334155] mt-1 leading-relaxed">
              Your account is secured and your progression mesocycle is ready.
            </p>
          </div>

          {/* Summary Info Card */}
          <div className="w-full max-w-sm mt-4 bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3 border border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#565e74]">
                  <span className="material-symbols-outlined text-xl">fitness_center</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-heading text-[10px] text-[#565e74] uppercase tracking-wider font-bold">
                    Active Training Track
                  </span>
                  <span className="font-heading text-sm font-bold text-[#0F172A]">
                    Commercial Gym Profile
                  </span>
                </div>
              </div>
              <span className="font-heading text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-1 rounded-full">
                Sync Active
              </span>
            </div>

            {/* Schedule Details */}
            <div className="bg-[#eff4ff] rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#334155]">
                <span className="material-symbols-outlined text-base text-[#565e74]">event_repeat</span>
                <span className="font-body text-xs font-medium">Weekly Split</span>
              </div>
              <span className="font-heading text-xs text-[#0F172A] font-bold">
                4 Days / Wk
              </span>
            </div>

            {/* Bruno Mentorship Callout Quote */}
            <div className="bg-[#FFEDD5]/60 rounded-xl p-2.5 flex items-start gap-2.5 text-left border border-[#FED7AA]">
              <span
                className="material-symbols-outlined text-[#EA580C] text-lg mt-0.5"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                sms
              </span>
              <div className="flex flex-col">
                <span className="font-heading text-[10px] text-[#EA580C] uppercase font-bold">
                  Coach Bruno
                </span>
                <p className="font-body text-xs text-[#0F172A] mt-0.5 leading-snug">
                  "Your chalk is ready and the weights haven't moved an inch. Let's attack Week 3."
                </p>
              </div>
            </div>
          </div>

          {/* Security & Status Telemetry Pills */}
          <div className="w-full max-w-sm flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-1 text-[#334155]">
              <span
                className="material-symbols-outlined text-xs text-[#16A34A]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lock
              </span>
              <span className="font-heading text-[10px] font-semibold">256-Bit Vault</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[#E2E8F0]"></div>
            <div className="flex items-center gap-1 text-[#334155]">
              <span
                className="material-symbols-outlined text-xs text-[#0284C7]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                cloud_done
              </span>
              <span className="font-heading text-[10px] font-semibold">Cloud Synced</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[#E2E8F0]"></div>
            <div className="flex items-center gap-1 text-[#334155]">
              <span
                className="material-symbols-outlined text-xs text-[#EA580C]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              <span className="font-heading text-[10px] font-semibold">Verified</span>
            </div>
          </div>

          {/* Primary Action Section */}
          <div className="w-full max-w-sm mt-5 flex flex-col items-center">
            <button
              onClick={() => onNavigate('home')}
              className="w-full h-14 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white rounded-full font-heading text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              type="button"
            >
              <span>Continue to Bruno Dashboard</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className="mt-3 text-[#565e74] hover:text-[#0F172A] font-heading text-xs font-semibold tracking-wide py-1.5 px-3 transition-colors"
              type="button"
            >
              Review Security Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
