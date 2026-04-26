'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Award, Trophy, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Achievement {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

export default function StreakCard() {
  const [streakDays, setStreakDays] = useState(0);
  const [totalMeals, setTotalMeals] = useState(0);
  const [badges, setBadges] = useState<Achievement[]>([]);

  useEffect(() => {
    const calculateRealStreak = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch all meal logs to calculate real streak
        const { data: logs } = await supabase
          .from('daily_logs')
          .select('created_at, water_intake')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (logs && logs.length > 0) {
          // Calculate unique days with meals
          const uniqueDays = new Set(
            logs.map(log => new Date(log.created_at).toISOString().split('T')[0])
          );
          
          // Calculate streak (consecutive days)
          const sortedDays = Array.from(uniqueDays).sort().reverse();
          let currentStreak = 0;
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

          if (sortedDays[0] === today || sortedDays[0] === yesterday) {
            currentStreak = 1;
            for (let i = 1; i < sortedDays.length; i++) {
              const prevDate = new Date(sortedDays[i - 1]);
              const currDate = new Date(sortedDays[i]);
              const diffDays = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
              
              if (diffDays === 1) {
                currentStreak++;
              } else {
                break;
              }
            }
          }

          setStreakDays(currentStreak);
          setTotalMeals(logs.length);

          // Calculate earned badges based on real data
          const earnedBadges: Achievement[] = [];
          if (logs.length >= 1) earnedBadges.push({ id: '1', name: 'First Meal', icon: '🍽️', earned: true });
          if (currentStreak >= 3) earnedBadges.push({ id: '2', name: '3 Day Streak', icon: '🔥', earned: true });
          if (currentStreak >= 7) earnedBadges.push({ id: '3', name: '7 Day Streak', icon: '⚡', earned: true });
          if (currentStreak >= 30) earnedBadges.push({ id: '4', name: '30 Day Streak', icon: '🏆', earned: true });
          if (logs.length >= 100) earnedBadges.push({ id: '5', name: '100 Meals', icon: '💯', earned: true });
          
          // Check for hydration hero (water intake >= 2L for 7 days)
          const waterLogs = logs.filter(log => log.water_intake && log.water_intake >= 2000);
          if (waterLogs.length >= 7) earnedBadges.push({ id: '6', name: 'Hydration Hero', icon: '💧', earned: true });

          setBadges(earnedBadges);

          // Update database with real values
          await supabase
            .from('user_achievements')
            .upsert({
              user_id: user.id,
              streak_days: currentStreak,
              total_meals_logged: logs.length,
              badges: earnedBadges,
              last_log_date: sortedDays[0],
            });
        }
      } catch (error) {
        console.error('Error calculating streak:', error);
      }
    };

    calculateRealStreak();
  }, []);

  const allBadges: Achievement[] = [
    { id: '1', name: 'First Meal', icon: '🍽️', earned: badges.some(b => b.id === '1') },
    { id: '2', name: '3 Day Streak', icon: '🔥', earned: badges.some(b => b.id === '2') },
    { id: '3', name: '7 Day Streak', icon: '⚡', earned: badges.some(b => b.id === '3') },
    { id: '4', name: '30 Day Streak', icon: '🏆', earned: badges.some(b => b.id === '4') },
    { id: '5', name: '100 Meals', icon: '💯', earned: badges.some(b => b.id === '5') },
    { id: '6', name: 'Hydration Hero', icon: '💧', earned: badges.some(b => b.id === '6') },
  ];

  const displayBadges = allBadges;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-3xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          Your Streak
        </h2>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-bold">{streakDays} days</span>
        </div>
      </div>

      {/* Streak Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Today's Progress</span>
          <span className="text-white font-semibold">{totalMeals} meals logged</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((totalMeals % 3) * 33, 100)}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
          />
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-3 gap-3">
        {displayBadges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border ${
              badge.earned
                ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30'
                : 'bg-white/5 border-white/10 opacity-50'
            }`}
          >
            <span className="text-xl mb-1">{badge.icon}</span>
            <span className="text-[10px] text-white text-center leading-tight">{badge.name}</span>
          </motion.div>
        ))}
      </div>

      {/* Motivational Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-center"
      >
        <p className="text-gray-400 text-sm">
          {streakDays === 0
            ? 'Start your streak today! Log your first meal.'
            : streakDays < 3
            ? 'Keep going! You\'re building momentum.'
            : streakDays < 7
            ? 'Great job! You\'re on fire! 🔥'
            : 'Amazing! You\'re crushing it! 💪'}
        </p>
      </motion.div>
    </motion.div>
  );
}
