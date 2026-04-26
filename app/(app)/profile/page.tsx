'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Crown, Settings, LogOut, Award, Flame, Target, TrendingUp, Edit2, ChevronRight, ArrowLeft, Bell, Moon, Sun, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalMeals: 0, streakDays: 0, totalCalories: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editForm, setEditForm] = useState({ weight: '', height: '', full_name: '' });
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data);
          setEditForm({
            weight: data.weight?.toString() || '',
            height: data.height?.toString() || '',
            full_name: data.full_name || '',
          });
        }

        // Fetch stats
        const { data: logs } = await supabase
          .from('daily_logs')
          .select('calories, created_at')
          .eq('user_id', user.id);

        if (logs) {
          const totalMeals = logs.length;
          const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);
          
          // Calculate streak
          const uniqueDays = new Set(logs.map(log => new Date(log.created_at).toISOString().split('T')[0]));
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

          setStats({ totalMeals, streakDays: streak, totalCalories });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({
          weight: parseFloat(editForm.weight),
          height: parseFloat(editForm.height),
          full_name: editForm.full_name,
        })
        .eq('id', user.id);

      setProfile((prev: any) => ({ ...prev, ...editForm }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const getPlanInfo = (plan: string) => {
    const plans: Record<string, { name: string; color: string; photos: number; chats: number }> = {
      free: { name: 'Free', color: 'from-gray-500 to-gray-600', photos: 0, chats: 5 },
      starter: { name: 'Starter', color: 'from-blue-500 to-blue-600', photos: 5, chats: 10 },
      pro: { name: 'Pro', color: 'from-purple-500 to-purple-600', photos: 15, chats: 50 },
      elite: { name: 'Elite Unlimited', color: 'from-yellow-500 to-orange-500', photos: Infinity, chats: Infinity },
    };
    return plans[plan] || plans.free;
  };

  const planInfo = getPlanInfo(profile?.subscription_plan || 'free');

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <p className="text-gray-400 text-sm">Manage your account</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Edit2 className="w-5 h-5 text-white" />
        </motion.button>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-3xl p-6 border border-white/10"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="text-xl font-bold text-white bg-white/10 rounded-lg px-3 py-1 outline-none focus:border-purple-500"
                placeholder="Your name"
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{profile?.full_name || 'User'}</h2>
            )}
            <p className="text-gray-400 text-sm">{profile?.email || ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">Weight</p>
            {isEditing ? (
              <input
                type="number"
                value={editForm.weight}
                onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                className="text-2xl font-bold text-white bg-white/10 rounded-lg px-2 py-1 w-20 outline-none focus:border-purple-500"
              />
            ) : (
              <p className="text-2xl font-bold text-white">{profile?.weight || 0}kg</p>
            )}
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">Height</p>
            {isEditing ? (
              <input
                type="number"
                value={editForm.height}
                onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                className="text-2xl font-bold text-white bg-white/10 rounded-lg px-2 py-1 w-20 outline-none focus:border-purple-500"
              />
            ) : (
              <p className="text-2xl font-bold text-white">{profile?.height || 0}cm</p>
            )}
          </div>
        </div>

        {isEditing && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveProfile}
            className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-3 text-white font-semibold"
          >
            Save Changes
          </motion.button>
        )}
      </motion.div>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-3xl p-6 border border-white/10"
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h2 className="text-lg font-bold text-white">Your Stats</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.streakDays}</p>
            <p className="text-gray-400 text-xs">Day Streak</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
            <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.totalMeals}</p>
            <p className="text-gray-400 text-xs">Meals Logged</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
            <Award className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{(stats.totalCalories / 1000).toFixed(1)}k</p>
            <p className="text-gray-400 text-xs">Total kcal</p>
          </div>
        </div>
      </motion.div>

      {/* Subscription Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-3xl p-6 border border-white/10"
      >
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-6 h-6 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Subscription</h2>
        </div>

        <div className={`bg-gradient-to-r ${planInfo.color} rounded-2xl p-4 border border-white/20`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">{planInfo.name} Plan</p>
              <p className="text-white/70 text-sm">
                {planInfo.photos === Infinity ? 'Unlimited' : `${planInfo.photos} photos`} • {planInfo.chats === Infinity ? 'Unlimited' : `${planInfo.chats} chats`}
              </p>
            </div>
            <Award className="w-8 h-8 text-white" />
          </div>
        </div>

        {profile?.subscription_plan === 'free' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/subscription')}
            className="w-full mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-4 text-white font-semibold shadow-[0_0_20px_rgba(234,179,8,0.3)]"
          >
            View Premium Plans
          </motion.button>
        )}
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-3"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSettingsOpen(true)}
          className="w-full glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Settings className="w-5 h-5 text-gray-400" />
            <span className="text-white font-semibold">Settings</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="w-full glass-card rounded-2xl p-4 border border-red-500/20 flex items-center gap-4"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-semibold">Logout</span>
        </motion.button>
      </motion.div>

      {/* Settings Sheet */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Settings Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0e1a] z-[60] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-6 border-b border-white/10">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </motion.button>
                <h2 className="text-xl font-bold text-white">Settings</h2>
              </div>

              {/* Settings Content */}
              <div className="p-6 space-y-4">
                {/* Dark Mode */}
                <div className="glass-card rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {darkMode ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                      <span className="text-white font-semibold">Dark Mode</span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setDarkMode(!darkMode)}
                      className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-purple-600' : 'bg-gray-600'}`}
                    >
                      <motion.div
                        animate={{ x: darkMode ? 24 : 0 }}
                        className="w-5 h-5 bg-white rounded-full"
                      />
                    </motion.button>
                  </div>
                </div>

                {/* Notifications */}
                <div className="glass-card rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-semibold">Notifications</span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setNotifications(!notifications)}
                      className={`w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-blue-600' : 'bg-gray-600'}`}
                    >
                      <motion.div
                        animate={{ x: notifications ? 24 : 0 }}
                        className="w-5 h-5 bg-white rounded-full"
                      />
                    </motion.button>
                  </div>
                </div>

                {/* Help */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-full glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-green-400" />
                    <span className="text-white font-semibold">Help & Support</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </motion.button>

                {/* App Version */}
                <div className="text-center text-gray-500 text-sm pt-4">
                  <p>Igone v1.0.0</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
