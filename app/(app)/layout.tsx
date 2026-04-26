'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from '@/components/BottomNav';
import Home from './home/page';
import Dashboard from './dashboard/page';
import Fitness from './fitness/page';
import Workout from './workout/page';
import Logs from './logs/page';
import Profile from './profile/page';
import Chat from './chat/page';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Camera, Edit3, X } from 'lucide-react';

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes - this handles session persistence on refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        router.push('/auth/login');
        // Clear local storage on logout
        localStorage.removeItem('dailyStats');
        localStorage.removeItem('userWeight');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'workout':
        return <Workout />;
      case 'chat':
        return <Chat />;
      case 'profile':
        return <Profile />;
      default:
        return <Home />;
    }
  };

  const handleCenterClick = () => {
    setShowActionSheet(true);
  };

  const handleTakePhoto = () => {
    setShowActionSheet(false);
    setActiveTab('home');
    // Navigate to scan or open camera
    router.push('/scan');
  };

  const handleManualEntry = () => {
    setShowActionSheet(false);
    setActiveTab('home');
    // Trigger manual entry modal in home page via custom event
    window.dispatchEvent(new CustomEvent('openFoodEntryModal'));
  };

  return (
    <div className="min-h-screen bg-[#020617] pb-24">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Action Sheet */}
      <AnimatePresence>
        {showActionSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActionSheet(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#0a0e1a] border-t border-white/10 z-[60] rounded-t-3xl p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Log Food</h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowActionSheet(false)}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>
              <div className="space-y-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTakePhoto}
                  className="w-full glass-card rounded-2xl p-4 border border-white/10 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">Take Photo</p>
                    <p className="text-gray-400 text-sm">AI Food Scanner</p>
                  </div>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleManualEntry}
                  className="w-full glass-card rounded-2xl p-4 border border-white/10 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Edit3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">Manual Entry</p>
                    <p className="text-gray-400 text-sm">Log food manually</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onCenterClick={handleCenterClick} />
    </div>
  );
}
