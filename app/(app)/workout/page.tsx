'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Flame, Lock, Crown, Zap, Heart, Activity, Target, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function WorkoutPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalWorkouts: 0, streak: 0 });
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);
  const [quickLogData, setQuickLogData] = useState({ name: '', duration: '', calories: '' });

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

        // Fetch workout stats from workouts_history
        const { data: workouts } = await supabase
          .from('workouts_history')
          .select('workout_date, completed')
          .eq('user_id', user.id);

        if (workouts) {
          const totalWorkouts = workouts.filter(w => w.completed).length;
          
          // Calculate streak
          const uniqueDays = new Set(workouts.map(w => w.workout_date));
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

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/workout/category/${categoryId}`);
  };

  const handleStartWorkout = () => {
    router.push('/workout/exercise/1');
  };

  const handleQuickLogSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('workouts_history').insert({
        user_id: user.id,
        workout_name: quickLogData.name,
        category: 'manual',
        duration_minutes: parseInt(quickLogData.duration),
        calories_burned: parseInt(quickLogData.calories),
        exercises_completed: 1,
        total_exercises: 1,
        workout_date: new Date().toISOString().split('T')[0],
        completed: true,
      });

      setShowQuickLogModal(false);
      setQuickLogData({ name: '', duration: '', calories: '' });
      
      // Refresh stats
      const { data: workouts } = await supabase
        .from('workouts_history')
        .select('workout_date, completed')
        .eq('user_id', user.id);

      if (workouts) {
        const totalWorkouts = workouts.filter(w => w.completed).length;
        setStats(prev => ({ ...prev, totalWorkouts }));
      }
    } catch (error) {
      console.error('Error logging workout:', error);
    }
  };

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
              onClick={handleStartWorkout}
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
                  onClick={() => handleCategoryClick(category.id)}
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

        {/* Floating Quick Log Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowQuickLogModal(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)] z-40"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>

        {/* Quick Log Modal */}
        <AnimatePresence>
          {showQuickLogModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowQuickLogModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card rounded-3xl p-6 border border-white/10 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-white mb-4">Quick Log Workout</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Workout Name</label>
                    <input
                      type="text"
                      value={quickLogData.name}
                      onChange={(e) => setQuickLogData({ ...quickLogData, name: e.target.value })}
                      placeholder="e.g., Morning Run"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Duration (minutes)</label>
                    <input
                      type="number"
                      value={quickLogData.duration}
                      onChange={(e) => setQuickLogData({ ...quickLogData, duration: e.target.value })}
                      placeholder="30"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Calories Burned</label>
                    <input
                      type="number"
                      value={quickLogData.calories}
                      onChange={(e) => setQuickLogData({ ...quickLogData, calories: e.target.value })}
                      placeholder="200"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowQuickLogModal(false)}
                      className="flex-1 bg-white/10 py-3 rounded-xl text-white font-semibold"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleQuickLogSubmit}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-xl text-white font-semibold"
                    >
                      Save
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
