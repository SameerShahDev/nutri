'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Flame, Lock, Crown, Zap, Heart, Activity, Target, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function WorkoutPage() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalWorkouts: 0, streak: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) setProfile(profileData);

        // Fetch workout stats (using body_reports for now)
        const { data: reports } = await supabase
          .from('body_reports')
          .select('analysis_date')
          .eq('user_id', user.id);

        if (reports) {
          const totalWorkouts = reports.length;
          
          // Calculate streak
          const uniqueDays = new Set(reports.map(r => r.analysis_date));
          const sortedDays = Array.from(uniqueDays).sort().reverse();
          let streak = 0;
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

          if (sortedDays[0] === today || sortedDays[0] === yesterday) {
            streak = 1;
            for (let i = 1; i < sortedDays.length; i++) {
              const prevDate = new Date(sortedDays[i - 1]);
              const currDate = new Date(sortedDays[i]);
              const diffDays = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
              if (diffDays === 1) streak++;
              else break;
            }
          }

          setStats({ totalWorkouts, streak });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const categories = [
    { id: 'bodyweight', name: 'Bodyweight', icon: Dumbbell, color: 'from-blue-500 to-cyan-500' },
    { id: 'gym', name: 'Gym Sessions', icon: Dumbbell, color: 'from-purple-500 to-pink-500' },
    { id: 'yoga', name: 'Yoga & Flexibility', icon: Heart, color: 'from-green-500 to-emerald-500' },
    { id: 'cardio', name: 'Cardio', icon: Activity, color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-6 pb-24">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0e1a] to-[#0a0e1a]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />

      <div className="relative z-10 space-y-6">
        {/* Futuristic Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-white mb-2">My Workouts</h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-sm"
          >
            AI is optimizing your next session.
          </motion.p>
        </motion.div>

        {/* AI Suggested Workout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
          <div className="relative p-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="text-yellow-300 text-xs font-bold uppercase tracking-wider">AI Recommended</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Full Body Blast</h2>
            <p className="text-white/80 text-sm mb-4">45 minutes • Intermediate • 350 kcal</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl text-white font-semibold flex items-center gap-2"
            >
              Start Workout
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Progress Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="glass-card rounded-2xl p-4 border border-white/10 text-center">
            <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
            <p className="text-gray-400 text-xs">Total Workouts</p>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-white/10 text-center">
            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.streak}</p>
            <p className="text-gray-400 text-xs">Day Streak</p>
          </div>
        </motion.div>

        {/* Workout Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-bold text-white mb-4">Workout Categories</h3>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-card rounded-2xl p-4 border border-white/10 cursor-pointer"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white font-semibold">{category.name}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Premium Locked Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-bold text-white mb-4">Elite Plans</h3>
          <div className="space-y-3">
            {profile?.subscription_plan !== 'elite' ? (
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="glass-card rounded-2xl p-4 border border-yellow-500/30 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 rounded-bl-xl">
                  <span className="text-xs font-bold text-white">UNLIMITED</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Arnie's Elite Series</p>
                    <p className="text-gray-400 text-sm">Custom AI workout plans</p>
                  </div>
                  <Crown className="w-5 h-5 text-yellow-400" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="glass-card rounded-2xl p-4 border border-green-500/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Arnie's Elite Series</p>
                    <p className="text-green-400 text-sm">Unlocked</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
