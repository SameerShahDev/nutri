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

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
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
    if (activeTab === 'workout') {
      // Trigger quick log modal in workout page via a custom event or state
      setActiveTab('workout');
    } else {
      setActiveTab('workout');
    }
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
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onCenterClick={handleCenterClick} />
    </div>
  );
}
