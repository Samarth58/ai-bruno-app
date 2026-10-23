import React, { useEffect, useState } from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const SplashScreen: React.FC<Props> = ({ onNavigate }) => {
  const [progress, setProgress] = useState(74);
  const [stageIndex, setStageIndex] = useState(0);

  const stages = [
    'Syncing gym hardware engine...',
    'Mapping velocity profile...',
    'Loading Coach Bruno journal...',
    'Engaging iron sensors...',
    'Session ready!'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) {
          const next = prev + 1;
          if (next === 82) setStageIndex(1);
          if (next === 91) setStageIndex(2);
          if (next === 97) setStageIndex(3);
          if (next >= 100) setStageIndex(4);
          return next;
        }
        clearInterval(timer);
        return 100;
      });
    }, 70);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#f8f9ff] text-[#0F172A] font-body flex flex-col justify-between px-4 pb-8 pt-4 overflow-hidden select-none max-w-md mx-auto">
      {/* Ambient Athletic Grain & Glow Underlay */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient cx="50%" cy="45%" id="coachGlow" r="40%">
              <stop offset="0%" stopColor="#EA580C" stopOpacity="0.16"></stop>
              <stop offset="60%" stopColor="#16A34A" stopOpacity="0.04"></stop>
              <stop offset="100%" stopColor="#F8F9FA" stopOpacity="0"></stop>
            </radialGradient>
            <pattern height="24" id="chalkNoise" patternUnits="userSpaceOnUse" width="24">
              <circle cx="2" cy="3" fill="#0F172A" opacity="0.04" r="0.6"></circle>
              <circle cx="14" cy="9" fill="#0F172A" opacity="0.05" r="0.4"></circle>
              <circle cx="20" cy="18" fill="#0F172A" opacity="0.03" r="0.7"></circle>
              <circle cx="8" cy="21" fill="#0F172A" opacity="0.04" r="0.5"></circle>
            </pattern>
          </defs>
          <rect fill="url(#coachGlow)" height="100%" width="100%"></rect>
          <rect fill="url(#chalkNoise)" height="100%" width="100%"></rect>
        </svg>
      </div>

      {/* Top Bar with Back Button & Telemetry Status */}
      <div className="relative z-10 w-full flex justify-between items-center pt-2 mb-2">
        <button
          onClick={() => onNavigate('welcome')}
          aria-label="Back"
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-[0_1px_8px_rgba(15,23,42,0.06)] text-[#0F172A] hover:bg-[#dce9ff] transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce9ff] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping"></span>
          <span className="font-heading text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">
            Telemetry v4.8
          </span>
        </div>

        <div className="inline-flex items-center gap-1 text-[#334155]">
          <span className="material-symbols-outlined text-base">sensors</span>
          <span className="font-heading text-[10px] font-bold uppercase tracking-wider">BLE Active</span>
        </div>
      </div>

      {/* Hero Character Presentation */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center my-auto">
        {/* Character Podium & Mascot Anchor */}
        <div className="relative w-full max-w-[320px] aspect-[3/4] flex items-center justify-center">
          {/* Mascot Soft Floor Cast Shadow & Halo */}
          <div className="absolute bottom-4 w-4/5 h-8 bg-[#0F172A]/15 rounded-full blur-md"></div>
          <div className="absolute -top-4 w-60 h-60 bg-[#FFEDD5] rounded-full blur-3xl opacity-60"></div>

          {/* 3D Mascot Image */}
          <img
            alt="Coach Bruno, athletic friendly bear personal trainer in orange gym tank top holding leather journal"
            className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition-transform duration-700 ease-out transform hover:scale-105"
            src={IMAGES.BRUNO_HERO_FULL}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/aistudio/Image_9_fc5d7767.png';
            }}
          />

          {/* Floating Coach Quote Pill Micro-Delight */}
          <div
            className="absolute -right-1 top-12 z-20 bg-white shadow-xl rounded-2xl p-2.5 max-w-[150px] animate-bounce"
            style={{ animationDuration: '3.2s' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="material-symbols-outlined text-[#EA580C] text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                fitness_center
              </span>
              <span className="font-heading text-[10px] font-bold text-[#EA580C] uppercase tracking-wider">
                Coach Bruno
              </span>
            </div>
            <p className="font-body text-xs text-[#0F172A] leading-tight font-medium">
              Chalk up. We test max effort today!
            </p>
          </div>

          {/* Quick Micro PR Spec Pill */}
          <div className="absolute -left-1 bottom-16 z-20 bg-white shadow-md rounded-full px-3 py-1.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span>
            <span className="font-heading text-[10px] text-[#334155] font-bold">1RM Calc Engine: Ready</span>
          </div>
        </div>

        {/* Brand Typography Section */}
        <div className="w-full text-center mt-2 z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFEDD5] text-[#EA580C] mb-2">
            <span className="material-symbols-outlined text-xs">bolt</span>
            <span className="font-heading text-[10px] font-bold tracking-widest uppercase">
              The Next-Gen Lifter's AI
            </span>
          </div>

          <h1 className="font-heading text-4xl text-[#0F172A] tracking-tighter uppercase font-extrabold leading-none">
            BRUNO
          </h1>

          <p className="font-heading text-xs text-[#334155] tracking-wider uppercase mt-2 max-w-[280px] font-semibold">
            AI Gym Buddy <span className="text-[#EA580C]">•</span> Autonomous Biomechanical Programming
          </p>

          {/* Key Focus Metric Indicators */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dce9ff] text-[#0F172A]">
              <span
                className="material-symbols-outlined text-xs text-[#16A34A]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <span className="font-heading text-[10px] font-bold">Adaptive Load</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dce9ff] text-[#0F172A]">
              <span
                className="material-symbols-outlined text-xs text-[#0284C7]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                speed
              </span>
              <span className="font-heading text-[10px] font-bold">VBT Bar Path</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dce9ff] text-[#0F172A]">
              <span
                className="material-symbols-outlined text-xs text-[#EA580C]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                timer
              </span>
              <span className="font-heading text-[10px] font-bold">Smart Rest</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Syncing Engine Pill & CTA */}
      <div className="relative z-10 w-full mt-auto pt-6 flex flex-col items-center gap-3">
        <div
          onClick={() => onNavigate('home')}
          className="w-full bg-white rounded-full shadow-[0_4px_16px_rgba(15,23,42,0.06)] p-2 pl-3 pr-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          {/* Animated Status Pulse & Radar Node */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#DCFCE7] text-[#16A34A] shrink-0">
              <span
                className={`material-symbols-outlined text-lg ${progress < 100 ? 'animate-spin' : ''}`}
                style={{ animationDuration: '2.5s' }}
              >
                {progress === 100 ? 'check' : 'sync'}
              </span>
              {progress < 100 && (
                <span className="absolute w-full h-full rounded-full bg-[#16A34A]/20 animate-ping"></span>
              )}
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="font-heading text-[11px] text-[#0F172A] font-bold uppercase truncate">
                {stages[stageIndex]}
              </span>
              <span className="font-body text-[11px] text-[#334155] truncate">
                {progress === 100 ? 'Tap to launch Bruno dashboard' : 'Calibrating plate tree & bar tension'}
              </span>
            </div>
          </div>

          {/* Sync Progress Percentage Counter */}
          <div className="flex items-center shrink-0">
            <span className="font-heading text-lg text-[#16A34A] font-bold tabular-nums">
              {progress}%
            </span>
          </div>
        </div>

        {/* Enter Button if ready or skip */}
        <button
          onClick={() => onNavigate('welcome')}
          className="w-full h-12 rounded-full bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-heading font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <span>{progress === 100 ? 'Enter Bruno AI Experience' : 'Proceed to Welcome Screen'}</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>

        {/* Subtle Hardware Link Subtext */}
        <div className="flex items-center justify-center gap-1.5 text-[#334155] opacity-80">
          <span className="material-symbols-outlined text-sm">lock_outline</span>
          <span className="font-heading text-[10px] font-medium tracking-tight">
            Offline-First Gym Telemetry Protected
          </span>
        </div>
      </div>
    </div>
  );
};
