import React, { useState } from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId, EquipmentState } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
  equipmentState: EquipmentState;
  setEquipmentState: React.Dispatch<React.SetStateAction<EquipmentState>>;
}

export const EquipmentSetupScreen: React.FC<Props> = ({
  onNavigate,
  equipmentState,
  setEquipmentState,
}) => {
  const [isCalibrating, setIsCalibrating] = useState(false);

  const handleFacilitySelect = (facility: 'commercial' | 'apartment' | 'garage') => {
    setEquipmentState((prev) => ({
      ...prev,
      facilityType: facility,
      maxDumbbellWeightKg: facility === 'commercial' ? 40 : facility === 'apartment' ? 20 : 32,
    }));
  };

  const toggleItem = (key: keyof EquipmentState) => {
    setEquipmentState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const adjustWeight = (delta: number) => {
    setEquipmentState((prev) => ({
      ...prev,
      maxDumbbellWeightKg: Math.max(12, Math.min(60, prev.maxDumbbellWeightKg + delta)),
    }));
  };

  const handleContinue = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      setIsCalibrating(false);
      onNavigate('home');
    }, 1100);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0F172A] font-body flex flex-col justify-between max-w-md mx-auto relative select-none">
      <main className="flex-1 flex flex-col relative w-full px-4 pb-10 pt-2">
        {/* Progress Header & Navigation */}
        <header className="flex items-center justify-between w-full pt-2 pb-4">
          <button
            aria-label="Go back"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[#e5eeff] hover:bg-[#dce9ff] transition-transform active:scale-95 text-[#0F172A]"
            type="button"
            onClick={() => onNavigate('signup')}
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>

          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-[10px] text-[#565e74] uppercase tracking-wider font-bold">
              Step 4 of 10
            </span>
            <div aria-hidden="true" className="flex items-center gap-1.5">
              <span className="w-5 h-1.5 rounded-full bg-[#16A34A]"></span>
              <span className="w-5 h-1.5 rounded-full bg-[#16A34A]"></span>
              <span className="w-5 h-1.5 rounded-full bg-[#16A34A]"></span>
              <span className="w-7 h-1.5 rounded-full bg-[#EA580C]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#d3e4fe]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#d3e4fe]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#d3e4fe]"></span>
            </div>
          </div>

          <div className="flex items-center justify-center px-3 py-1.5 rounded-full bg-[#FFEDD5] text-[#EA580C]">
            <span
              className="material-symbols-outlined text-xs mr-1"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              fitness_center
            </span>
            <span className="font-heading text-[10px] font-bold">SETUP</span>
          </div>
        </header>

        {/* Hero Coach Card with Speech Bubble */}
        <section className="relative w-full rounded-2xl bg-white shadow-sm p-4 mb-4 border border-[#E2E8F0] overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0 flex items-center justify-center w-28 h-36 rounded-xl bg-gradient-to-b from-[#FFEDD5] to-[#e5eeff] overflow-hidden shadow-inner">
              <img
                alt="Coach Bruno the friendly personal trainer bear"
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                src={IMAGES.BRUNO_HERO_FULL}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/Image_3_87c49442.png';
                }}
              />
              <div className="absolute bottom-1 right-1 bg-[#EA580C] text-white rounded-full p-1 shadow">
                <span
                  className="material-symbols-outlined text-[14px] block"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  forum
                </span>
              </div>
            </div>

            {/* Coach Dialogue Card */}
            <div className="relative flex-1 bg-[#F8F9FA] rounded-xl p-3.5 shadow-sm border border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-heading text-sm font-bold text-[#0F172A]">Coach Bruno</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FFEDD5] text-[#EA580C] font-heading text-[10px] font-bold">
                  Head Coach AI
                </span>
              </div>
              <p className="font-body text-xs text-[#334155] leading-relaxed">
                “Let’s check your equipment setup. What hardware do you actually have access to? No fluff—I’ll only program movements you can safely execute.”
              </p>
            </div>
          </div>
        </section>

        {/* Primary Facility Type Selection */}
        <section className="w-full mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-heading text-base font-bold text-[#0F172A]">Select Facility Type</h2>
            <span className="font-heading text-[10px] text-[#565e74] uppercase font-bold">Quick Profile</span>
          </div>

          <div className="space-y-2.5" role="radiogroup">
            {/* Commercial Gym */}
            <div
              className={`group flex items-start gap-3.5 p-3.5 rounded-xl bg-white shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.99] border ${
                equipmentState.facilityType === 'commercial'
                  ? 'border-[#16A34A] ring-2 ring-[#16A34A]'
                  : 'border-[#E2E8F0]'
              }`}
              onClick={() => handleFacilitySelect('commercial')}
            >
              <div
                className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  equipmentState.facilityType === 'commercial'
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-[#e5eeff] text-[#565e74]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[16px] font-bold ${
                    equipmentState.facilityType === 'commercial' ? '' : 'opacity-0'
                  }`}
                >
                  check
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-bold text-[#0F172A]">Commercial Gym</h3>
                  <span className="font-heading text-[10px] px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] font-bold">
                    Most Versatile
                  </span>
                </div>
                <p className="font-body text-xs text-[#334155] mt-0.5">
                  Full power rack, olympic barbells, dumbbells up to 50kg, dual adjustable cables, leg press.
                </p>
              </div>
            </div>

            {/* Apartment Gym */}
            <div
              className={`group flex items-start gap-3.5 p-3.5 rounded-xl bg-white shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.99] border ${
                equipmentState.facilityType === 'apartment'
                  ? 'border-[#16A34A] ring-2 ring-[#16A34A]'
                  : 'border-[#E2E8F0]'
              }`}
              onClick={() => handleFacilitySelect('apartment')}
            >
              <div
                className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  equipmentState.facilityType === 'apartment'
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-[#e5eeff] text-[#565e74]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[16px] font-bold ${
                    equipmentState.facilityType === 'apartment' ? '' : 'opacity-0'
                  }`}
                >
                  check
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-bold text-[#0F172A]">Apartment / Hotel Gym</h3>
                  <span className="font-heading text-[10px] px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#565e74] font-bold">
                    Moderate
                  </span>
                </div>
                <p className="font-body text-xs text-[#334155] mt-0.5">
                  Dumbbells up to 20kg, multi-functional cable pulley, adjustable utility bench.
                </p>
              </div>
            </div>

            {/* Home Garage Gym */}
            <div
              className={`group flex items-start gap-3.5 p-3.5 rounded-xl bg-white shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.99] border ${
                equipmentState.facilityType === 'garage'
                  ? 'border-[#16A34A] ring-2 ring-[#16A34A]'
                  : 'border-[#E2E8F0]'
              }`}
              onClick={() => handleFacilitySelect('garage')}
            >
              <div
                className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  equipmentState.facilityType === 'garage'
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-[#e5eeff] text-[#565e74]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[16px] font-bold ${
                    equipmentState.facilityType === 'garage' ? '' : 'opacity-0'
                  }`}
                >
                  check
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-bold text-[#0F172A]">Home Garage Gym</h3>
                  <span className="font-heading text-[10px] px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#565e74] font-bold">
                    Custom
                  </span>
                </div>
                <p className="font-body text-xs text-[#334155] mt-0.5">
                  Squat stand, standard barbell, bumper plates, pull-up bar, resistance bands.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Apparatus Checklist & Fine-Tuning */}
        <section className="w-full mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-heading text-base font-bold text-[#0F172A]">Apparatus Inventory</h2>
            <span className="font-heading text-[10px] text-[#0284C7] font-bold">Auto-Synced</span>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0] space-y-3">
            {/* Barbell & Power Rack */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#0F172A]">
                  <span className="material-symbols-outlined text-[20px]">sports_gymnastics</span>
                </div>
                <div>
                  <span className="font-heading text-sm font-bold text-[#0F172A] block leading-snug">
                    Barbell &amp; Power Rack
                  </span>
                  <span className="font-body text-xs text-[#334155]">Standard 20kg bar + safety pins</span>
                </div>
              </div>
              <button
                className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm transition-transform active:scale-90 ${
                  equipmentState.hasBarbellRack
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-[#e5eeff] text-[#565e74]'
                }`}
                onClick={() => toggleItem('hasBarbellRack')}
                type="button"
              >
                <span
                  className={`material-symbols-outlined text-base font-bold ${
                    equipmentState.hasBarbellRack ? '' : 'opacity-0'
                  }`}
                >
                  check
                </span>
              </button>
            </div>

            <div className="h-px bg-[#E2E8F0]"></div>

            {/* Dual Cable Stack */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#0F172A]">
                  <span className="material-symbols-outlined text-[20px]">reorder</span>
                </div>
                <div>
                  <span className="font-heading text-sm font-bold text-[#0F172A] block leading-snug">
                    Dual Cable Stack
                  </span>
                  <span className="font-body text-xs text-[#334155]">Adjustable ratio pulleys &amp; ropes</span>
                </div>
              </div>
              <button
                className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm transition-transform active:scale-90 ${
                  equipmentState.hasDualCable
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-[#e5eeff] text-[#565e74]'
                }`}
                onClick={() => toggleItem('hasDualCable')}
                type="button"
              >
                <span
                  className={`material-symbols-outlined text-base font-bold ${
                    equipmentState.hasDualCable ? '' : 'opacity-0'
                  }`}
                >
                  check
                </span>
              </button>
            </div>

            <div className="h-px bg-[#E2E8F0]"></div>

            {/* Dumbbell Rack with Stepper */}
            <div className="py-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#0F172A]">
                    <span className="material-symbols-outlined text-[20px]">fitness_center</span>
                  </div>
                  <div>
                    <span className="font-heading text-sm font-bold text-[#0F172A] block leading-snug">
                      Dumbbell Rack
                    </span>
                    <span className="font-body text-xs text-[#334155]">Pairs from 2kg upward</span>
                  </div>
                </div>
                <button
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm transition-transform active:scale-90 ${
                    equipmentState.hasDumbbells
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-[#e5eeff] text-[#565e74]'
                  }`}
                  onClick={() => toggleItem('hasDumbbells')}
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-base font-bold ${
                      equipmentState.hasDumbbells ? '' : 'opacity-0'
                    }`}
                  >
                    check
                  </span>
                </button>
              </div>

              {/* Integrated Max Load Stepper Component */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E2E8F0]">
                <span className="font-body text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#EA580C]">weight</span>
                  Heaviest Pair Available:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Decrease max dumbbell weight"
                    className="w-8 h-8 rounded-full bg-white hover:bg-[#e5eeff] flex items-center justify-center text-[#0F172A] shadow-sm border border-[#E2E8F0] active:scale-95 transition-transform"
                    onClick={() => adjustWeight(-2)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">remove</span>
                  </button>
                  <span className="font-heading text-sm font-bold text-[#0F172A] min-w-[56px] text-center tabular-nums">
                    {equipmentState.maxDumbbellWeightKg} kg
                  </span>
                  <button
                    aria-label="Increase max dumbbell weight"
                    className="w-8 h-8 rounded-full bg-white hover:bg-[#e5eeff] flex items-center justify-center text-[#0F172A] shadow-sm border border-[#E2E8F0] active:scale-95 transition-transform"
                    onClick={() => adjustWeight(2)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#E2E8F0]"></div>

            {/* Smith Machine */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#565e74]">
                  <span className="material-symbols-outlined text-[20px]">view_week</span>
                </div>
                <div>
                  <span className="font-heading text-sm font-bold text-[#0F172A] block leading-snug">
                    Smith Machine
                  </span>
                  <span className="font-body text-xs text-[#334155]">Fixed-axis barbell path</span>
                </div>
              </div>
              <button
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform active:scale-90 ${
                  equipmentState.hasSmithMachine
                    ? 'bg-[#16A34A] text-white shadow-sm'
                    : 'bg-[#e5eeff] text-[#565e74]'
                }`}
                onClick={() => toggleItem('hasSmithMachine')}
                type="button"
              >
                <span
                  className={`material-symbols-outlined text-base font-bold ${
                    equipmentState.hasSmithMachine ? '' : 'opacity-0'
                  }`}
                >
                  check
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Joint Restrictions Adaptive Preview Pill */}
        <aside className="w-full flex items-center gap-3 p-3.5 mb-4 rounded-xl bg-[#FFEDD5] border border-[#FED7AA] text-[#0F172A] shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">healing</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-[10px] font-bold uppercase text-[#EA580C] tracking-wide">
                Restriction Flagged
              </span>
            </div>
            <p className="font-body text-xs text-[#334155] leading-snug mt-0.5">
              <strong className="text-[#0F172A] font-semibold">Right shoulder impingement</strong> detected from Step 2. Auto-swapping standard Overhead Press for{' '}
              <span className="font-semibold text-[#EA580C]">Landmine Press &amp; High Incline DB Press</span>.
            </p>
          </div>
        </aside>

        {/* Primary Bottom Action CTA */}
        <div className="w-full pt-1">
          <button
            className="w-full min-h-[52px] py-3.5 px-6 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-heading text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] duration-150 cursor-pointer"
            onClick={handleContinue}
            type="button"
          >
            {isCalibrating ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                <span>Calibrating Routine...</span>
              </>
            ) : (
              <>
                <span>Confirm Hardware &amp; Continue (Step 5)</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
          <p className="text-center font-heading text-[10px] text-[#565e74] font-medium mt-2">
            Bruno calibrates warm-up sets and working loads based on your answers
          </p>
        </div>
      </main>
    </div>
  );
};
