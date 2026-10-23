import React, { useState, useEffect } from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const OtpScreen: React.FC<Props> = ({ onNavigate }) => {
  const [digits, setDigits] = useState<string[]>(['4', '8', '2']);
  const [timeLeft, setTimeLeft] = useState(42);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleKeyPress = (num: string) => {
    if (digits.length < 6) {
      setDigits([...digits, num]);
    }
  };

  const handleBackspace = () => {
    if (digits.length > 0) {
      setDigits(digits.slice(0, -1));
    }
  };

  const handleVerify = () => {
    onNavigate('reset-password');
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0F172A] font-body flex flex-col justify-between max-w-md mx-auto relative select-none">
      {/* Top back button */}
      <div className="fixed top-0 left-0 z-50 pt-safe px-4">
        <div className="h-16 flex items-center">
          <button
            aria-label="Go back"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-[0_1px_8px_rgba(15,23,42,0.06)] text-[#0F172A] hover:bg-[#dce9ff] transition-colors"
            onClick={() => onNavigate('recovery')}
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-6 bg-[#f8f9ff] px-4">
        {/* Coach Bruno Header Callout */}
        <div className="relative w-full bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0] mb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#FFEDD5] shadow-inner">
                <img
                  alt="Coach Bruno 3D mascot"
                  className="w-full h-full object-cover"
                  src={IMAGES.BRUNO_AVATAR_HEADSHOT}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/aistudio/Image_19_33505ff1.png';
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#16A34A] flex items-center justify-center shadow-sm">
                <span
                  className="material-symbols-outlined text-white text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  mark_email_read
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1 bg-[#FFEDD5] text-[#EA580C] px-2 py-0.5 rounded-full mb-1">
                <span className="material-symbols-outlined text-xs">sports</span>
                <span className="font-heading text-[10px] font-bold uppercase tracking-wider">Coach Bruno</span>
              </div>
              <h2 className="font-heading text-lg font-bold text-[#0F172A] leading-tight mb-1">
                Check your inbox!
              </h2>
              <p className="font-body text-xs text-[#334155] leading-normal">
                Enter the 6-digit code sent to{' '}
                <span className="font-semibold text-[#0F172A] underline decoration-[#16A34A] underline-offset-2">
                  alex@fitmail.com
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 6-Digit Passcode Box Container */}
        <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0] mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading text-[10px] text-[#334155] uppercase tracking-wider font-bold">
              Verification Passcode
            </span>
            <div className="flex items-center gap-1.5 bg-[#E0F2FE] text-[#0284C7] px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-sm animate-pulse">timer</span>
              <span className="font-heading text-xs font-semibold">
                {timeLeft > 0 ? `Resend code in 00:${timeLeft < 10 ? '0' : ''}${timeLeft}` : 'Code expired'}
              </span>
            </div>
          </div>

          {/* 6 Input Boxes */}
          <div className="grid grid-cols-6 gap-2 w-full my-2">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const isFilled = index < digits.length;
              const isCurrent = index === digits.length;

              return (
                <div
                  key={index}
                  className={`h-13 aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                    isFilled
                      ? 'bg-[#eff4ff] border border-[#dce9ff] shadow-inner text-[#0F172A]'
                      : isCurrent
                      ? 'bg-[#DCFCE7] border-2 border-[#16A34A] shadow-md relative'
                      : 'bg-[#F8F9FA] border border-[#E2E8F0]'
                  }`}
                >
                  {isFilled ? (
                    <span className="font-heading text-xl font-bold">{digits[index]}</span>
                  ) : isCurrent ? (
                    <>
                      <span className="w-1.5 h-6 bg-[#16A34A] rounded-full animate-pulse"></span>
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#16A34A] rounded-full"></div>
                    </>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#bdcaba]/60"></span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Auxiliary link and resend */}
          <div className="flex items-center justify-between pt-3 mt-1">
            <button
              onClick={() => onNavigate('recovery')}
              className="inline-flex items-center gap-1.5 text-[#334155] font-body text-xs hover:text-[#16A34A] transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-base">mail</span>
              <span>Wrong email address?</span>
            </button>
            <button
              onClick={() => setTimeLeft(45)}
              disabled={timeLeft > 0}
              className={`font-heading text-xs font-semibold transition-colors ${
                timeLeft === 0
                  ? 'text-[#EA580C] underline cursor-pointer'
                  : 'text-[#6e7b6c] cursor-not-allowed opacity-60'
              }`}
              type="button"
            >
              Resend code
            </button>
          </div>
        </div>

        {/* Primary Verification Action Button */}
        <button
          onClick={handleVerify}
          className="w-full h-13 min-h-[52px] rounded-full bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-heading text-sm font-semibold shadow-md flex items-center justify-center gap-2 mb-3 transition-all cursor-pointer"
          type="button"
        >
          <span>Verify &amp; Continue</span>
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </button>

        {/* Custom Tactile Mobile Numeric Keypad */}
        <div className="w-full bg-white rounded-xl p-3 shadow-sm border border-[#E2E8F0] flex flex-col gap-2 select-none">
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3'].map((n) => (
              <button
                key={n}
                onClick={() => handleKeyPress(n)}
                className="h-12 rounded-xl bg-[#F8F9FA] hover:bg-[#e5eeff] active:scale-95 flex items-center justify-center border border-[#E2E8F0] transition-transform"
                type="button"
              >
                <span className="font-heading text-lg font-bold text-[#0F172A]">{n}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['4', '5', '6'].map((n) => (
              <button
                key={n}
                onClick={() => handleKeyPress(n)}
                className="h-12 rounded-xl bg-[#F8F9FA] hover:bg-[#e5eeff] active:scale-95 flex items-center justify-center border border-[#E2E8F0] transition-transform"
                type="button"
              >
                <span className="font-heading text-lg font-bold text-[#0F172A]">{n}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['7', '8', '9'].map((n) => (
              <button
                key={n}
                onClick={() => handleKeyPress(n)}
                className="h-12 rounded-xl bg-[#F8F9FA] hover:bg-[#e5eeff] active:scale-95 flex items-center justify-center border border-[#E2E8F0] transition-transform"
                type="button"
              >
                <span className="font-heading text-lg font-bold text-[#0F172A]">{n}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="h-12 rounded-xl flex items-center justify-center text-[#565e74]">
              <span className="material-symbols-outlined text-2xl">fingerprint</span>
            </div>
            <button
              onClick={() => handleKeyPress('0')}
              className="h-12 rounded-xl bg-[#F8F9FA] hover:bg-[#e5eeff] active:scale-95 flex items-center justify-center border border-[#E2E8F0] transition-transform"
              type="button"
            >
              <span className="font-heading text-lg font-bold text-[#0F172A]">0</span>
            </button>
            <button
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-[#F8F9FA] hover:bg-[#e5eeff] active:scale-95 flex items-center justify-center text-[#0F172A] border border-[#E2E8F0] transition-transform"
              type="button"
              aria-label="Backspace"
            >
              <span className="material-symbols-outlined text-2xl">backspace</span>
            </button>
          </div>
        </div>

        {/* Bottom Security Notice */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-[#334155]">
          <span className="material-symbols-outlined text-sm text-[#16A34A]">verified_user</span>
          <span className="font-heading text-[10px] font-semibold">256-Bit Encrypted Security Token</span>
        </div>
      </main>
    </div>
  );
};
