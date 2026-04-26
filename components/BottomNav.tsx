'use client';

import { motion } from 'framer-motion';
import { Home, Dumbbell, Plus, ClipboardList, User, MessageSquare } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'workout', icon: Dumbbell, label: 'Workout' },
    { id: 'scan', icon: Plus, label: 'Scan', isCenter: true },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#020617]/80 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-50">
      <div className="flex items-center justify-around h-20 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => onTabChange(tab.id)}
                className="relative -top-6"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1"
            >
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                className={`p-2 rounded-xl transition-colors ${
                  isActive ? 'bg-purple-600/20' : ''
                }`}
              >
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-purple-400' : 'text-gray-400'
                  }`}
                />
              </motion.div>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
