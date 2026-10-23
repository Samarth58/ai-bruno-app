import React, { useState } from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const SignUpScreen: React.FC<Props> = ({ onNavigate }) => {
  const [name, setName] = useState('Alex Mercer');
  const [email, setEmail] = useState('alex@ironstandard.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);

  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);

  const score = (hasLength ? 1 : 0) + (hasNumber ? 1 : 0) + (hasUpper ? 1 : 0);

  const getStrengthLabel = () => {
    if (score === 0) return { text: 'Uncalibrated', color: 'text-slate-400' };
    if (score === 1) return { text: 'Warmup Set', color: 'text-[#EA580C]' };
    if (score === 2) return { text: 'Working Weight', color: 'text-[#0284C7]' };
    return { text: 'PR Ready', color: 'text-[#16A34A]' };
  };

  const isMatch = confirmPassword.length > 0 && confirmPassword === password;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('equipment-setup');
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0F172A] font-body flex flex-col justify-between max-w-md mx-auto relative select-none">
      {/* Top back button */}
      <div className="fixed top-0 left-0 z-50 pt-safe px-4">
        <div className="h-16 flex items-center">
          <button
            aria-label="Go back"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-[0_1px_8px_rgba(15,23,42,0.06)] text-[#0F172A] hover:bg-[#dce9ff] transition-colors"
            onClick={() => onNavigate('welcome')}
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-8 bg-[#f8f9ff] px-4">
        {/* Header & Micro-stepper */}
        <div className="flex flex-col gap-1 mt-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-heading text-[10px] font-bold text-[#EA580C] uppercase tracking-wider bg-[#FFEDD5] px-2.5 py-1 rounded-full">
              Step 01 • Identity
            </span>
            <span className="font-heading text-xs font-semibold text-[#334155]">
              Calibration Prep
            </span>
          </div>
          <h1 className="font-heading text-[28px] font-bold text-[#0F172A] tracking-tight">
            Join the Rack
          </h1>
          <p className="font-body text-sm text-[#334155]">
            Scientific progressive overload tuned to your baseline.
          </p>
        </div>

        {/* Bruno Companion Mentorship Bubble */}
        <div className="relative bg-white rounded-2xl shadow-sm p-4 mb-5 border border-[#E2E8F0]">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden shadow-inner bg-[#FFEDD5]">
                <img
                  alt="Coach Bruno"
                  className="w-full h-full object-cover"
                  src={IMAGES.BRUNO_AVATAR_HEADSHOT}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/aistudio/Image_13_e2d7fa3b.png';
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#16A34A] rounded-full flex items-center justify-center shadow-sm">
                <span
                  className="material-symbols-outlined text-[13px] text-white"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-heading text-sm text-[#0F172A] font-bold">Coach Bruno</span>
                <span className="inline-flex items-center gap-1 font-heading text-[10px] font-bold text-[#EA580C] bg-[#FFEDD5] px-1.5 py-0.5 rounded-full">
                  <span
                    className="material-symbols-outlined text-[11px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    fitness_center
                  </span>{' '}
                  AI Coach
                </span>
              </div>
              <p className="font-body text-sm text-[#0F172A] leading-snug">
                “Let’s get your lifting profile started.{' '}
                <span className="font-bold text-[#EA580C]">No junk volume, ever.</span> Just pure, measurable progression.”
              </p>
            </div>
          </div>
        </div>

        {/* Form Module */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Lifter Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-heading text-xs font-semibold text-[#0F172A]" htmlFor="full-name">
              Lifter Name
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#565e74] text-[20px] pointer-events-none">
                person
              </span>
              <input
                className="w-full h-13 min-h-[52px] pl-11 pr-4 bg-white rounded-xl font-body text-sm text-[#0F172A] shadow-sm border border-[#E2E8F0] focus:border-[#16A34A] focus:outline-none"
                id="full-name"
                name="name"
                placeholder="Alex Mercer"
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="font-heading text-xs font-semibold text-[#0F172A]" htmlFor="email">
              Email Address
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#565e74] text-[20px] pointer-events-none">
                alternate_email
              </span>
              <input
                className="w-full h-13 min-h-[52px] pl-11 pr-4 bg-white rounded-xl font-body text-sm text-[#0F172A] shadow-sm border border-[#E2E8F0] focus:border-[#16A34A] focus:outline-none"
                id="email"
                name="email"
                placeholder="alex@ironstandard.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input & Dynamic Telemetry Meter */}
          <div className="flex flex-col gap-1.5">
            <label className="font-heading text-xs font-semibold text-[#0F172A]" htmlFor="password">
              Secure Passcode
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#565e74] text-[20px] pointer-events-none">
                lock
              </span>
              <input
                className="w-full h-13 min-h-[52px] pl-11 pr-12 bg-white rounded-xl font-body text-sm text-[#0F172A] shadow-sm border border-[#E2E8F0] focus:border-[#16A34A] focus:outline-none"
                id="password"
                name="password"
                placeholder="Create password"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                aria-label="Toggle password visibility"
                className="absolute right-2 w-11 h-11 flex items-center justify-center text-[#565e74] rounded-lg hover:text-[#0F172A] transition-colors"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Real-time Calibration Strength Meter */}
            <div className="bg-white p-3 rounded-xl mt-1 shadow-sm border border-[#E2E8F0] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-heading text-[10px] text-[#334155] uppercase font-bold">
                  Strength Baseline
                </span>
                <span className={`font-heading text-[10px] font-bold ${getStrengthLabel().color}`}>
                  {getStrengthLabel().text}
                </span>
              </div>

              {/* Segmented Gauge Bars */}
              <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
                <div
                  className={`h-full rounded-full transition-colors duration-300 ${
                    score >= 1 ? (score === 1 ? 'bg-[#EA580C]' : 'bg-[#16A34A]') : 'bg-[#dce9ff]'
                  }`}
                ></div>
                <div
                  className={`h-full rounded-full transition-colors duration-300 ${
                    score >= 2 ? 'bg-[#16A34A]' : 'bg-[#dce9ff]'
                  }`}
                ></div>
                <div
                  className={`h-full rounded-full transition-colors duration-300 ${
                    score === 3 ? 'bg-[#16A34A]' : 'bg-[#dce9ff]'
                  }`}
                ></div>
              </div>

              {/* Metric Criteria Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-heading text-[10px] transition-colors ${
                    hasLength
                      ? 'bg-[#DCFCE7] text-[#16A34A] font-bold'
                      : 'bg-[#e5eeff] text-[#334155]'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[13px]"
                    style={{ fontVariationSettings: hasLength ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {hasLength ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  8+ characters
                </div>
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-heading text-[10px] transition-colors ${
                    hasNumber
                      ? 'bg-[#DCFCE7] text-[#16A34A] font-bold'
                      : 'bg-[#e5eeff] text-[#334155]'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[13px]"
                    style={{ fontVariationSettings: hasNumber ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {hasNumber ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  1+ number
                </div>
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-heading text-[10px] transition-colors ${
                    hasUpper
                      ? 'bg-[#DCFCE7] text-[#16A34A] font-bold'
                      : 'bg-[#e5eeff] text-[#334155]'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[13px]"
                    style={{ fontVariationSettings: hasUpper ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {hasUpper ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  1+ uppercase
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-heading text-xs font-semibold text-[#0F172A]" htmlFor="confirm-password">
              Confirm Passcode
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#565e74] text-[20px] pointer-events-none">
                verified_user
              </span>
              <input
                className="w-full h-13 min-h-[52px] pl-11 pr-12 bg-white rounded-xl font-body text-sm text-[#0F172A] shadow-sm border border-[#E2E8F0] focus:border-[#16A34A] focus:outline-none"
                id="confirm-password"
                name="confirm_password"
                placeholder="Re-enter password"
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {isMatch && (
                <div className="absolute right-3.5 flex items-center justify-center text-[#16A34A] pointer-events-none">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Legal Checkbox Pill Field */}
          <label className="group flex items-start gap-3 mt-1 cursor-pointer select-none">
            <div className="relative flex items-center justify-center shrink-0 w-6 h-6 mt-0.5">
              <input
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer sr-only"
                id="agree-terms"
                type="checkbox"
              />
              <div
                className={`w-6 h-6 rounded-lg transition-colors flex items-center justify-center ${
                  agreed ? 'bg-[#16A34A]' : 'bg-[#dce9ff]'
                }`}
              >
                <span className="material-symbols-outlined text-white text-[18px] font-bold">
                  check
                </span>
              </div>
            </div>
            <span className="font-body text-xs text-[#334155] pt-0.5">
              I agree to the{' '}
              <a className="font-semibold text-[#0F172A] underline underline-offset-2" href="#terms">
                Terms of Service
              </a>{' '}
              &amp;{' '}
              <a className="font-semibold text-[#0F172A] underline underline-offset-2" href="#privacy">
                Privacy Policy
              </a>
              .
            </span>
          </label>

          {/* Primary CTA */}
          <button
            className="w-full min-h-[52px] h-14 mt-2 bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white font-heading text-sm font-semibold rounded-full shadow-md flex items-center justify-center gap-2 transition-all"
            id="submit-btn"
            type="submit"
          >
            <span>Create Account &amp; Begin Calibration</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </form>

        {/* Lifter Login Switch Node */}
        <div className="mt-6 flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <span className="font-body text-sm text-[#334155]">Already a lifter?</span>
            <button
              onClick={() => onNavigate('login')}
              className="inline-flex items-center font-heading text-sm font-bold text-[#16A34A] hover:text-[#15803D] transition-colors"
            >
              Log in →
            </button>
          </div>

          {/* Security/Data Guarantee Micro-chip */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e5eeff] rounded-full text-[#334155] font-heading text-[10px] font-semibold">
            <span className="material-symbols-outlined text-[14px] text-[#0284C7]">lock</span>
            100% Encrypted &amp; Ad-Free Training Protocol
          </div>
        </div>
      </main>
    </div>
  );
};
