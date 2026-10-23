import React, { useState } from 'react';
import { IMAGES } from '../../assets/images';
import { ScreenId } from '../../types';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

interface ChatMessage {
  id: string;
  sender: 'bruno' | 'user';
  text: string;
  time: string;
}

export const AICoachTab: React.FC<Props> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bruno',
      text: "Hey Alex! Coach Bruno here. What's on your mind? Need an exercise swap, warmup calculation, or joint cue for today's upper session?",
      time: '09:30 AM',
    },
    {
      id: '2',
      sender: 'user',
      text: 'My right shoulder feels slightly tight from overhead pressing last week. Any tips?',
      time: '09:31 AM',
    },
    {
      id: '3',
      sender: 'bruno',
      text: "I noticed that! I already flagged right shoulder impingement in your setup and swapped overhead work for Landmine Presses and 30° Incline DB presses. Tuck your elbows at 45° to protect the subacromial space. You'll get massive upper chest recruitment with zero impingement!",
      time: '09:31 AM',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const quickPrompts = [
    'How do I calculate warmup sets for 25kg dumbbells?',
    'What if the incline benches are taken today?',
    'Should I take a deload week next week?',
    'Check my weekly volume balance (MAV)',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: text.trim(),
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');

    // Generate smart Bruno coach response
    setTimeout(() => {
      let reply = "Solid question, Alex! Always protect your joint integrity. Keep that 2-second eccentric drop and let the target fibers do the work.";
      const lower = text.toLowerCase();
      if (lower.includes('warmup') || lower.includes('calculate')) {
        reply = "Here is your prescribed warmup pyramid: Set 1: 10kg × 12 reps (potentiation), Set 2: 17.5kg × 6 reps (groove bar path), Set 3: 22.5kg × 2 reps (neural prep). Then dive right into your 25kg working set!";
      } else if (lower.includes('taken') || lower.includes('busy') || lower.includes('swap')) {
        reply = "No problem at all! 1-Tap Swaps are ready: Switch to Low-Incline Barbell Bench (60 kg) or Machine Incline Chest Press (35 kg/side). Both match the identical clavicular fiber angle!";
      } else if (lower.includes('deload')) {
        reply = "Your CNS is at 95% and joint soreness was 1/10 today. You're in your peak adaptation window—let's finish Week 4 strong, and we'll schedule a structured 50% volume deload on Week 6!";
      } else if (lower.includes('volume') || lower.includes('mav')) {
        reply = "You're at 14/16 direct weekly sets for chest/shoulders, placing you squarely in the hyper-responsive MAV sweet spot (12-16 sets). Zero junk volume!";
      }

      const brunoMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bruno',
        text: reply,
        time: 'Just now',
      };
      setMessages((prev) => [...prev, brunoMsg]);
    }, 600);
  };

  return (
    <div className="flex flex-col w-full pb-28 pt-16 bg-[#f8f9ff]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#f8f9ff]/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#E2E8F0]">
        <div className="h-16 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-full bg-[#FFEDD5] flex items-center justify-center text-[#EA580C] overflow-hidden border border-[#FED7AA]">
              <img
                alt="Coach Bruno"
                className="w-full h-full object-cover"
                src={IMAGES.BRUNO_AVATAR_ROUND}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-base font-bold text-[#0F172A]">Coach Bruno</span>
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              </div>
              <span className="font-heading text-[10px] text-[#EA580C] font-bold uppercase tracking-wider">
                Live Gym Floor Spotter
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('active-workout')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#16A34A] text-white font-heading text-xs font-bold shadow-sm"
          >
            <span>Workout</span>
            <span className="material-symbols-outlined text-sm">fitness_center</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col w-full max-w-md mx-auto px-4 pt-2 pb-6 gap-3">
        {/* Quick prompt chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:border-[#16A34A] rounded-full text-xs font-body text-[#0F172A] whitespace-nowrap shadow-sm active:scale-95 transition-all shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat message stream */}
        <div className="space-y-3 pt-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {msg.sender === 'bruno' && (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FFEDD5] shrink-0 border border-[#FED7AA]">
                  <img
                    alt="Bruno"
                    className="w-full h-full object-cover"
                    src={IMAGES.BRUNO_AVATAR_HEADSHOT}
                  />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl p-3 shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-[#16A34A] text-white rounded-tr-none'
                    : 'bg-white text-[#0F172A] border border-[#E2E8F0] rounded-tl-none'
                }`}
              >
                <p className="font-body text-xs leading-relaxed">{msg.text}</p>
                <span
                  className={`block text-[10px] mt-1 font-heading ${
                    msg.sender === 'user' ? 'text-white/70 text-right' : 'text-[#565e74]'
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="sticky bottom-20 mt-2 bg-white rounded-2xl p-2 shadow-md border border-[#E2E8F0] flex items-center gap-2"
        >
          <input
            type="text"
            className="flex-1 h-10 px-3 bg-[#F8F9FA] rounded-xl font-body text-xs text-[#0F172A] focus:outline-none border border-[#E2E8F0]"
            placeholder="Ask Bruno anything about lifting, tempo, form..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center justify-center shadow-sm shrink-0 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-base">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
