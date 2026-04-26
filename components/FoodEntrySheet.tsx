'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Camera, Plus, Grid3x3, Lock } from 'lucide-react';
import SmartSearch from './SmartSearch';
import MagicCamera from './MagicCamera';
import RapidGrid from './RapidGrid';
import PremiumSheet from './PremiumSheet';

interface FoodEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FoodEntrySheet({ isOpen, onClose }: FoodEntrySheetProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'camera' | 'grid'>('grid');
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'starter' | 'pro' | 'elite' | 'unlimited'>('free');

  const handleUpgrade = async () => {
    try {
      // Create Cashfree checkout session
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'unlimited',
          amount: 999,
        }),
      });

      if (response.ok) {
        const { checkoutUrl } = await response.json();
        // Redirect to Cashfree checkout
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0a0e1a] rounded-t-3xl z-50 max-h-[85vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Add Food</h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('grid')}
                className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-colors ${
                  activeTab === 'grid'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
                <span>Grid</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-colors ${
                  activeTab === 'search'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                <Search className="w-5 h-5" />
                <span>Search</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (userPlan === 'free') {
                    setIsPremiumOpen(true);
                  } else {
                    setActiveTab('camera');
                  }
                }}
                className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-colors ${
                  userPlan === 'free'
                    ? 'bg-white/10 text-gray-500'
                    : activeTab === 'camera'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                {userPlan === 'free' ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
                <span>{userPlan === 'free' ? 'Locked' : 'Camera'}</span>
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'grid' && (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <RapidGrid />
                  </motion.div>
                )}
                {activeTab === 'search' && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <SmartSearch />
                  </motion.div>
                )}
                {activeTab === 'camera' && (
                  <motion.div
                    key="camera"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <MagicCamera />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Premium Bottom Sheet */}
          <PremiumSheet
            isOpen={isPremiumOpen}
            onClose={() => setIsPremiumOpen(false)}
            onUpgrade={handleUpgrade}
          />
        </>
      )}
    </AnimatePresence>
  );
}
