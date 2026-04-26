'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { playClickSound } from '@/lib/sounds';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    playClickSound();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Sparkles className="w-16 h-16 text-purple-400" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">CommunityGuard</h1>
          <p className="text-gray-400">AI-Powered Nutrition Tracking</p>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGetStarted}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-2xl text-white font-bold text-lg shadow-[0_0_30px_rgba(168,85,247,0.3)]"
        >
          Get Started
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-4 text-gray-500 text-sm"
        >
          Install as app for best experience
        </motion.p>
      </motion.div>
    </div>
  );
}
