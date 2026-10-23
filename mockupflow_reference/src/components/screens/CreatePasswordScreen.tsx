import React, { useState } from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const CreatePasswordScreen: React.FC<Props> = ({ onNavigate }) => {
  const [newPassword, setNewPassword] = useState('IronBeast2024');
  const [confirmPassword, setConfirmPassword] = useState('IronBeast2024');
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const metCount = (hasLength ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
  const isMatching = confirmPassword.length > 0 && confirmPassword === newPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('password-success');
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0F172A] font-body flex flex-col justify-between max-w-md mx-auto relative select-none">
      {/* Top back button */}
      <div className="fixed top-0 left-0 z-50 pt-safe px-4">
        <div className="h-16 flex items-center">
          <button
            aria-label="Go back"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-[0_1px_8px_rgba(15,23,42,0.06)] text-[#0F172A] hover:bg-[#dce9ff] transition-colors"
            onClick={() => onNavigate('otp')}
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-8 bg-[#f8f9ff] px-4">
        {/* Brand / Category Sub-header */}
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E0F2FE] text-[#0284C7]">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock_reset
            </span>
            <span className="font-heading text-[10px] font-bold uppercase tracking-wider">Account Security</span>
          </div>
          <span className="font-heading text-xs font-semibold text-[#565e74]">Step 2 of 2</span>
        </div>

        {/* Screen Heading */}
        <div className="mb-4">
          <h1 className="font-heading text-[26px] font-bold text-[#0F172A] tracking-tight">
            Create New Password
          </h1>
          <p className="font-body text-xs text-[#334155] mt-1 leading-relaxed">
            Strengthen your vault to lock in your daily gains and PR history.
          </p>
        </div>

        {/* Coach Bruno Speech Balloon Card */}
        <div className="relative bg-white rounded-2xl p-4 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.06)] mb-4 overflow-hidden border border-[#E2E8F0]">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#EA580C]"></div>
          <div className="flex items-start gap-3 pl-1.5">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full p-0.5 bg-[#EA580C] shadow-sm flex items-center justify-center">
                <img
                  alt="Coach Bruno"
                  className="w-full h-full rounded-full object-cover"
                  src={IMAGES.BRUNO_AVATAR_HEADSHOT}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/aistudio/Image_21_5cccc3af.png';
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#16A34A] flex items-center justify-center shadow">
                <span
                  className="material-symbols-outlined text-white text-xs"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  fitness_center
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-heading text-xs text-[#EA580C] font-bold uppercase tracking-wider">
                  Coach Bruno's Tip
                </span>
                <span className="font-heading text-[10px] text-[#565e74] bg-[#F8F9FA] px-2 py-0.5 rounded-full font-bold">
                  Pro Coach
                </span>
              </div>
              <p className="font-body text-xs text-[#0F172A] font-medium leading-snug">
                “Set a strong new password to protect your lifting logs and progression records.”
              </p>
            </div>
          </div>
        </div>

        {/* Form Card Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] space-y-4 mb-4">
          {/* New Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-heading text-xs font-semibold text-[#0F172A]" htmlFor="new-password">
                New Password
              </label>
              <span className="font-heading text-[10px] px-2 py-0.5 rounded-full bg-[#FFEDD5] text-[#EA580C] font-bold">
                {metCount >= 3 ? 'Iron Strong' : 'Good Progress'}
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                className="w-full h-12 pl-4 pr-12 rounded-xl bg-[#F8F9FA] border border-[#E2E8F0] font-heading text-sm text-[#0F172A] focus:border-[#16A34A] focus:outline-none transition-all"
                id="new-password"
                placeholder="Enter new password"
                type={showPass1 ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                aria-label="Toggle password visibility"
                className="absolute right-1 w-11 h-11 flex items-center justify-center text-[#334155] hover:text-[#0F172A] transition-colors"
                type="button"
                onClick={() => setShowPass1(!showPass1)}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPass1 ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Password Requirements Checklist */}
          <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-heading text-[10px] text-[#334155] uppercase tracking-wider font-bold">
                Security Benchmark
              </span>
              <span className="font-heading text-[10px] text-[#16A34A] font-bold">
                {metCount} of 3 met
              </span>
            </div>

            {/* Progress Bar Tracker */}
            <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
              <div
                className="h-full bg-[#16A34A] rounded-full transition-all duration-300"
                style={{ width: `${(metCount / 3) * 100}%` }}
              ></div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    hasLength ? 'bg-[#16A34A]' : 'bg-white border border-[#CBD5E1]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-xs ${
                      hasLength ? 'text-white' : 'text-[#6e7b6c]'
                    }`}
                    style={{ fontVariationSettings: hasLength ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {hasLength ? 'check' : 'radio_button_unchecked'}
                  </span>
                </div>
                <span className="font-body text-xs text-[#0F172A] font-medium">8+ characters</span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    hasNumber ? 'bg-[#16A34A]' : 'bg-white border border-[#CBD5E1]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-xs ${
                      hasNumber ? 'text-white' : 'text-[#6e7b6c]'
                    }`}
                    style={{ fontVariationSettings: hasNumber ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {hasNumber ? 'check' : 'radio_button_unchecked'}
                  </span>
                </div>
                <span className="font-body text-xs text-[#0F172A] font-medium">At least 1 number</span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    hasSpecial ? 'bg-[#16A34A]' : 'bg-white border border-[#CBD5E1]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-xs ${
                      hasSpecial ? 'text-white' : 'text-[#6e7b6c]'
                    }`}
                    style={{ fontVariationSettings: hasSpecial ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {hasSpecial ? 'check' : 'radio_button_unchecked'}
                  </span>
                </div>
                <span className="font-body text-xs text-[#565e74]">
                  At least 1 special character (e.g. !@#$)
                </span>
              </div>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-heading text-xs font-semibold text-[#0F172A]" htmlFor="confirm-password">
                Confirm New Password
              </label>
              <span className="font-heading text-[10px] text-[#565e74] flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-xs">
                  {isMatching ? 'check_circle' : 'pending'}
                </span>{' '}
                {isMatching ? 'Matching' : 'Enter matching password'}
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                className="w-full h-12 pl-4 pr-12 rounded-xl bg-[#F8F9FA] border border-[#E2E8F0] font-heading text-sm text-[#0F172A] focus:border-[#16A34A] focus:outline-none transition-all"
                id="confirm-password"
                placeholder="Re-enter your password"
                type={showPass2 ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                aria-label="Toggle confirm password visibility"
                className="absolute right-1 w-11 h-11 flex items-center justify-center text-[#334155] hover:text-[#0F172A] transition-colors"
                type="button"
                onClick={() => setShowPass2(!showPass2)}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPass2 ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            className="w-full h-13 min-h-[52px] rounded-full bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-white shadow-md font-heading text-sm font-semibold cursor-pointer"
            type="submit"
          >
            <span>Update Password &amp; Log In</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </form>

        {/* Security Telemetry Pill Strip */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A]">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
            <span className="font-heading text-[10px] font-bold">256-Bit Vault Sync</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0284C7]">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              cloud_sync
            </span>
            <span className="font-heading text-[10px] font-bold">PR History Safe</span>
          </div>
        </div>

        {/* Support */}
        <div className="text-center">
          <button
            onClick={() => onNavigate('ai-coach')}
            className="font-heading text-xs font-semibold text-[#565e74] hover:text-[#0F172A] transition-colors py-1.5 px-3 rounded-full"
            type="button"
          >
            Need assistance with your account?
          </button>
        </div>
      </main>
    </div>
  );
};
