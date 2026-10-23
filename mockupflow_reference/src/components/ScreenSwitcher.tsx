import React, { useState } from 'react';
import { ScreenId } from '../types';

interface Props {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export const ScreenSwitcher: React.FC<Props> = ({ currentScreen, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const screens: { id: ScreenId; num: number; label: string; desc: string; category: string }[] = [
    { id: 'home', num: 1, label: 'Home Dashboard', desc: 'Coach Sync Live, Today\'s Workout, Set Balance', category: 'Main' },
    { id: 'equipment-setup', num: 2, label: 'Equipment Setup (Step 4)', desc: 'Facility selector, apparatus checklist, dumbbell stepper', category: 'Onboarding' },
    { id: 'active-workout', num: 3, label: 'Active Workout', desc: 'Set logger, rest timer, 1-tap swaps, audio visualizer', category: 'Main' },
    { id: 'workout-complete', num: 4, label: 'Workout Complete & Debrief', desc: 'Crushed it Alex, biofeedback sliders, +2.5kg overload', category: 'Main' },
    { id: 'splash', num: 5, label: 'Telemetry v4.8 Splash', desc: 'Bruno 3D podium, hardware sync 74% -> 100%', category: 'Intro' },
    { id: 'welcome', num: 6, label: 'Meet Bruno Landing', desc: 'AI gym buddy intro, 3 feature cards, auth CTAs', category: 'Intro' },
    { id: 'signup', num: 7, label: 'Sign Up (Join the Rack)', desc: 'Identity, realtime password strength meter', category: 'Auth' },
    { id: 'login', num: 8, label: 'Log In (Power Up)', desc: 'Athletic ID, email check, social logins, streak', category: 'Auth' },
    { id: 'recovery', num: 9, label: 'Recovery Pass', desc: 'Email input, code dispatch toast, encryption info', category: 'Auth' },
    { id: 'otp', num: 10, label: 'OTP Verification', desc: '6-digit boxes with custom tactile mobile keypad', category: 'Auth' },
    { id: 'reset-password', num: 11, label: 'Create New Password', desc: 'Security benchmark rules, match indicator', category: 'Auth' },
    { id: 'password-success', num: 12, label: 'Password Reset Complete', desc: 'All Set & Locked In celebration, training track', category: 'Auth' },
  ];

  return (
    <>
      {/* Floating Pill Trigger on the top right */}
      <aside aria-label="Screen Switcher" className="fixed top-3 right-3 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F172A] text-white shadow-lg border border-slate-700 hover:bg-slate-800 active:scale-95 transition-all text-xs font-heading font-semibold"
        >
          <span className="material-symbols-outlined text-[16px] text-[#EA580C]">view_carousel</span>
          <span>Screens ({screens.find((s) => s.id === currentScreen)?.num || '•'})</span>
          <span className="material-symbols-outlined text-[16px]">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </aside>

      {/* Screen Selection Modal / Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl border border-[#E2E8F0] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#f8f9ff]">
              <div>
                <span className="font-heading text-[10px] uppercase tracking-wider text-[#EA580C] font-bold">
                  Screen Showcase Navigator
                </span>
                <h3 className="font-heading text-lg font-bold text-[#0F172A]">
                  All 12 App Screens
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#565e74] hover:bg-[#dce9ff]"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {screens.map((item) => {
                const isCurrent = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#eff4ff] border-2 border-[#16A34A] shadow-sm'
                        : 'bg-white hover:bg-[#F8F9FA] border border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl font-heading text-xs font-bold flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-[#16A34A] text-white'
                            : 'bg-[#eff4ff] text-[#EA580C]'
                        }`}
                      >
                        {item.num}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-xs font-bold text-[#0F172A] truncate">
                            {item.label}
                          </span>
                          <span className="font-heading text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#e5eeff] text-[#565e74] font-semibold">
                            {item.category}
                          </span>
                        </div>
                        <span className="font-body text-[11px] text-[#565e74] truncate">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="material-symbols-outlined text-[#16A34A] text-lg">
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#F8F9FA] border-t border-[#E2E8F0] text-center">
              <span className="font-body text-[11px] text-[#565e74]">
                You can also navigate through the app naturally using buttons and links!
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
