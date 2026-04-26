'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle, Flame, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const exerciseData: Record<number, any> = {
  1: { name: 'Push-ups', duration: 30, calories: 50, video: 'https://www.youtube.com/embed/IODxDxX7oi4' },
  2: { name: 'Squats', duration: 45, calories: 70, video: 'https://www.youtube.com/embed/YaXPRqUwItQ' },
  3: { name: 'Lunges', duration: 30, calories: 60, video: 'https://www.youtube.com/embed/D7KaRcUTQeE' },
  4: { name: 'Plank', duration: 60, calories: 40, video: 'https://www.youtube.com/embed/ASdvN_XEl_c' },
  5: { name: 'Burpees', duration: 45, calories: 100, video: 'https://www.youtube.com/embed/T2myxNRl5to' },
  6: { name: 'Mountain Climbers', duration: 40, calories: 80, video: 'https://www.youtube.com/embed/nmwgirSmi8Q' },
};

export default function ExercisePage() {
  const router = useRouter();
  const params = useParams();
  const exerciseId = parseInt(params.id as string);
  const exercise = exerciseData[exerciseId] || exerciseData[1];
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(exercise.duration);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const toggleTimer = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsPlaying(false);
            setIsCompleted(true);
            completeWorkout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setIsPlaying(true);
    }
  };

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setTimeLeft(exercise.duration);
    setIsCompleted(false);
  };

  const completeWorkout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('workouts_history').insert({
        user_id: user.id,
        workout_name: exercise.name,
        category: 'bodyweight',
        duration_minutes: Math.ceil(exercise.duration / 60),
        calories_burned: exercise.calories,
        exercises_completed: 1,
        total_exercises: 1,
        workout_date: new Date().toISOString().split('T')[0],
        completed: true,
      });
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-6 pb-24">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0e1a] to-[#0a0e1a]" />
      
      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-2xl font-bold text-white">{exercise.name}</h1>
        </motion.div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="aspect-video bg-black rounded-2xl overflow-hidden mb-6"
        >
          <iframe
            src={exercise.video}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </motion.div>

        {/* Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 border border-white/10 text-center mb-6"
        >
          <div className="text-6xl font-bold text-white mb-4 font-mono">
            {formatTime(timeLeft)}
          </div>
          <div className="flex items-center justify-center gap-6 text-gray-400 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{exercise.duration}s</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5" />
              <span>{exercise.calories} kcal</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetTimer}
              className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTimer}
              className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)]"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </motion.button>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-bold text-white mb-3">Instructions</h3>
          <ul className="space-y-2 text-gray-400">
            <li>• Maintain proper form throughout the exercise</li>
            <li>• Breathe steadily and rhythmically</li>
            <li>• Stop if you feel any pain or discomfort</li>
            <li>• Stay hydrated before and after the workout</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
