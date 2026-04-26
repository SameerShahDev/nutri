'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Footprints, Droplet, Moon, Crown, MessageCircle, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [profile, setProfile] = useState<any>(null);
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [dailyStats, setDailyStats] = useState({ steps: 0, water: 0, sleep: 0 });
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) setProfile(profileData);

        // Fetch today's macros
        const today = new Date().toISOString().split('T')[0];
        const { data: logs } = await supabase
          .from('daily_logs')
          .select('calories, macros, water_intake')
          .eq('user_id', user.id)
          .eq('log_date', today);

        if (logs) {
          const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);
          const totalProtein = logs.reduce((sum, log) => sum + (log.macros?.protein || 0), 0);
          const totalCarbs = logs.reduce((sum, log) => sum + (log.macros?.carbs || 0), 0);
          const totalFats = logs.reduce((sum, log) => sum + (log.macros?.fats || 0), 0);
          const totalWater = logs.reduce((sum, log) => sum + (log.water_intake || 0), 0);
          setMacros({ calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fats: totalFats });
          setDailyStats(prev => ({ ...prev, water: totalWater }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const macroGoals = { 
    calories: profile?.calorie_goal || 2000, 
    protein: 150, 
    carbs: 250, 
    fats: 65 
  };

  const waterGoal = profile?.water_goal || 2000;

  const addWater = async (amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      await supabase.from('daily_logs').insert({
        user_id: user.id,
        food_name: 'Water',
        calories: 0,
        macros: { protein: 0, carbs: 0, fats: 0 },
        water_intake: amount,
        type: 'manual',
      });

      setDailyStats(prev => ({ ...prev, water: prev.water + amount }));
    } catch (error) {
      console.error('Error adding water:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-4 pb-24">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0a0e1a] to-[#0a0e1a]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />

      <div className="relative z-10 space-y-4 max-w-lg mx-auto">
        {/* Upgrade Badge */}
        {profile?.subscription_plan === 'free' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-4 right-4 z-50"
          >
            <motion.button
              animate={{
                boxShadow: [
                  '0 0 20px rgba(234, 179, 8, 0.3)',
                  '0 0 40px rgba(234, 179, 8, 0.5)',
                  '0 0 20px rgba(234, 179, 8, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              onClick={() => router.push('/subscription')}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-lg"
            >
              Upgrade to Elite
            </motion.button>
          </motion.div>
        )}

        {/* AI Greeting Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 border border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 15px rgba(168, 85, 247, 0.3)',
                  '0 0 30px rgba(168, 85, 247, 0.6)',
                  '0 0 15px rgba(168, 85, 247, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0"
            >
              <BrainCircuit className="w-6 h-6 text-white" />
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-gray-400 text-xs">Let's hit your goals today.</p>
            </div>
          </div>
        </motion.div>

        {/* Macro Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Today's Macros</h2>
            <span className="text-xs text-gray-400">{Math.round((macros.calories / macroGoals.calories) * 100)}%</span>
          </div>
          
          <div className="space-y-3">
            {/* Calories */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Calories</span>
                <span className="text-white font-semibold text-xs">{macros.calories} / {macroGoals.calories}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((macros.calories / macroGoals.calories) * 100, 100)}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                />
              </div>
            </div>

            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Protein</span>
                <span className="text-white font-semibold text-xs">{macros.protein.toFixed(0)}g / {macroGoals.protein}g</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((macros.protein / macroGoals.protein) * 100, 100)}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full"
                />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Carbs</span>
                <span className="text-white font-semibold text-xs">{macros.carbs.toFixed(0)}g / {macroGoals.carbs}g</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((macros.carbs / macroGoals.carbs) * 100, 100)}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-green-600 to-emerald-600 rounded-full"
                />
              </div>
            </div>

            {/* Fats */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Fats</span>
                <span className="text-white font-semibold text-xs">{macros.fats.toFixed(0)}g / {macroGoals.fats}g</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((macros.fats / macroGoals.fats) * 100, 100)}%` }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Coach Arnie Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <motion.div
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              background: 'linear-gradient(90deg, #a855f7, #ec4899, #a855f7)',
              backgroundSize: '200% 200%',
            }}
            className="absolute inset-0 rounded-2xl blur-md opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push('/chat')}
            className="relative glass-card rounded-2xl p-4 border border-white/20 w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-white font-semibold text-sm">Ask Coach Arnie</p>
                <p className="text-gray-400 text-xs">Get instant nutrition advice</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </motion.button>
        </motion.div>

        {/* Daily Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          {/* Steps */}
          <div className="glass-card rounded-xl p-3 border border-white/10 text-center">
            <Footprints className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{dailyStats.steps}</p>
            <p className="text-gray-400 text-[10px]">Steps</p>
          </div>

          {/* Water */}
          <div className="glass-card rounded-xl p-3 border border-white/10 text-center relative">
            <Droplet className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{dailyStats.water}</p>
            <p className="text-gray-400 text-[10px] mb-1">ml</p>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => addWater(250)}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Plus className="w-3 h-3 text-white" />
            </motion.button>
          </div>

          {/* Sleep */}
          <div className="glass-card rounded-xl p-3 border border-white/10 text-center">
            <Moon className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{dailyStats.sleep}h</p>
            <p className="text-gray-400 text-[10px]">Sleep</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
