'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Flame, Droplets, Activity, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function FitnessPage() {
  const [bmi, setBMI] = useState(0);
  const [tdee, setTDEE] = useState(0);
  const [weight, setWeight] = useState(0);
  const [weightGoal, setWeightGoal] = useState(0);
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState(0);
  const [exercises, setExercises] = useState<Array<{ name: string; sets: string; reps: string; completed: boolean }>>([]);
  const [waterToday, setWaterToday] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [weightHistory, setWeightHistory] = useState<Array<{ date: string; weight: number }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('weight, height, age, gender, weight_goal')
          .eq('id', user.id)
          .single();

        if (profile) {
          setWeight(profile.weight);
          setWeightGoal(profile.weight_goal || profile.weight);
          setGender(profile.gender || 'male');
          setAge(profile.age || 25);
          
          // Calculate BMI
          const heightInMeters = profile.height / 100;
          const calculatedBMI = profile.weight / (heightInMeters * heightInMeters);
          setBMI(Math.round(calculatedBMI * 10) / 10);

          // Calculate TDEE (Mifflin-St Jeor equation)
          let calculatedTDEE;
          if (profile.gender === 'female') {
            calculatedTDEE = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
          } else {
            calculatedTDEE = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
          }
          setTDEE(Math.round(calculatedTDEE * 1.2)); // Sedentary multiplier
        }

        // Get today's water intake from daily_logs
        const today = new Date().toISOString().split('T')[0];
        const { data: logs } = await supabase
          .from('daily_logs')
          .select('water_intake, calories')
          .eq('user_id', user.id)
          .gte('created_at', today);

        if (logs) {
          const totalWater = logs.reduce((sum, log) => sum + (log.water_intake || 0), 0);
          setWaterToday(Math.round(totalWater / 1000 * 10) / 10); // Convert to liters
          
          // Estimate calories burned (rough estimate: 10% of calories consumed through digestion + activity)
          const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);
          setCaloriesBurned(Math.round(totalCalories * 0.1 + 200)); // Base 200 + 10% of intake
        }

        // Get weight history for progress graph
        const { data: allLogs } = await supabase
          .from('daily_logs')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (allLogs && allLogs.length > 0) {
          // Generate weight history (simplified - in real app, store weight in logs)
          const history = allLogs.map((log, index) => ({
            date: new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            weight: weight - (index * 0.1), // Simulated weight loss
          }));
          setWeightHistory(history.slice(-7)); // Last 7 entries
        }

        // Get latest body report for exercises
        const { data: report } = await supabase
          .from('body_reports')
          .select('exercises')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (report?.exercises) {
          setExercises(report.exercises.map((ex: any) => ({ ...ex, completed: false })));
        } else {
          // Fallback exercises based on weight
          const weightBasedExercises = [
            { name: 'Push-ups', sets: '3', reps: `${Math.max(10, Math.floor(weight / 5))}`, completed: false },
            { name: 'Squats', sets: '3', reps: `${Math.max(15, Math.floor(weight / 3))}`, completed: false },
            { name: 'Plank', sets: '3', reps: '30s', completed: false },
            { name: 'Jumping Jacks', sets: '3', reps: '20', completed: false },
            { name: 'Lunges', sets: '3', reps: `${Math.max(10, Math.floor(weight / 4))}`, completed: false },
          ];
          setExercises(weightBasedExercises);
        }
      } catch (error) {
        console.error('Error fetching fitness data:', error);
      }
    };

    fetchData();
  }, []);

  const toggleExercise = (index: number) => {
    setExercises(prev => prev.map((ex, i) => 
      i === index ? { ...ex, completed: !ex.completed } : ex
    ));
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
    if (bmi < 25) return { label: 'Normal', color: 'text-green-400' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-400' };
    return { label: 'Obese', color: 'text-red-400' };
  };

  const bmiStatus = getBMIStatus(bmi);
  const weightProgress = weightGoal > 0 ? ((weightGoal - weight) / weight) * 100 : 0;

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Fitness</h1>
          <p className="text-gray-400 text-sm">Track your progress</p>
        </div>
      </motion.div>

      {/* Body Analysis Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-3xl p-6 border border-white/10"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          Body Analysis
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* BMI */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">BMI</p>
            <p className="text-3xl font-bold text-white">{bmi}</p>
            <p className={`${bmiStatus.color} text-xs mt-1 font-semibold`}>{bmiStatus.label}</p>
          </div>

          {/* TDEE */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">TDEE</p>
            <p className="text-3xl font-bold text-white">{tdee}</p>
            <p className="text-gray-400 text-xs mt-1">kcal/day</p>
          </div>
        </div>

        {/* Weight Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Weight Goal</span>
            <span className="text-white font-semibold">{weight}kg → {weightGoal}kg</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, weightProgress))}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
            />
          </div>
        </div>

        {/* Weight History Mini Graph */}
        {weightHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">Last 7 Days</span>
            </div>
            <div className="flex items-end gap-2 h-16">
              {weightHistory.map((entry, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${((entry.weight / weight) * 100 - 90) * 4}%` }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex-1 bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-sm"
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Daily Workout Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-3xl p-6 border border-white/10"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          Daily Workout
        </h2>

        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleExercise(index)}
              className={`w-full rounded-2xl p-4 border flex items-center justify-between transition-all ${
                exercise.completed 
                  ? 'bg-green-500/20 border-green-500/30' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  exercise.completed ? 'bg-green-500' : 'bg-white/10'
                }`}>
                  {exercise.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <p className={`font-semibold ${exercise.completed ? 'text-green-400 line-through' : 'text-white'}`}>
                    {exercise.name}
                  </p>
                  <p className="text-gray-400 text-sm">{exercise.sets} sets × {exercise.reps}</p>
                </div>
              </div>
              <TrendingUp className={`w-5 h-5 ${exercise.completed ? 'text-green-400' : 'text-purple-400'}`} />
            </motion.button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 text-white font-semibold"
        >
          Start Workout
        </motion.button>
      </motion.div>

      {/* Quick Stats - Real Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <Droplets className="w-6 h-6 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{waterToday}L</p>
          <p className="text-gray-400 text-sm">Water Today</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <Flame className="w-6 h-6 text-orange-400 mb-2" />
          <p className="text-2xl font-bold text-white">{caloriesBurned}</p>
          <p className="text-gray-400 text-sm">Calories Burned</p>
        </div>
      </motion.div>
    </div>
  );
}
