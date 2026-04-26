'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play, Clock, Flame, CheckCircle, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const categoryExercises: Record<string, any[]> = {
  bodyweight: [
    { id: 1, name: 'Push-ups', duration: 30, calories: 50, video: 'https://www.youtube.com/embed/IODxDxX7oi4', premium: false },
    { id: 2, name: 'Squats', duration: 45, calories: 70, video: 'https://www.youtube.com/embed/YaXPRqUwItQ', premium: false },
    { id: 3, name: 'Lunges', duration: 30, calories: 60, video: 'https://www.youtube.com/embed/D7KaRcUTQeE', premium: false },
    { id: 4, name: 'Plank', duration: 60, calories: 40, video: 'https://www.youtube.com/embed/ASdvN_XEl_c', premium: false },
    { id: 5, name: 'Burpees', duration: 45, calories: 100, video: 'https://www.youtube.com/embed/T2myxNRl5to', premium: true },
    { id: 6, name: 'Mountain Climbers', duration: 40, calories: 80, video: 'https://www.youtube.com/embed/nmwgirSmi8Q', premium: true },
  ],
  gym: [
    { id: 1, name: 'Bench Press', duration: 45, calories: 80, video: 'https://www.youtube.com/embed/2yJlJq7f1tQ', premium: false },
    { id: 2, name: 'Deadlift', duration: 40, calories: 100, video: 'https://www.youtube.com/embed/op9kVnSso6Q', premium: false },
    { id: 3, name: 'Squats (Barbell)', duration: 50, calories: 90, video: 'https://www.youtube.com/embed/gcNh17Ckjgg', premium: false },
    { id: 4, name: 'Pull-ups', duration: 30, calories: 60, video: 'https://www.youtube.com/embed/eGo4IYlbE5g', premium: true },
    { id: 5, name: 'Overhead Press', duration: 35, calories: 70, video: 'https://www.youtube.com/embed/2yjwXTZQDDI', premium: true },
  ],
  yoga: [
    { id: 1, name: 'Sun Salutation', duration: 15, calories: 30, video: 'https://www.youtube.com/embed/Z7e24p6gJ0E', premium: false },
    { id: 2, name: 'Downward Dog', duration: 10, calories: 20, video: 'https://www.youtube.com/embed/m4i7F1q51a4', premium: false },
    { id: 3, name: 'Warrior Pose', duration: 20, calories: 35, video: 'https://www.youtube.com/embed/v7AYKMP6rOE', premium: false },
    { id: 4, name: 'Tree Pose', duration: 15, calories: 25, video: 'https://www.youtube.com/embed/V0hH7V4Y0kI', premium: true },
  ],
  cardio: [
    { id: 1, name: 'Jumping Jacks', duration: 30, calories: 60, video: 'https://www.youtube.com/embed/_Q_1qTfL3fY', premium: false },
    { id: 2, name: 'High Knees', duration: 30, calories: 70, video: 'https://www.youtube.com/embed/_Q_1qTfL3fY', premium: false },
    { id: 3, name: 'Box Jumps', duration: 40, calories: 90, video: 'https://www.youtube.com/embed/5KQvV8z3q0I', premium: true },
    { id: 4, name: 'Sprint Intervals', duration: 25, calories: 100, video: 'https://www.youtube.com/embed/ml6cT4AZdqI', premium: true },
  ],
};

export default function WorkoutCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData);
    };

    fetchProfile();
  }, []);

  const exercises = categoryExercises[categoryId] || [];
  const categoryNames: Record<string, string> = {
    bodyweight: 'Bodyweight',
    gym: 'Gym Sessions',
    yoga: 'Yoga & Flexibility',
    cardio: 'Cardio',
  };

  const handleExerciseClick = (exercise: any) => {
    if (exercise.premium && profile?.subscription_plan !== 'elite') {
      router.push('/subscription');
      return;
    }
    router.push(`/workout/exercise/${exercise.id}`);
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
          <h1 className="text-2xl font-bold text-white">{categoryNames[categoryId] || 'Workouts'}</h1>
        </motion.div>

        {/* Exercises List */}
        <div className="space-y-4">
          {exercises.map((exercise, index) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExerciseClick(exercise)}
              className="glass-card rounded-2xl p-4 border border-white/10 cursor-pointer relative"
            >
              {exercise.premium && profile?.subscription_plan !== 'elite' && (
                <div className="absolute top-3 right-3">
                  <Lock className="w-5 h-5 text-yellow-400" />
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">{exercise.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{exercise.duration}s</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      <span>{exercise.calories} kcal</span>
                    </div>
                  </div>
                </div>
                {completedExercises.has(exercise.id) && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
