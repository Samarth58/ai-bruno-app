import React from 'react';
import { ScreenId } from '../types';

interface Props {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export const BottomNav: React.FC<Props> = ({ activeScreen, onNavigate }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'fitness_center' },
    { id: 'workouts', label: 'Workouts', icon: 'event_note' },
    { id: 'progress', label: 'Progress', icon: 'trending_up' },
    { id: 'ai-coach', label: 'AI Coach', icon: 'auto_awesome' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-[#f8f9ff]/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)] border-t border-[#E2E8F0]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-1">
        {tabs.map((tab) => {
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id as ScreenId)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[48px] min-h-[48px] gap-0.5 transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#006b2c] font-bold'
                  : 'text-[#565e74] hover:text-[#0b1c30]'
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {tab.icon}
              </span>
              <span className="font-heading text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
