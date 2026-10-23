import React, { useState } from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const RecoveryScreen: React.FC<Props> = ({ onNavigate }) => {
  const [email, setEmail] = useState('alex.liftstrong@bruno-gym.app');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowToast(true);
      setTimeout(() => {
        onNavigate('otp');
      }, 900);
    }, 700);
  };

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
        <div className="relative w-full max-w-md mx-auto pt-2 flex flex-col items-center">
          {/* Coach Bruno Mascot + Speech Balloon Section */}
          <div className="w-full flex flex-col items-center mb-6">
            {/* Mascot Avatar Container */}
            <div className="relative mb-3 group">
              <div className="w-24 h-24 rounded-full p-1 bg-[#dce9ff] shadow-md flex items-center justify-center relative z-10 transition-transform duration-300 transform group-hover:scale-105">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#FFEDD5] flex items-center justify-center shadow-inner">
                  <img
                    alt="Coach Bruno 3D mascot smiling warmly"
                    className="w-full h-full object-cover object-top"
                    src={IMAGES.BRUNO_AVATAR_HEADSHOT}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/aistudio/Image_17_185444cf.png';
                    }}
                  />
                </div>
              </div>
              {/* Status indicator badge */}
              <div className="absolute bottom-1 right-1 z-20 w-7 h-7 rounded-full bg-[#EA580C] text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-base">fitness_center</span>
              </div>
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-full bg-[#EA580C] opacity-20 blur-md -z-0"></div>
            </div>

            {/* Bruno's Speech Balloon Card */}
            <div className="relative w-full bg-white rounded-xl p-4 shadow-md text-[#0F172A] border border-[#E2E8F0]">
              {/* Speech Bubble Tail */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 rounded-sm border-t border-l border-[#E2E8F0]"></div>
              <div className="flex items-start gap-3 relative z-10">
                <span className="material-symbols-outlined text-[#EA580C] text-xl shrink-0 mt-0.5">
                  forum
                </span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading text-xs font-bold text-[#EA580C] uppercase">
                      Coach Bruno
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                    <span className="font-heading text-[10px] text-[#334155] font-semibold">
                      Spotting you
                    </span>
                  </div>
                  <p className="font-body text-sm text-[#0F172A] font-medium leading-relaxed">
                    “Locked out? No sweat. Give me your email and I’ll send an authentication recovery code.”
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Pass Card */}
          <div className="w-full bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0] flex flex-col gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-[#0F172A] mb-1">
                Recovery Pass
              </h1>
              <p className="font-body text-xs text-[#334155] leading-relaxed">
                Enter the registered email associated with your training logs and progress telemetry.
              </p>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-heading text-xs font-semibold text-[#0F172A]" htmlFor="lifter-email">
                    Lifter Account Email
                  </label>
                  <span className="text-[#16A34A] font-heading text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified_user</span> Secure
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[#334155] text-lg pointer-events-none">
                    mail
                  </span>
                  <input
                    className="w-full h-12 pl-11 pr-4 bg-[#f8f9ff] border border-[#E2E8F0] rounded-xl font-body text-sm text-[#0F172A] focus:border-[#16A34A] focus:outline-none transition-all"
                    id="lifter-email"
                    placeholder="athlete@domain.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Explainer callout */}
                <div className="flex items-start gap-2 mt-1 bg-[#E0F2FE] p-2.5 rounded-lg text-[#0284C7]">
                  <span className="material-symbols-outlined text-base shrink-0 mt-0.5">info</span>
                  <p className="font-body text-xs text-[#334155]">
                    We will send a 6-digit verification code to reset your workout pass.
                  </p>
                </div>
              </div>

              {/* Primary CTA Button */}
              <button
                className="w-full min-h-[52px] rounded-full bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-heading text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    <span>Generating Ticket...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">send</span>
                    <span>Send 6-Digit Code</span>
                  </>
                )}
              </button>
            </form>

            {/* Active Feedback Toast */}
            {showToast && (
              <div className="w-full bg-[#DCFCE7] rounded-lg p-2.5 flex items-center gap-2 transition-all">
                <span className="material-symbols-outlined text-[#16A34A] text-lg">check_circle</span>
                <span className="font-body text-xs text-[#15803D] font-semibold">
                  Code dispatched! Bruno’s carrier pigeon is en route.
                </span>
              </div>
            )}

            {/* Quick Tips Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#eff4ff] rounded-lg p-2.5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#dce9ff] flex items-center justify-center shrink-0 text-[#565e74]">
                  <span className="material-symbols-outlined text-base">schedule</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-heading text-[10px] font-bold text-[#0F172A]">Valid for</span>
                  <span className="font-body text-xs text-[#334155]">15 minutes</span>
                </div>
              </div>

              <div className="bg-[#eff4ff] rounded-lg p-2.5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#dce9ff] flex items-center justify-center shrink-0 text-[#565e74]">
                  <span className="material-symbols-outlined text-base">encrypted</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-heading text-[10px] font-bold text-[#0F172A]">Encrypted</span>
                  <span className="font-body text-xs text-[#334155]">Zero-knowledge</span>
                </div>
              </div>
            </div>
          </div>

          {/* Motivational Support Footer */}
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <button
              onClick={() => onNavigate('ai-coach')}
              className="inline-flex items-center gap-2 font-heading text-xs font-semibold text-[#334155] hover:text-[#0F172A] transition-colors py-2 px-4 rounded-full bg-white shadow-sm border border-[#E2E8F0]"
            >
              <span className="material-symbols-outlined text-[#EA580C] text-base">support_agent</span>
              <span>Need help? Contact Bruno Support</span>
            </button>
            <div className="flex items-center gap-1.5 text-[#334155] font-body text-xs">
              <span>Remembered your password?</span>
              <button
                className="text-[#16A34A] font-heading font-bold hover:underline cursor-pointer"
                onClick={() => onNavigate('login')}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
