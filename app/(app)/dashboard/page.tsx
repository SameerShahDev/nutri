'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Droplets, Plus, Camera, TrendingUp, Zap, Crown, X } from 'lucide-react';
import { playGulpSound, playSuccessSound, playCashSound } from '@/lib/sounds';
import { supabase } from '@/lib/supabase';
import FoodEntrySheet from '@/components/FoodEntrySheet';
import StreakCard from '@/components/StreakCard';
import FastingTimer from '@/components/FastingTimer';
import RapidGrid from '@/components/RapidGrid';
import Confetti from '@/components/Confetti';

export default function Dashboard() {
  const [calories, setCalories] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [water, setWater] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2000);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fats: 0 });
  const [isFoodSheetOpen, setIsFoodSheetOpen] = useState(false);
  const [isRapidGridOpen, setIsRapidGridOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchTodayData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];

        // Fetch today's logs
        const { data: logs } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', today)
          .order('created_at', { ascending: false });

        if (logs) {
          const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);
          const totalWater = logs.reduce((sum, log) => sum + (log.water_intake || 0), 0);
          const totalProtein = logs.reduce((sum, log) => sum + (log.macros?.protein || 0), 0);
          const totalCarbs = logs.reduce((sum, log) => sum + (log.macros?.carbs || 0), 0);
          const totalFats = logs.reduce((sum, log) => sum + (log.macros?.fats || 0), 0);

          setCalories(totalCalories);
          setWater(totalWater);
          setMacros({
            protein: Math.round(totalProtein * 10) / 10,
            carbs: Math.round(totalCarbs * 10) / 10,
            fats: Math.round(totalFats * 10) / 10,
          });
        }

        // Fetch user's calorie goal from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('calorie_goal, water_goal')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.calorie_goal) setCalorieGoal(profile.calorie_goal);
          if (profile.water_goal) setWaterGoal(profile.water_goal);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching today data:', error);
        setLoading(false);
      }
    };

    fetchTodayData();
  }, []);

  // Supabase Realtime subscription
  useEffect(() => {
    let channel: any = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const userId = user.id;
      const channelName = `dashboard-daily-logs-${Date.now()}`;

      channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { ack: true },
            presence: { key: userId },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'daily_logs',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            // Update state immediately from the payload (real-time, no fetch needed)
            const newLog = payload.new as any;
            
            setCalories(prev => prev + (newLog.calories || 0));
            setWater(prev => prev + (newLog.water_intake || 0));
            setMacros(prev => ({
              protein: Math.round((prev.protein + (newLog.macros?.protein || 0)) * 10) / 10,
              carbs: Math.round((prev.carbs + (newLog.macros?.carbs || 0)) * 10) / 10,
              fats: Math.round((prev.fats + (newLog.macros?.fats || 0)) * 10) / 10,
            }));

            // Trigger confetti and sound on new food log
            if (newLog.calories > 0) {
              playSuccessSound();
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 3000);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Subscription error:', status);
          }
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const calorieProgress = calories / calorieGoal;
  const waterProgress = water / waterGoal;

  const springButton = {
    whileTap: { scale: 0.95 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  };

  const handleAddWater = () => {
    playGulpSound();
    playSuccessSound();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    setWater(prev => Math.min(prev + 250, waterGoal));
  };

  const handleScanFood = () => {
    playSuccessSound();
    setCalories(prev => Math.min(prev + 350, calorieGoal));
  };

  const handleUpgrade = () => {
    playCashSound();
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Radial gradient background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0a0e1a] to-[#0a0e1a]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />
      
      <div className="relative z-10 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Dashboard</h1>
            <p className="text-gray-400">Track your daily nutrition</p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Calories - Large Card with Glowing Progress */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="col-span-2 md:col-span-1 bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 relative overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-400" />
                <h3 className="text-white font-semibold">Calories</h3>
              </div>

              <div className="relative w-48 h-48 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#calorieGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: calorieProgress }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{
                      strokeDasharray: 553,
                      strokeDashoffset: 553 * (1 - calorieProgress),
                      filter: 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.5))',
                    }}
                  />
                  <defs>
                    <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                    className="text-4xl font-bold text-white"
                  >
                    {calories}
                  </motion.p>
                  <p className="text-gray-400 text-sm">of {calorieGoal} kcal</p>
                </div>
              </div>
            </motion.div>

            {/* Water Tracker with Liquid Wave */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 relative overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4">
                <Droplets className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Water</h3>
              </div>

              {/* Liquid Wave Animation in Circle */}
              <div className="relative w-36 h-36 mx-auto rounded-full overflow-hidden bg-gray-800/50 mb-4 border border-white/10">
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400"
                  initial={{ y: 100 }}
                  animate={{ y: 100 - (waterProgress * 100) }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{ height: '150%' }}
                >
                  {/* Wave effect */}
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-6 bg-blue-300/30"
                    animate={{
                      x: ['-100%', '100%'],
                      rotate: [-10, 10, -10],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{
                      transformOrigin: 'center',
                    }}
                  />
                  <motion.div
                    className="absolute top-2 left-0 right-0 h-4 bg-blue-200/20"
                    animate={{
                      x: ['100%', '-100%'],
                      rotate: [10, -10, 10],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{
                      transformOrigin: 'center',
                    }}
                  />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white z-10 tracking-tight">{water}ml</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddWater}
                className="w-full bg-white/10 backdrop-blur-md py-3 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 border border-white/10 hover:bg-white/15 transition-colors shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add 250ml
              </motion.button>
            </motion.div>

            {/* Macros with Neon Glow Progress Bars */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">Macros</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Protein</span>
                    <span className="text-white font-semibold">{macros.protein}g</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(macros.protein / 150) * 100}%` }}
                      transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Carbs</span>
                    <span className="text-white font-semibold">{macros.carbs}g</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(macros.carbs / 250) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Fats</span>
                    <span className="text-white font-semibold">{macros.fats}g</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(macros.fats / 70) * 100}%` }}
                      transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Streak Card */}
            <StreakCard />

            {/* Fasting Timer */}
            <FastingTimer />

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="col-span-2 bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Quick Actions</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpgrade}
                  className="bg-white/10 backdrop-blur-md p-6 rounded-2xl text-left border border-white/10 hover:bg-white/15 transition-colors shadow-lg flex items-center gap-4"
                >
                  <Crown className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-white font-bold text-lg">Upgrade to Premium</p>
                    <p className="text-gray-400 text-sm">Unlock AI features & unlimited scans</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Food Entry Bottom Sheet */}
          <FoodEntrySheet
            isOpen={isFoodSheetOpen}
            onClose={() => setIsFoodSheetOpen(false)}
          />

          {/* Floating Action Button */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsRapidGridOpen(true)}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)] z-40"
          >
            <Plus className="w-8 h-8 text-white" />
          </motion.button>

          {/* RapidGrid Bottom Sheet */}
          <AnimatePresence>
            {isRapidGridOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsRapidGridOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                />

                {/* Sheet */}
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 bg-[#0a0e1a] rounded-t-3xl z-[60] max-h-[85vh] overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Quick Add</h2>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsRapidGridOpen(false)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>

                  {/* RapidGrid Content */}
                  <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
                    <RapidGrid />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Confetti Burst */}
          <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
        </div>
      </div>
    </div>
  );
}
