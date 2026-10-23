import React from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const WelcomeScreen: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0F172A] font-body flex flex-col justify-between max-w-md mx-auto relative select-none">
      {/* Top back button */}
      <div className="fixed top-0 left-0 z-50 pt-safe px-4">
        <div className="h-16 flex items-center">
          <button
            aria-label="Go back"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-[0_1px_8px_rgba(15,23,42,0.06)] text-[#0F172A] hover:bg-[#dce9ff] transition-colors"
            onClick={() => onNavigate('splash')}
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-8 bg-[#f8f9ff]">
        <div className="flex flex-col w-full">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEDD5] text-[#EA580C] mb-3 shadow-sm">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                bolt
              </span>
              <span className="font-heading text-[10px] font-bold uppercase tracking-wider">
                Your 24/7 Strength Coach
              </span>
            </div>
            <h1 className="font-heading text-[28px] font-bold text-[#0F172A] mb-2 max-w-xs leading-tight tracking-tight">
              Meet Bruno, your AI gym buddy
            </h1>
            <p className="font-body text-sm text-[#334155] max-w-sm">
              Smart lifting telemetry, zero spreadsheet dread, and tailored real-time guidance every set.
            </p>
          </div>

          {/* Hero 3D Card */}
          <div className="relative w-full px-4 my-2 flex justify-center">
            <div className="relative w-full max-w-xs aspect-[3/4] rounded-2xl bg-gradient-to-b from-[#dce9ff]/60 via-[#F8F9FA] to-white p-3 shadow-md flex items-end justify-center overflow-hidden border border-[#E2E8F0]">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#EA580C]/10 via-transparent to-transparent pointer-events-none"></div>

              <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                <span className="font-heading text-[10px] font-bold text-[#0F172A] uppercase">
                  Ready To Lift
                </span>
              </div>

              <div className="absolute top-4 left-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFEDD5] shadow-sm">
                <span className="material-symbols-outlined text-xs text-[#EA580C]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  fitness_center
                </span>
                <span className="font-heading text-[10px] font-bold text-[#EA580C]">BRUNO v2.4</span>
              </div>

              <img
                alt="Full-body 3D rendered character model of Bruno, an athletic heavyweight brown bear wearing an orange athletic gym tank top with white trim and black lifting wrist wraps, standing in an encouraging stance"
                className="w-full h-full object-contain object-bottom drop-shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
                src={IMAGES.BRUNO_HERO_FULL}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/Image_11_6b25b753.png';
                }}
              />

              <div className="absolute bottom-3 inset-x-3 z-10 bg-white/95 backdrop-blur-md rounded-xl p-2.5 shadow-sm flex items-center gap-2 border border-[#E2E8F0]">
                <div className="w-8 h-8 rounded-full bg-[#EA580C]/15 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#EA580C] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    chat
                  </span>
                </div>
                <p className="font-body text-xs text-[#0F172A] font-medium line-clamp-1">
                  “Chalk up, buddy! I already mapped your warmup sets.”
                </p>
              </div>
            </div>
          </div>

          {/* Three Feature Cards */}
          <div className="px-4 flex flex-col gap-2.5 my-3">
            <div className="w-full p-3.5 rounded-xl bg-white shadow-sm flex items-start gap-3 transition-transform active:scale-[0.99] border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">tune</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-heading text-base text-[#0F172A] font-semibold">
                    Adaptive Equipment Logic
                  </span>
                </div>
                <p className="font-body text-xs text-[#334155] leading-relaxed">
                  Tell me what to lift today based on your gear — commercial, garage gym, or just dumbbells.
                </p>
              </div>
            </div>

            <div className="w-full p-3.5 rounded-xl bg-white shadow-sm flex items-start gap-3 transition-transform active:scale-[0.99] border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  trending_up
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-heading text-base text-[#0F172A] font-semibold">
                    Frictionless Overload
                  </span>
                </div>
                <p className="font-body text-xs text-[#334155] leading-relaxed">
                  Progressive overload without spreadsheet anxiety. Bruno auto-calculates micro-loads and rep targets.
                </p>
              </div>
            </div>

            <div className="w-full p-3.5 rounded-xl bg-white shadow-sm flex items-start gap-3 transition-transform active:scale-[0.99] border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-full bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">swap_horizontal_circle</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-heading text-base text-[#0F172A] font-semibold">
                    Crowded Gym Solver
                  </span>
                </div>
                <p className="font-body text-xs text-[#334155] leading-relaxed">
                  1-Tap instant machine swaps when equipment is busy — matched to exact muscle recruitment curves.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 pt-2 pb-6 flex flex-col gap-3 mt-auto">
            <button
              onClick={() => onNavigate('signup')}
              className="w-full h-[52px] rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-heading text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              id="btn-get-started"
              type="button"
            >
              <span>Get Started (Build Plan)</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>

            <button
              onClick={() => onNavigate('login')}
              className="w-full h-[52px] rounded-full bg-white text-[#0F172A] font-heading text-sm font-semibold shadow-sm hover:bg-[#F8F9FA] border border-[#E2E8F0] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              id="btn-login"
              type="button"
            >
              <span className="material-symbols-outlined text-xl text-[#565e74]">login</span>
              <span>I Already Have an Account — Log In</span>
            </button>

            <div className="px-4 text-center mt-1">
              <p className="font-body text-xs text-[#565e74]">
                By tapping Get Started, you agree to Bruno’s{' '}
                <a className="underline text-[#0F172A] hover:text-[#16A34A]" href="#terms">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a className="underline text-[#0F172A] hover:text-[#16A34A]" href="#privacy">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
