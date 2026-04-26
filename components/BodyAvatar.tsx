'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Droplets, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BodyReport {
  tdee: number;
  recommended_water: number;
  protein_target: number;
  exercises: Array<{ name: string; sets: string; reps: string }>;
}

export default function BodyAvatar() {
  const [bodyReport, setBodyReport] = useState<BodyReport | null>(null);
  const [dailyMission, setDailyMission] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get latest body report
        const { data: report } = await supabase
          .from('body_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (report) {
          setBodyReport(report);
        }

        // Generate daily mission
        const response = await fetch('/api/daily-mission', {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          setDailyMission(data.mission);
        }
      } catch (error) {
        console.error('Error fetching body data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-700 rounded-2xl" />
          <div className="h-4 bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-6 border border-white/10">
      {/* Avatar Visualization */}
      <div className="relative mb-6">
        <motion.div
          animate={{ 
            scale: [1, 1.02, 1],
            rotate: [0, 2, -2, 0],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.3)]"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl"
          >
            🏃
          </motion.div>
        </motion.div>
        
        {/* Progress Ring */}
        <svg className="absolute inset-0 w-32 h-32 mx-auto transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
            fill="none"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="60"
            stroke="url(#avatarGradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 0.75 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              strokeDasharray: 377,
              strokeDashoffset: 377 * 0.25,
            }}
          />
          <defs>
            <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Daily Mission */}
      {dailyMission && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-4 mb-6 border border-purple-500/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Today's Mission</h3>
          </div>
          <p className="text-gray-300 text-sm">{dailyMission}</p>
        </motion.div>
      )}

      {/* Body Stats */}
      {bodyReport && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 glass-button rounded-xl">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-gray-400 text-sm">TDEE</span>
            </div>
            <span className="text-white font-bold">{bodyReport.tdee} kcal</span>
          </div>

          <div className="flex items-center justify-between p-3 glass-button rounded-xl">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-sm">Water Goal</span>
            </div>
            <span className="text-white font-bold">{bodyReport.recommended_water}ml</span>
          </div>

          <div className="flex items-center justify-between p-3 glass-button rounded-xl">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Protein Target</span>
            </div>
            <span className="text-white font-bold">{bodyReport.protein_target}g</span>
          </div>

          {/* Exercises */}
          {bodyReport.exercises && bodyReport.exercises.length > 0 && (
            <div className="mt-4">
              <h4 className="text-white font-semibold mb-3">Recommended Exercises</h4>
              <div className="space-y-2">
                {bodyReport.exercises.map((exercise, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-button rounded-xl p-3"
                  >
                    <p className="text-white font-medium">{exercise.name}</p>
                    <p className="text-gray-400 text-sm">{exercise.sets} × {exercise.reps}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
