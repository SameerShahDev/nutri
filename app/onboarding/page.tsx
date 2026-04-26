'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { playSuccessSound } from '@/lib/sounds';
import { supabase } from '@/lib/supabase';

type OnboardingStep = 'age' | 'weight' | 'height' | 'goals' | 'complete';

interface OnboardingData {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
  goals: string[];
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('age');
  const [data, setData] = useState<OnboardingData>({
    age: 0,
    weight: 0,
    height: 0,
    gender: 'other',
    goals: [],
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);

  const calculateBMI = (weight: number, height: number): number => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const calculateBMR = (
    weight: number,
    height: number,
    age: number,
    gender: 'male' | 'female' | 'other'
  ): number => {
    // Mifflin-St Jeor Equation
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else if (gender === 'female') {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
    // Average for 'other'
    return 10 * weight + 6.25 * height - 5 * age - 78;
  };

  const handleNext = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const steps: OnboardingStep[] = ['age', 'weight', 'height', 'goals', 'complete'];
    const currentIndex = steps.indexOf(currentStep);

    if (currentStep === 'goals') {
      // Calculate and save to Supabase
      const bmi = calculateBMI(data.weight, data.height);
      const bmr = calculateBMR(data.weight, data.height, data.age, data.gender);
      
      setShowShimmer(true);
      playSuccessSound();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Update profile
          await supabase
            .from('profiles')
            .update({
              age: data.age,
              weight: data.weight,
              height: data.height,
              gender: data.gender,
              water_goal: Math.round(data.weight * 35), // 35ml per kg
            })
            .eq('id', user.id);

          // Check if user has paid plan (Basic or higher)
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_plan')
            .eq('id', user.id)
            .single();

          const plan = profile?.subscription_plan || 'free';

          // Trigger Body Analysis for paid plans (99, 299, 499, 999)
          if (plan !== 'free') {
            try {
              await fetch('/api/body-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  age: data.age,
                  weight: data.weight,
                  height: data.height,
                  gender: data.gender,
                  goal: data.goals[0] || 'general fitness',
                }),
              });
            } catch (analysisError) {
              console.error('Body analysis failed:', analysisError);
            }
          }
        }
      } catch (error) {
        console.error('Error saving onboarding data:', error);
      }

      setTimeout(() => {
        setCurrentStep('complete');
        setIsAnimating(false);
      }, 2000);
    } else {
      setTimeout(() => {
        setCurrentStep(steps[currentIndex + 1]);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleGoalToggle = (goal: string) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const springButton = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 17,
    },
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const shimmerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: [0, 1, 0],
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {currentStep === 'age' && (
            <motion.div
              key="age"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              custom={1}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="glass-card rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">What's your age?</h2>
              <p className="text-gray-400 mb-6">This helps us calculate your BMR</p>
              
              <input
                type="number"
                value={data.age || ''}
                onChange={(e) => setData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                className="glass-button w-full p-4 rounded-2xl text-white text-3xl text-center mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="25"
              />

              <motion.button
                {...springButton}
                onClick={handleNext}
                disabled={!data.age || data.age < 1 || data.age > 120}
                className="w-full glass-button py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {currentStep === 'weight' && (
            <motion.div
              key="weight"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              custom={1}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="glass-card rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">What's your weight?</h2>
              <p className="text-gray-400 mb-6">In kilograms (kg)</p>
              
              <input
                type="number"
                value={data.weight || ''}
                onChange={(e) => setData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                className="glass-button w-full p-4 rounded-2xl text-white text-3xl text-center mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="70"
              />

              <motion.button
                {...springButton}
                onClick={handleNext}
                disabled={!data.weight || data.weight < 20 || data.weight > 300}
                className="w-full glass-button py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {currentStep === 'height' && (
            <motion.div
              key="height"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              custom={1}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="glass-card rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">What's your height?</h2>
              <p className="text-gray-400 mb-6">In centimeters (cm)</p>
              
              <input
                type="number"
                value={data.height || ''}
                onChange={(e) => setData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                className="glass-button w-full p-4 rounded-2xl text-white text-3xl text-center mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="175"
              />

              <div className="flex gap-3 mb-6">
                {(['male', 'female', 'other'] as const).map((gender) => (
                  <motion.button
                    key={gender}
                    {...springButton}
                    onClick={() => setData(prev => ({ ...prev, gender }))}
                    className={`flex-1 py-3 rounded-xl font-semibold capitalize ${
                      data.gender === gender
                        ? 'bg-purple-600 text-white'
                        : 'glass-button text-gray-300'
                    }`}
                  >
                    {gender}
                  </motion.button>
                ))}
              </div>

              <motion.button
                {...springButton}
                onClick={handleNext}
                disabled={!data.height || data.height < 100 || data.height > 250}
                className="w-full glass-button py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {currentStep === 'goals' && (
            <motion.div
              key="goals"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              custom={1}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="glass-card rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">What are your goals?</h2>
              <p className="text-gray-400 mb-6">Select all that apply</p>
              
              <div className="space-y-3 mb-6">
                {[
                  'Lose weight',
                  'Build muscle',
                  'Maintain weight',
                  'Improve energy',
                  'Eat healthier',
                ].map((goal) => (
                  <motion.button
                    key={goal}
                    {...springButton}
                    onClick={() => handleGoalToggle(goal)}
                    className={`w-full p-4 rounded-xl text-left font-semibold flex items-center gap-3 ${
                      data.goals.includes(goal)
                        ? 'bg-purple-600 text-white'
                        : 'glass-button text-gray-300'
                    }`}
                  >
                    {data.goals.includes(goal) && <Check className="w-5 h-5" />}
                    {goal}
                  </motion.button>
                ))}
              </div>

              <motion.button
                {...springButton}
                onClick={handleNext}
                disabled={data.goals.length === 0}
                className="w-full glass-button py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Complete Setup <Sparkles className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="glass-card rounded-3xl p-8 text-center"
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="inline-block mb-6"
              >
                <Sparkles className="w-16 h-16 text-purple-400" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-white mb-2">You're all set!</h2>
              <p className="text-gray-400 mb-6">
                Your BMI: {calculateBMI(data.weight, data.height).toFixed(1)}
              </p>
              <p className="text-gray-400 mb-6">
                Your BMR: {calculateBMR(data.weight, data.height, data.age, data.gender).toFixed(0)} kcal/day
              </p>

              <motion.button
                {...springButton}
                onClick={() => window.location.href = '/'}
                className="w-full glass-button py-4 rounded-2xl text-white font-semibold"
              >
                Start Your Journey
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {showShimmer && (
          <motion.div
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.5,
              repeat: 1,
              ease: 'linear',
            }}
            className="fixed inset-0 pointer-events-none z-50"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.3), transparent)',
              backgroundSize: '200% 100%',
            }}
          />
        )}
      </div>
    </div>
  );
}
