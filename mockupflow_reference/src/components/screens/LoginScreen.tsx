import React, { useState } from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const LoginScreen: React.FC<Props> = ({ onNavigate }) => {
  const [email, setEmail] = useState('alex.lift@ironclub.com');
  const [password, setPassword] = useState('IronStrength2024!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = /\S+@\S+\.\S+/.test(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onNavigate('home');
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
            onClick={() => onNavigate('welcome')}
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-8 bg-[#f8f9ff] px-4">
        {/* Subtle decorative kinetic aura */}
        <div className="relative w-full overflow-hidden flex flex-col items-center">
          <div className="absolute -top-12 w-64 h-64 bg-[#DCFCE7]/50 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute top-28 -right-10 w-48 h-48 bg-[#FFEDD5]/40 rounded-full blur-2xl pointer-events-none -z-10"></div>

          {/* Coach Bruno Welcome Mascot Unit */}
          <div className="w-full max-w-sm mt-2 mb-5 flex items-center gap-4 bg-white rounded-2xl p-4 shadow-[0_8px_24px_-4px_rgba(22,163,74,0.08),0_2px_8px_-2px_rgba(15,23,42,0.04)] border border-[#E2E8F0] relative">
            {/* Mascot Avatar with Coach Bruno Brand Ring */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full p-1 bg-[#EA580C] flex items-center justify-center shadow-md">
                <img
                  alt="Bruno the athletic coaching bear mascot"
                  className="w-full h-full object-cover rounded-full bg-[#FFEDD5]"
                  src={IMAGES.BRUNO_AVATAR_HEADSHOT}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/aistudio/Image_15_28a7b536.png';
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#16A34A] rounded-full flex items-center justify-center text-white shadow-sm">
                <span
                  className="material-symbols-outlined text-xs leading-none"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  fitness_center
                </span>
              </div>
            </div>

            {/* Bruno Speech Bubble Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-heading text-[10px] font-bold text-[#EA580C] uppercase tracking-wider">
                  Coach Bruno
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-ping"></span>
              </div>
              <p className="font-body text-sm text-[#0F172A] font-medium leading-snug">
                “Welcome back, lifter! Ready to hit the iron?”
              </p>
            </div>
          </div>

          {/* Main Auth Card */}
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.06),0_2px_8px_0_rgba(15,23,42,0.02)] border border-[#E2E8F0] flex flex-col gap-4">
            {/* Title & Context */}
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-2xl font-bold text-[#0F172A]">
                Power Up
              </h1>
              <p className="font-body text-xs text-[#565e74]">
                Track workouts, sync with your coach, and break records.
              </p>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {/* Email Input Field */}
              <div className="flex flex-col gap-1.5">
                <label className="font-heading text-xs font-semibold text-[#0F172A]" htmlFor="emailInput">
                  Athletic ID / Email
                </label>
                <div className="relative flex items-center rounded-xl bg-[#F8F9FA] border border-[#E2E8F0] focus-within:border-[#16A34A] transition-all">
                  <div className="w-12 h-12 flex items-center justify-center text-[#565e74]">
                    <span className="material-symbols-outlined text-xl">mail</span>
                  </div>
                  <input
                    className="w-full h-12 bg-transparent text-[#0F172A] font-body text-sm placeholder:text-[#565e74]/50 focus:outline-none pr-11"
                    id="emailInput"
                    placeholder="athlete@gym.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {/* Validation Check Node */}
                  {isValidEmail && (
                    <div className="absolute right-3.5 w-6 h-6 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#16A34A] transition-transform">
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Password Input Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-heading text-xs font-semibold text-[#0F172A]" htmlFor="passwordInput">
                    Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('recovery')}
                    className="font-heading text-[11px] font-semibold text-[#16A34A] hover:text-[#15803D] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center rounded-xl bg-[#F8F9FA] border border-[#E2E8F0] focus-within:border-[#16A34A] transition-all">
                  <div className="w-12 h-12 flex items-center justify-center text-[#565e74]">
                    <span className="material-symbols-outlined text-xl">lock</span>
                  </div>
                  <input
                    className="w-full h-12 bg-transparent text-[#0F172A] font-body text-sm placeholder:text-[#565e74]/50 focus:outline-none pr-12"
                    id="passwordInput"
                    placeholder="Enter your password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    aria-label="Toggle password visibility"
                    className="absolute right-1 w-11 h-11 flex items-center justify-center text-[#565e74] hover:text-[#0F172A] rounded-full transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Primary Action CTA */}
              <button
                className="w-full h-14 mt-1 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-heading text-sm font-semibold shadow-[0_10px_20px_-4px_rgba(22,163,74,0.35)] flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                    <span>Loading Bruno AI...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In with Bruno</span>
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Alternative Quick Auth Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="w-full h-[1px] bg-[#E2E8F0]"></div>
              <span className="absolute px-3 bg-white font-heading text-[10px] font-bold text-[#565e74] uppercase">
                Or continue with
              </span>
            </div>

            {/* Quick Auth Providers (Google & Apple) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate('home')}
                className="h-12 px-3 rounded-xl bg-[#F8F9FA] hover:bg-[#e5eeff] transition-colors flex items-center justify-center gap-2 text-[#0F172A] border border-[#E2E8F0] shadow-sm active:scale-[0.98]"
                type="button"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    fill="#4285F4"
                  ></path>
                  <path
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                    fill="#34A853"
                  ></path>
                  <path
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15Z"
                    fill="#FBBC05"
                  ></path>
                  <path
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    fill="#EA4335"
                  ></path>
                </svg>
                <span className="font-heading text-xs font-semibold">Google</span>
              </button>

              <button
                onClick={() => onNavigate('home')}
                className="h-12 px-3 rounded-xl bg-[#F8F9FA] hover:bg-[#e5eeff] transition-colors flex items-center justify-center gap-2 text-[#0F172A] border border-[#E2E8F0] shadow-sm active:scale-[0.98]"
                type="button"
              >
                <svg className="w-5 h-5 flex-shrink-0 fill-current text-[#0F172A]" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.89c.65-.8 1.09-1.92.97-3.04-.95.04-2.09.64-2.76 1.43-.59.68-1.11 1.79-.97 2.87 1.05.08 2.11-.47 2.76-1.26Z"></path>
                </svg>
                <span className="font-heading text-xs font-semibold">Apple</span>
              </button>
            </div>
          </div>

          {/* Bottom Sign-Up Link */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-center">
            <span className="font-body text-sm text-[#565e74]">Don't have an account?</span>
            <button
              onClick={() => onNavigate('signup')}
              className="font-heading text-sm font-bold text-[#16A34A] hover:underline"
              type="button"
            >
              Sign Up
            </button>
          </div>

          {/* Gym Session Quote / Micro Delight */}
          <div className="mt-4 flex items-center gap-2 py-1.5 px-3 rounded-full bg-[#DCFCE7]/60 text-[#16A34A] font-heading text-[11px] font-semibold">
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span>Streak active: 4 day lift consistency</span>
          </div>
        </div>
      </main>
    </div>
  );
};
