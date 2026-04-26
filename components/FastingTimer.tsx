'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Pause, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function FastingTimer() {
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [targetHours, setTargetHours] = useState(16);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: session } = await supabase
          .from('fasting_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (session) {
          setSessionId(session.id);
          setTargetHours(session.target_hours);
          setIsActive(true);
          
          // Calculate elapsed time
          const startTime = new Date(session.start_time);
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          setElapsedTime(elapsed);
        }
      } catch (error) {
        console.error('Error fetching fasting session:', error);
      }
    };

    fetchActiveSession();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (elapsedTime / (targetHours * 3600)) * 100;

  const handleStart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!isActive) {
        // Start new fast
        const { data: session } = await supabase
          .from('fasting_sessions')
          .insert({
            user_id: user.id,
            start_time: new Date().toISOString(),
            target_hours: targetHours,
            is_active: true,
          })
          .select()
          .single();

        if (session) {
          setSessionId(session.id);
          setElapsedTime(0);
        }
      } else {
        // Pause existing fast
        if (sessionId) {
          await supabase
            .from('fasting_sessions')
            .update({ is_active: false })
            .eq('id', sessionId);
        }
      }
      setIsActive(!isActive);
    } catch (error) {
      console.error('Error handling fast:', error);
    }
  };

  const handleReset = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (sessionId) {
        await supabase
          .from('fasting_sessions')
          .update({ is_active: false, completed: false })
          .eq('id', sessionId);
      }

      setIsActive(false);
      setElapsedTime(0);
      setSessionId(null);
    } catch (error) {
      console.error('Error resetting fast:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-3xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Fasting Timer
        </h2>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className={`p-2 rounded-xl ${
              isActive ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="p-2 rounded-xl bg-red-500/20 text-red-400"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="relative w-48 h-48 mx-auto mb-4">
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
            stroke="url(#fastingGradient)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ 
              pathLength: progress / 100,
              rotate: isActive ? 360 : 0,
            }}
            transition={{ 
              pathLength: { duration: 0.5 },
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            }}
            style={{
              strokeDasharray: 553,
              strokeDashoffset: 553 * (1 - progress / 100),
              filter: isActive ? 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.8))' : 'none',
            }}
          />
          <defs>
            <linearGradient id="fastingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-white">{formatTime(elapsedTime)}</p>
          <p className="text-gray-400 text-sm">of {targetHours}h target</p>
        </div>
      </div>

      {/* Target Selection */}
      <div className="flex gap-2 justify-center">
        {[12, 16, 18, 24].map((hours) => (
          <motion.button
            key={hours}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTargetHours(hours)}
            disabled={isActive}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              targetHours === hours
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'bg-white/10 text-gray-400'
            } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {hours}h
          </motion.button>
        ))}
      </div>

      {/* Status Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-center"
      >
        <p className="text-gray-400 text-sm">
          {isActive
            ? 'You\'re in the fasting zone! Keep going! 💪'
            : 'Start your fast to begin tracking'}
        </p>
      </motion.div>
    </motion.div>
  );
}
